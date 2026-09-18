"""
Portable geometry column type.

Darukaa.Earth is designed to run on PostgreSQL + PostGIS in production (the
GeoAlchemy2 `Geometry` type gives us real spatial indexing, ST_* queries and
polygon storage). For local development and CI, however, spinning up a full
PostGIS instance is often overkill, so this module provides a SQLAlchemy
TypeDecorator that:

  * uses a genuine PostGIS `geometry` column when the engine dialect is
    postgresql (via GeoAlchemy2), giving full spatial capabilities, and
  * falls back to storing the same value as a GeoJSON string in a SQLite
    TEXT column when running locally/tests, so `pytest` and `flask run`
    work with zero external services.

Application code always works with plain GeoJSON dicts, so the rest of the
codebase never needs to know which backend is active.
"""

import json

from sqlalchemy import Text
from sqlalchemy.types import TypeDecorator

try:
    from geoalchemy2 import Geometry as _PostGISGeometry
    from geoalchemy2.shape import from_shape, to_shape
    from shapely.geometry import shape, mapping

    GEOALCHEMY2_AVAILABLE = True
except ImportError:  # pragma: no cover
    GEOALCHEMY2_AVAILABLE = False


class GeometryType(TypeDecorator):
    """Stores a GeoJSON geometry, backed by PostGIS on Postgres, JSON text elsewhere."""

    impl = Text
    cache_ok = True

    def __init__(self, geometry_type="GEOMETRY", srid=4326, *args, **kwargs):
        self.geometry_type = geometry_type
        self.srid = srid
        super().__init__(*args, **kwargs)

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql" and GEOALCHEMY2_AVAILABLE:
            return dialect.type_descriptor(_PostGISGeometry(geometry_type=self.geometry_type, srid=self.srid))
        return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        # Already a GeoJSON-like dict
        geojson = value if isinstance(value, dict) else json.loads(value)
        if dialect.name == "postgresql" and GEOALCHEMY2_AVAILABLE:
            return from_shape(shape(geojson), srid=self.srid)
        return json.dumps(geojson)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql" and GEOALCHEMY2_AVAILABLE:
            return mapping(to_shape(value))
        return json.loads(value)

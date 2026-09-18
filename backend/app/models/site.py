from datetime import datetime, timezone

from app.extensions import db
from app.models.geo_types import GeometryType


class Site(db.Model):
    __tablename__ = "sites"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    country = db.Column(db.String(100), nullable=True)

    # Stored as GeoJSON (Polygon or Point). Backed by real PostGIS geometry
    # on Postgres, GeoJSON text on SQLite. See app/models/geo_types.py
    geometry = db.Column(GeometryType(geometry_type="GEOMETRY", srid=4326), nullable=False)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    metrics = db.relationship("SiteMetric", backref="site", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, include_metrics=False):
        data = {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "description": self.description,
            "country": self.country,
            "geometry": self.geometry,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_metrics:
            data["metrics"] = [m.to_dict() for m in self.metrics.order_by("recorded_date")]
        return data

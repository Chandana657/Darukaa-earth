/** Returns [lon, lat] center point for a Point or Polygon GeoJSON geometry. */
export function centroidOf(geometry) {
  if (geometry.type === "Point") return geometry.coordinates;
  if (geometry.type === "Polygon") {
    const ring = geometry.coordinates[0];
    const [sumLon, sumLat] = ring.reduce(
      ([lon, lat], [x, y]) => [lon + x, lat + y],
      [0, 0],
    );
    return [sumLon / ring.length, sumLat / ring.length];
  }
  return [0, 0];
}

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/**
 * A small interactive map that lets the admin draw a single polygon
 * representing a new project site. Calls onChange(geojsonGeometry|null).
 */
export default function SiteDrawMap({
  onChange,
  center = [20, 10],
  zoom = 1.5,
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);

  useEffect(() => {
    if (!MAPBOX_TOKEN) return undefined;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center,
      zoom,
    });
    mapRef.current = map;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: "draw_polygon",
    });
    drawRef.current = draw;
    map.addControl(draw);
    map.addControl(new mapboxgl.NavigationControl(), "top-left");

    const emitChange = () => {
      const data = draw.getAll();
      if (data.features.length > 0) {
        onChange(data.features[data.features.length - 1].geometry);
      } else {
        onChange(null);
      }
    };

    map.on("draw.create", emitChange);
    map.on("draw.update", emitChange);
    map.on("draw.delete", emitChange);

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="map-token-missing">
        Set <code>VITE_MAPBOX_TOKEN</code> in <code>frontend/.env</code> to draw
        sites on the map. You can still create a site by entering coordinates
        manually below.
      </div>
    );
  }

  return <div ref={mapContainer} className="draw-map" />;
}

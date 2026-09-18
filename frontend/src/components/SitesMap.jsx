import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { centroidOf } from "../utils/geo.js";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/**
 * Renders all project sites as markers/polygons on one interactive map.
 * Clicking a site calls onSiteClick(site).
 */
export default function SitesMap({ sites, onSiteClick, onMapReady }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!MAPBOX_TOKEN) return undefined;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [20, 10],
      zoom: 1.5,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-left");
    onMapReady?.(map);

    map.on("load", () => {
      const features = sites
        .filter((s) => s.geometry)
        .map((s) => ({
          type: "Feature",
          properties: { id: s.id, name: s.name },
          geometry: s.geometry,
        }));

      map.addSource("sites", {
        type: "geojson",
        data: { type: "FeatureCollection", features },
      });

      map.addLayer({
        id: "site-fill",
        type: "fill",
        source: "sites",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "fill-color": "#2e7d32", "fill-opacity": 0.35 },
      });
      map.addLayer({
        id: "site-outline",
        type: "line",
        source: "sites",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "line-color": "#2e7d32", "line-width": 2 },
      });
      map.addLayer({
        id: "site-point",
        type: "circle",
        source: "sites",
        filter: ["==", ["geometry-type"], "Point"],
        paint: { "circle-radius": 7, "circle-color": "#2e7d32" },
      });

      ["site-fill", "site-point"].forEach((layerId) => {
        map.on("click", layerId, (e) => {
          const feature = e.features[0];
          const site = sites.find((s) => s.id === feature.properties.id);
          if (site) onSiteClick(site);
        });
        map.on(
          "mouseenter",
          layerId,
          () => (map.getCanvas().style.cursor = "pointer"),
        );
        map.on(
          "mouseleave",
          layerId,
          () => (map.getCanvas().style.cursor = ""),
        );
      });
    });

    return () => {
      onMapReady?.(null);
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="map-token-missing">
        Set <code>VITE_MAPBOX_TOKEN</code> in <code>frontend/.env</code> to view
        the interactive map. Meanwhile, here are your sites:
        <ul>
          {sites.map((s) => (
            <li key={s.id}>
              <button className="btn-link" onClick={() => onSiteClick(s)}>
                {s.name}
              </button>{" "}
              —{" "}
              {centroidOf(s.geometry)
                .map((n) => n.toFixed(2))
                .join(", ")}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return <div ref={mapContainer} className="sites-map" />;
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listAllSites } from "../api/projects";
import SitesMap from "../components/SitesMap.jsx";
import { centroidOf } from "../utils/geo.js";

export default function MapPage() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const mapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    listAllSites()
      .then(setSites)
      .catch(() => setError("Could not load sites."))
      .finally(() => setLoading(false));
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return sites
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.country || "").toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, sites]);

  const flyToSite = (site) => {
    if (mapRef.current && site.geometry) {
      mapRef.current.flyTo({
        center: centroidOf(site.geometry),
        zoom: 8,
        essential: true,
      });
    }
    setQuery(site.name);
    setShowResults(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (matches.length > 0) flyToSite(matches[0]);
  };

  if (loading) return <div className="page-loading">Loading map…</div>;

  return (
    <div>
      <h1>Sites Map</h1>
      <p className="muted">
        Search for a site to fly to it, or click a shape on the map to view its
        analytics.
      </p>
      {error && <div className="alert-error">{error}</div>}

      <form className="map-search" onSubmit={handleSubmit}>
        <input
          type="search"
          placeholder="Search sites by name or country…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
        />
        {query && (
          <button
            type="button"
            className="map-search-clear"
            onClick={() => {
              setQuery("");
              setShowResults(false);
            }}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
        {showResults && query && (
          <ul className="map-search-results">
            {matches.length === 0 ? (
              <li className="map-search-empty">
                No sites match &ldquo;{query}&rdquo;
              </li>
            ) : (
              matches.map((s) => (
                <li key={s.id}>
                  <button type="button" onMouseDown={() => flyToSite(s)}>
                    <span className="map-search-result-name">{s.name}</span>
                    <span className="map-search-result-country">
                      {s.country}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="map-search-view"
                    onMouseDown={() => navigate(`/dashboard/sites/${s.id}`)}
                  >
                    View →
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </form>

      <SitesMap
        sites={sites}
        onMapReady={(map) => (mapRef.current = map)}
        onSiteClick={(site) => navigate(`/dashboard/sites/${site.id}`)}
      />
    </div>
  );
}

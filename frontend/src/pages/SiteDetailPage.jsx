import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSite, getSiteMetrics } from "../api/projects";
import MetricChart from "../components/MetricChart.jsx";

export default function SiteDetailPage() {
  const { siteId } = useParams();
  const [site, setSite] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([getSite(siteId), getSiteMetrics(siteId)])
      .then(([s, m]) => {
        setSite(s);
        setMetrics(m);
      })
      .catch(() => setError("Could not load site."))
      .finally(() => setLoading(false));
  }, [siteId]);

  if (loading) return <div className="page-loading">Loading site…</div>;
  if (error) return <div className="alert-error">{error}</div>;
  if (!site) return null;

  const latest = metrics[metrics.length - 1];

  return (
    <div>
      <Link to={`/dashboard/projects/${site.project_id}`} className="back-link">
        ← Back to project
      </Link>
      <h1>{site.name}</h1>
      <p className="muted">{site.country}</p>
      <p>{site.description}</p>

      {latest && (
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-label">Carbon (latest)</span>
            <span className="stat-value">{latest.carbon_value} t CO₂e</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Biodiversity (latest)</span>
            <span className="stat-value">
              {latest.biodiversity_value} species
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Performance</span>
            <span className="stat-value">{latest.performance}/100</span>
          </div>
        </div>
      )}

      {metrics.length === 0 ? (
        <p>No historical metrics recorded for this site yet.</p>
      ) : (
        <>
          <div className="card">
            <h3>Carbon sequestration over time</h3>
            <MetricChart
              metrics={metrics}
              field="carbon_value"
              label="Carbon (t CO₂e)"
              color="#2e7d32"
            />
          </div>
          <div className="card">
            <h3>Biodiversity (species count) over time</h3>
            <MetricChart
              metrics={metrics}
              field="biodiversity_value"
              label="Species count"
              color="#1565c0"
            />
          </div>
          <div className="card">
            <h3>Overall performance index</h3>
            <MetricChart
              metrics={metrics}
              field="performance"
              label="Performance (0-100)"
              color="#ef6c00"
            />
          </div>
        </>
      )}
    </div>
  );
}

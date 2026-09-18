import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listProjects, listAllSites } from "../api/projects";

export default function OverviewPage() {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([listProjects(), listAllSites()])
      .then(([p, s]) => {
        setProjects(p);
        setSites(s);
      })
      .catch(() => setError("Could not load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  const totalCarbonSites = sites.length;

  if (loading) return <div className="page-loading">Loading overview…</div>;

  return (
    <div>
      <h1>Overview</h1>
      {error && <div className="alert-error">{error}</div>}
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Projects</span>
          <span className="stat-value">{projects.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Sites</span>
          <span className="stat-value">{totalCarbonSites}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Project types tracked</span>
          <span className="stat-value">
            {new Set(projects.map((p) => p.project_type)).size}
          </span>
        </div>
      </div>

      <h2>Recent projects</h2>
      {projects.length === 0 ? (
        <p>
          No projects yet.{" "}
          <Link to="/dashboard/projects">Create your first project</Link>.
        </p>
      ) : (
        <ul className="project-list">
          {projects.slice(0, 6).map((p) => (
            <li key={p.id}>
              <Link to={`/dashboard/projects/${p.id}`}>{p.name}</Link>
              <span className={`badge badge-${p.project_type}`}>
                {p.project_type}
              </span>
              <span className="muted">{p.site_count} site(s)</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

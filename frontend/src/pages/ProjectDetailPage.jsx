import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProject, addSite } from "../api/projects";
import SiteDrawMap from "../components/SiteDrawMap.jsx";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [geometry, setGeometry] = useState(null);
  const [form, setForm] = useState({ name: "", country: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    getProject(projectId)
      .then(setProject)
      .catch(() => setError("Could not load project."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [projectId]);

  const handleAddSite = async (e) => {
    e.preventDefault();
    if (!geometry) {
      setError("Draw a polygon (or point) on the map before saving the site.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await addSite(projectId, { ...form, geometry });
      setForm({ name: "", country: "", description: "" });
      setGeometry(null);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || "Could not add site.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-loading">Loading project…</div>;
  if (!project) return <div className="alert-error">Project not found.</div>;

  const countries = [
    ...new Set((project.sites || []).map((s) => s.country).filter(Boolean)),
  ];

  return (
    <div>
      <Link to="/dashboard/projects" className="back-link">
        ← All projects
      </Link>
      <div className="page-header">
        <div>
          <h1>{project.name}</h1>
          <span className={`badge badge-${project.project_type}`}>
            {project.project_type}
          </span>
        </div>
        <button onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Add Site"}
        </button>
      </div>
      <p>{project.description || "No description provided."}</p>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Sites</span>
          <span className="stat-value">{project.sites?.length || 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Countries</span>
          <span className="stat-value">{countries.length || "—"}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Project type</span>
          <span className="stat-value" style={{ textTransform: "capitalize" }}>
            {project.project_type}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Created</span>
          <span className="stat-value">
            {new Date(project.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {countries.length > 0 && (
        <p className="muted project-countries">
          Active in: {countries.join(", ")}
        </p>
      )}

      {error && <div className="alert-error">{error}</div>}

      {showForm && (
        <form className="card form" onSubmit={handleAddSite}>
          <label>
            Site name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label>
            Country
            <input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </label>
          <label>
            Description
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
            />
          </label>
          <label>Draw the site boundary on the map</label>
          <SiteDrawMap onChange={setGeometry} />
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save site"}
          </button>
        </form>
      )}

      <h2>Sites ({project.sites?.length || 0})</h2>
      {project.sites?.length ? (
        <ul className="project-list">
          {project.sites.map((s) => (
            <li key={s.id}>
              <Link to={`/dashboard/sites/${s.id}`}>{s.name}</Link>
              <span className="muted">{s.country}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No sites yet. Add one above.</p>
      )}
    </div>
  );
}

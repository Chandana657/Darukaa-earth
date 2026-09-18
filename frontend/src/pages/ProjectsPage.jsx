import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listProjects, createProject } from "../api/projects";

const PROJECT_TYPES = ["carbon", "biodiversity", "mixed"];
const FILTERS = ["all", ...PROJECT_TYPES];

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    name: "",
    description: "",
    project_type: "carbon",
  });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    listProjects()
      .then(setProjects)
      .catch(() => setError("Could not load projects."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createProject(form);
      setForm({ name: "", description: "", project_type: "carbon" });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || "Could not create project.");
    } finally {
      setSubmitting(false);
    }
  };

  const counts = useMemo(() => {
    const c = { all: projects.length };
    for (const t of PROJECT_TYPES) c[t] = 0;
    projects.forEach((p) => {
      c[p.project_type] = (c[p.project_type] || 0) + 1;
    });
    return c;
  }, [projects]);

  const visibleProjects = useMemo(
    () =>
      filter === "all"
        ? projects
        : projects.filter((p) => p.project_type === filter),
    [projects, filter],
  );

  return (
    <div>
      <div className="page-header">
        <h1>Projects</h1>
        <button onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ New Project"}
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {showForm && (
        <form className="card form" onSubmit={handleCreate}>
          <label>
            Project name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
          </label>
          <label>
            Description
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
            />
          </label>
          <label>
            Project type
            <select
              value={form.project_type}
              onChange={(e) =>
                setForm({ ...form, project_type: e.target.value })
              }
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create project"}
          </button>
        </form>
      )}

      <div
        className="filter-tabs"
        role="tablist"
        aria-label="Filter projects by type"
      >
        {FILTERS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={filter === t}
            className={`filter-tab${filter === t ? " active" : ""}`}
            onClick={() => setFilter(t)}
          >
            {t}
            <span className="filter-tab-count">{counts[t] || 0}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loading">Loading projects…</div>
      ) : projects.length === 0 ? (
        <p>No projects yet. Create one to get started.</p>
      ) : visibleProjects.length === 0 ? (
        <p>No {filter} projects yet.</p>
      ) : (
        <div className="project-card-grid">
          {visibleProjects.map((p) => (
            <Link
              key={p.id}
              to={`/dashboard/projects/${p.id}`}
              className="project-card"
            >
              <div className={`project-card-thumb thumb-${p.project_type}`}>
                <span className={`badge badge-${p.project_type}`}>
                  {p.project_type}
                </span>
              </div>
              <div className="project-card-body">
                <h3>{p.name}</h3>
                <p className="project-card-desc">
                  {p.description || "No description provided."}
                </p>
                <div className="project-card-meta">
                  <span>
                    {p.site_count} {p.site_count === 1 ? "site" : "sites"}
                  </span>
                  <span>
                    {new Date(p.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <span className="project-card-cta">View details →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

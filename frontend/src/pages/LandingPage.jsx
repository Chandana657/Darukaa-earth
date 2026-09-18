import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { listProjects, listAllSites } from "../api/projects";
import Reveal from "../components/Reveal.jsx";

const FEATURES = [
  {
    icon: "🗺️",
    title: "Geospatial site mapping",
    text: "Draw a project's exact boundary as a polygon on an interactive Mapbox map — not just a lat/lon pin — backed by real PostGIS geometry.",
  },
  {
    icon: "🌱",
    title: "Carbon & biodiversity analytics",
    text: "Track carbon sequestration, species counts and a composite performance index for every site, charted month over month.",
  },
  {
    icon: "🔐",
    title: "Secure admin access",
    text: "JWT-based authentication protects every write — creating projects, drawing sites, logging metrics — while the map stays viewable.",
  },
  {
    icon: "📊",
    title: "Live, data-driven dashboard",
    text: "Every number on this page and in the app is fetched live from the API — nothing here is a static screenshot.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create a project",
    text: "Name it, describe it, and classify it as a carbon, biodiversity or mixed initiative.",
  },
  {
    step: "02",
    title: "Draw its sites",
    text: "Add one or more geographic sites to the project by drawing their boundary directly on the map.",
  },
  {
    step: "03",
    title: "Track its impact",
    text: "Record carbon, biodiversity and performance metrics over time and review them as historical charts.",
  },
];

const TECH = [
  "React",
  "Flask",
  "PostgreSQL + PostGIS",
  "Mapbox GL JS",
  "Chart.js",
  "JWT",
];

export default function LandingPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ projects: 0, sites: 0, countries: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([listProjects(), listAllSites()])
      .then(([projects, sites]) => {
        const countries = new Set(sites.map((s) => s.country).filter(Boolean));
        setStats({
          projects: projects.length,
          sites: sites.length,
          countries: countries.size,
        });
        setStatsLoaded(true);
      })
      .catch(() => setStatsLoaded(false));
  }, []);

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-brand">🌍 Darukaa.Earth</div>
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#tech">Tech stack</a>
        </div>
        <div className="landing-nav-cta">
          {user ? (
            <Link to="/dashboard" className="btn-solid">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Sign in
              </Link>
              <Link to="/register" className="btn-solid">
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      <header className="hero">
        <div className="hero-content">
          <span className="hero-eyebrow">
            BUILT ON POSTGIS, DESIGNED FOR DECISIONS
          </span>
          <h1>
            Nature project data,
            <br />
            turned into a live map
          </h1>
          <p className="hero-subtitle">
            Darukaa.Earth is a geospatial analytics platform for carbon and
            biodiversity projects: draw your sites on a map, and watch their
            carbon, biodiversity and performance metrics come to life.
          </p>
          <div className="hero-actions">
            <Link
              to={user ? "/dashboard" : "/register"}
              className="btn-solid btn-lg"
            >
              {user ? "Go to dashboard" : "Get started free"}
            </Link>
            <a href="#how-it-works" className="btn-ghost btn-lg">
              See how it works
            </a>
          </div>
        </div>
      </header>

      <section className="stats-strip">
        <Reveal className="stats-strip-inner" as="div">
          <div className="stat-block">
            <span className="stat-block-value">
              {statsLoaded ? stats.projects : "–"}
            </span>
            <span className="stat-block-label">Projects tracked</span>
          </div>
          <div className="stat-block">
            <span className="stat-block-value">
              {statsLoaded ? stats.sites : "–"}
            </span>
            <span className="stat-block-label">Sites mapped</span>
          </div>
          <div className="stat-block">
            <span className="stat-block-value">
              {statsLoaded ? stats.countries : "–"}
            </span>
            <span className="stat-block-label">Countries represented</span>
          </div>
          <div className="stat-block">
            <span className="stat-block-value">Live</span>
            <span className="stat-block-label">Pulled from the real API</span>
          </div>
        </Reveal>
      </section>

      <section id="features" className="section">
        <Reveal as="h2" className="section-title">
          Everything an environmental project needs
        </Reveal>
        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} className="feature-card" delay={i * 80}>
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="section section-alt">
        <Reveal as="h2" className="section-title">
          How it works
        </Reveal>
        <div className="steps-grid">
          {STEPS.map((s, i) => (
            <Reveal key={s.step} className="step-card" delay={i * 100}>
              <span className="step-number">{s.step}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="tech" className="section">
        <Reveal as="h2" className="section-title">
          Built with a real geospatial stack
        </Reveal>
        <Reveal className="tech-badges">
          {TECH.map((t) => (
            <span key={t} className="tech-badge">
              {t}
            </span>
          ))}
        </Reveal>
      </section>

      <section className="cta-section">
        <Reveal>
          <h2>Ready to see your projects on the map?</h2>
          <p>
            Create a free admin account and add your first project in under a
            minute.
          </p>
          <Link
            to={user ? "/dashboard" : "/register"}
            className="btn-solid btn-lg"
          >
            {user ? "Go to dashboard" : "Get started free"}
          </Link>
        </Reveal>
      </section>

      <footer className="landing-footer">
        <div className="landing-brand">🌍 Darukaa.Earth</div>
        <p className="muted">
          Built for the Darukaa.Earth Full-Stack Developer Hackathon Challenge.
        </p>
        <div className="footer-links">
          <Link to="/login">Sign in</Link>
          <Link to="/register">Register</Link>
          <a href="#features">Features</a>
        </div>
      </footer>
    </div>
  );
}

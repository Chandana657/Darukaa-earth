# Darukaa.Earth

A full-stack geospatial data analytics platform for managing and visualizing
carbon and biodiversity projects — built for the Darukaa.Earth Full-Stack
Developer Hackathon Challenge.

An administrator can create environmental projects, draw geographical sites
on an interactive map, and view carbon/biodiversity/performance analytics
for each site over time.

## Table of contents

- [Architecture](#architecture)
- [Database schema](#database-schema)
- [Dataset & mocks](#dataset--mocks)
- [Local setup](#local-setup)
- [Running tests & linting](#running-tests--linting)
- [CI/CD](#cicd)
- [Pre-commit hooks](#pre-commit-hooks)
- [Deployment](#deployment)
- [Technical trade-offs](#technical-trade-offs)
- [Project structure](#project-structure)

## Architecture

```
                    DARUKAA.EARTH
                          |
              +-----------+-----------+
              |                       |
           FRONTEND                BACKEND
         (React + Vite)         (Flask REST API)
              |                       |
       +------+------+          +-----+-----+
       |             |          |           |
    Mapbox        Chart.js    JWT        SQLAlchemy
    GL JS +      (analytics) (auth)    + GeoAlchemy2
  mapbox-gl-draw                            |
       |             |          +-----+-----+
       +------+------+                |
              |                 PostgreSQL + PostGIS
              +-----------------------+
                          |
                    REST API over HTTPS
```

- **Frontend** (`/frontend`): React 18 + Vite SPA. React Router for
  navigation, a small `AuthContext` for the JWT session, Mapbox GL JS +
  `@mapbox/mapbox-gl-draw` for the interactive map and polygon drawing, and
  `react-chartjs-2` (Chart.js) for the historical carbon/biodiversity/
  performance charts.
- **Backend** (`/backend`): Flask REST API structured as an app factory with
  blueprints (`auth`, `projects`, `sites`). Flask-JWT-Extended handles
  authentication, Flask-SQLAlchemy + Flask-Migrate handle the ORM and
  migrations, Flask-Bcrypt hashes passwords.
- **Database**: PostgreSQL with the PostGIS extension for real spatial data
  (polygons/points, indexes, and future `ST_*` queries). See
  [Geometry storage](#geometry-storage-postgis--sqlite) for how local dev
  works without a Postgres install.
- **CI/CD**: GitHub Actions lints, tests and builds both apps on every push
  and pull request (`.github/workflows/ci.yml`).
- **Deployment**: designed to deploy the API and the static frontend build
  separately to Render/Vercel/Heroku (see [Deployment](#deployment)).

### Geometry storage: PostGIS + SQLite

The challenge requires PostgreSQL + PostGIS, and that's what the app is
built against — the `Site.geometry` column uses a real PostGIS `geometry`
type (via GeoAlchemy2) storing Polygons/Points with spatial indexing when
`DATABASE_URL` points at Postgres.

For local development and CI, requiring a running PostGIS instance for every
`pytest` run adds friction, so `app/models/geo_types.py` defines a
`GeometryType` SQLAlchemy `TypeDecorator` that automatically:

- uses PostGIS `Geometry` on a `postgresql://` connection, or
- falls back to a plain GeoJSON string in a SQLite `TEXT` column otherwise.

Application code (routes, tests) always works with plain GeoJSON dicts
either way, so nothing else in the codebase needs to know which backend is
active. `docker-compose.yml` spins up a real `postgis/postgis` container for
anyone who wants to develop against the production-equivalent database.

## Database schema

```
users
-----------------
id              PK
name
email           unique
password_hash
role
created_at

projects
-----------------
id              PK
name
description
project_type    ('carbon' | 'biodiversity' | 'mixed')
created_at
created_by      FK -> users.id

sites
-----------------
id              PK
project_id      FK -> projects.id
name
description
country
geometry        PostGIS geometry (Polygon/Point), GeoJSON on SQLite
created_at

site_metrics
-----------------
id                  PK
site_id             FK -> sites.id
recorded_date
carbon_value        (tons CO2e)
biodiversity_value  (species count)
performance         (0-100 composite index)
```

Relationships: `User 1—* Project 1—* Site 1—* SiteMetric`. A project can
have many sites (User Story 1); every site is drawn as a polygon on the map
(User Story 2); clicking a site loads its `site_metrics` time series for the
analytics view (User Story 3).

## Dataset & mocks

The challenge explicitly allows freely-chosen or mocked datasets, provided
the choice is documented (`backend/seed.py` has the full rationale in its
docstring). In short:

- **Carbon (`carbon_value`, t CO2e)** trends upward with noise, modeling a
  maturing reforestation project where sequestration accelerates as trees
  grow.
- **Biodiversity (`biodiversity_value`, species count)** trends upward more
  slowly, reflecting that ecosystem recovery typically lags carbon capture.
- **Performance** is a synthetic 0–100 composite of the two, giving the
  dashboard a single at-a-glance number without inventing an unrelated
  fourth metric.

Run `python seed.py` (see below) to populate 3 sample projects, 6 sites with
real-world-ish coordinates, and 24 months of mock metrics per site.

## Local setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- (optional) Docker, if you want a real PostGIS database instead of SQLite

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # defaults to SQLite, no DB setup needed
python seed.py                  # creates demo admin + sample projects/sites/metrics
python run.py                   # starts the API on http://localhost:5000
```

Demo login after seeding: `admin@darukaa.earth` / `password123`.

To use real PostgreSQL + PostGIS instead of SQLite:

```bash
docker compose up -d
# in backend/.env:
# DATABASE_URL=postgresql://darukaa:darukaa@localhost:5432/darukaa_earth
flask db upgrade   # or just run.py — db.create_all() runs via seed.py for the demo
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# set VITE_MAPBOX_TOKEN to a free token from https://account.mapbox.com/access-tokens/
npm run dev                     # starts the app on http://localhost:5173
```

Without a Mapbox token the map screens fall back to a plain list view so the
rest of the app still works — see `SiteDrawMap.jsx` / `SitesMap.jsx`.

## Running tests & linting

```bash
# Backend
cd backend && source venv/bin/activate
pytest -q
flake8 app run.py seed.py
black --check app run.py seed.py tests

# Frontend
cd frontend
npm run test
npm run lint
npm run build
```

## CI/CD

`.github/workflows/ci.yml` runs on every push/PR to `main` with two parallel
jobs:

- **backend**: installs dependencies, runs `flake8`, checks `black`
  formatting, runs the `pytest` suite.
- **frontend**: installs dependencies, runs ESLint, runs the Vitest suite,
  builds the production bundle with Vite.

Both jobs must pass before a PR can be merged. Actual deployment is handled
by the hosting platform's own GitHub integration (Render/Vercel auto-deploy
on push to `main` once CI is green) rather than a deploy step inside this
workflow, so secrets/credentials for the target platform never need to live
in this repo.

## Pre-commit hooks

A Husky hook (`.husky/pre-commit`) runs automatically before every commit:

- **Frontend**: `lint-staged` runs ESLint (`--fix`) and Prettier on staged
  `.js`/`.jsx`/`.css` files.
- **Backend**: `black --check` and `flake8` run against the whole `app/`
  package.

Set up once after cloning:

```bash
npm install --prefix frontend   # installs husky + registers git hooks via "prepare"
```

## Deployment

The frontend and backend deploy as two separate services:

- **Backend (Render/Heroku)**: a Python web service running
  `gunicorn run:app`, with `DATABASE_URL`, `SECRET_KEY`, `JWT_SECRET_KEY` and
  `CORS_ORIGINS` set as environment variables, backed by a managed
  PostgreSQL instance with the `postgis` extension enabled
  (`CREATE EXTENSION postgis;`).
- **Frontend (Vercel/Render static site)**: `npm run build` in `frontend/`,
  publish the `dist/` folder, with `VITE_API_BASE_URL` pointed at the
  deployed backend URL and `VITE_MAPBOX_TOKEN` set as a build-time
  environment variable.

Live demo URL and any credentials needed to test the deployed app are listed
in the submitted `.docx` document, per the challenge's submission
instructions.

## Technical trade-offs

- **Why PostgreSQL + PostGIS?** The challenge is fundamentally about
  geospatial data — sites are geographic areas, not just lat/lon pairs — so
  real polygon storage, spatial indexing and future `ST_*` queries (area,
  intersection, containment) matter more than a generic JSON blob would
  allow.
- **Why React?** A component-based SPA suits an interactive dashboard with
  a map, forms and charts that all need to share state (the logged-in user,
  the selected site) without full page reloads.
- **Why Mapbox GL JS + mapbox-gl-draw?** Vector-tile rendering performs well
  with many sites, satellite/street basemaps make ecological sites easy to
  read, and `mapbox-gl-draw` gives polygon drawing/editing out of the box
  rather than hand-rolling it on Leaflet.
- **Why Chart.js?** Lightweight, well-documented, and `react-chartjs-2`
  keeps the historical line charts declarative and easy to theme
  consistently with the rest of the UI.
- **Why Flask over Django/FastAPI?** The challenge allows any of the three;
  Flask's minimal footprint fit a small, focused REST API best without the
  overhead of Django's batteries-included admin/ORM stack that this
  project doesn't otherwise need.
- **GeoJSON-in-SQLite fallback**: chosen so `pytest` and local development
  work with zero external services, while production still gets real
  PostGIS. The trade-off is that spatial *queries* (not just storage) would
  need a real Postgres connection — acceptable since the current API only
  stores/retrieves geometry rather than running spatial filters yet.

## Project structure

```
darukaa-earth/
├── backend/
│   ├── app/
│   │   ├── models/          # User, Project, Site, SiteMetric, GeometryType
│   │   ├── routes/          # auth, projects, sites blueprints
│   │   ├── config.py
│   │   └── extensions.py
│   ├── tests/                # pytest suite
│   ├── seed.py                # demo data
│   ├── run.py                 # entrypoint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/               # axios client + endpoint wrappers
│   │   ├── components/        # SitesMap, SiteDrawMap, MetricChart, layout
│   │   ├── context/            # AuthContext (JWT session)
│   │   ├── pages/               # Login, Register, Overview, Projects, Map, SiteDetail
│   │   └── styles/
│   └── package.json
├── .github/workflows/ci.yml
├── docker-compose.yml          # optional local PostGIS
└── README.md
```

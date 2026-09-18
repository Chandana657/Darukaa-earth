"""
Seeds the database with a demo admin user, three sample carbon/biodiversity
projects, several sites (real-world-ish polygons) and two years of monthly
mock metrics per site.

Why mock data, and why these numbers:
  * The challenge PDF explicitly allows freely-chosen/mocked datasets as long
    as the choice is documented (see README > "Dataset & mocks").
  * Carbon values trend upward with seasonal noise to resemble a maturing
    reforestation project (sequestration accelerates as trees grow).
  * Biodiversity (species count) trends upward slightly and more slowly,
    reflecting ecosystem recovery lagging carbon capture.
  * Performance is a synthetic 0-100 composite index for the "at a glance"
    chart, derived from the other two so the dashboard has something to
    summarize without inventing a fourth unrelated metric.

Run with: python seed.py
"""

import random
from datetime import date

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.project import Project
from app.models.site import Site
from app.models.site_metric import SiteMetric

random.seed(42)

PROJECTS = [
    {
        "name": "Amazon Reforestation Project",
        "description": "Multi-site reforestation and carbon sequestration initiative across the Amazon basin.",  # noqa: E501
        "project_type": "carbon",
        "sites": [
            {
                "name": "Site A - Acre, Brazil",
                "country": "Brazil",
                "center": (-9.0238, -70.812),
                "base_carbon": 120,
                "base_bio": 40,
            },
            {
                "name": "Site B - Loreto, Peru",
                "country": "Peru",
                "center": (-3.7437, -73.2516),
                "base_carbon": 95,
                "base_bio": 55,
            },
            {
                "name": "Site C - Putumayo, Colombia",
                "country": "Colombia",
                "center": (0.4359, -75.5277),
                "base_carbon": 80,
                "base_bio": 48,
            },
        ],
    },
    {
        "name": "Western Ghats Biodiversity Corridor",
        "description": "Habitat restoration corridor protecting endemic species in the Western Ghats.",
        "project_type": "biodiversity",
        "sites": [
            {
                "name": "Site A - Coorg, Karnataka",
                "country": "India",
                "center": (12.3375, 75.8069),
                "base_carbon": 30,
                "base_bio": 70,
            },
            {
                "name": "Site B - Wayanad, Kerala",
                "country": "India",
                "center": (11.6854, 76.132),
                "base_carbon": 25,
                "base_bio": 88,
            },
        ],
    },
    {
        "name": "Sundarbans Mangrove Restoration",
        "description": "Coastal mangrove replanting for blue carbon storage and storm surge protection.",
        "project_type": "mixed",
        "sites": [
            {
                "name": "Site A - Gosaba",
                "country": "India",
                "center": (22.1667, 88.8),
                "base_carbon": 60,
                "base_bio": 30,
            },
        ],
    },
]


def polygon_around(center, delta=0.05):
    lat, lon = center
    return {
        "type": "Polygon",
        "coordinates": [
            [
                [lon - delta, lat - delta],
                [lon + delta, lat - delta],
                [lon + delta, lat + delta],
                [lon - delta, lat + delta],
                [lon - delta, lat - delta],
            ]
        ],
    }


def monthly_dates(months=24):
    dates = []
    year, month = 2024, 1
    for _ in range(months):
        dates.append(date(year, month, 1))
        month += 1
        if month > 12:
            month = 1
            year += 1
    return dates


def run():
    app = create_app("development")
    with app.app_context():
        db.create_all()

        admin = User.query.filter_by(email="admin@darukaa.earth").first()
        if not admin:
            admin = User(name="Demo Admin", email="admin@darukaa.earth", role="admin")
            admin.set_password("password123")
            db.session.add(admin)
            db.session.commit()
            print("Created demo admin: admin@darukaa.earth / password123")
        else:
            print("Demo admin already exists, skipping.")

        if Project.query.count() > 0:
            print("Projects already exist, skipping seed to avoid duplicates.")
            return

        for p in PROJECTS:
            project = Project(
                name=p["name"],
                description=p["description"],
                project_type=p["project_type"],
                created_by=admin.id,
            )
            db.session.add(project)
            db.session.flush()

            for s in p["sites"]:
                site = Site(
                    project_id=project.id,
                    name=s["name"],
                    description=f"Monitoring site in {s['country']}.",
                    country=s["country"],
                    geometry=polygon_around(s["center"]),
                )
                db.session.add(site)
                db.session.flush()

                carbon = s["base_carbon"]
                bio = s["base_bio"]
                for d in monthly_dates():
                    carbon += random.uniform(1.5, 6.0)
                    bio += random.uniform(-0.5, 1.5)
                    bio = max(bio, 1)
                    performance = min(100, 40 + carbon * 0.15 + bio * 0.3)
                    db.session.add(
                        SiteMetric(
                            site_id=site.id,
                            recorded_date=d,
                            carbon_value=round(carbon, 1),
                            biodiversity_value=round(bio, 1),
                            performance=round(performance, 1),
                        )
                    )

        db.session.commit()
        print("Seeded projects, sites and 24 months of metrics per site.")


if __name__ == "__main__":
    run()

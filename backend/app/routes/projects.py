from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.project import Project
from app.models.site import Site

projects_bp = Blueprint("projects", __name__)

VALID_PROJECT_TYPES = {"carbon", "biodiversity", "mixed"}


@projects_bp.get("")
def list_projects():
    projects = Project.query.order_by(Project.created_at.desc()).all()
    return jsonify({"projects": [p.to_dict() for p in projects]})


@projects_bp.post("")
@jwt_required()
def create_project():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    project_type = (data.get("project_type") or "carbon").strip().lower()

    if not name:
        return jsonify({"error": "name is required"}), 400
    if project_type not in VALID_PROJECT_TYPES:
        return jsonify({"error": f"project_type must be one of {sorted(VALID_PROJECT_TYPES)}"}), 400

    project = Project(
        name=name,
        description=data.get("description", ""),
        project_type=project_type,
        created_by=int(user_id),
    )
    db.session.add(project)
    db.session.commit()

    # Optional: allow creating multiple sites in the same call (User Story 1)
    sites_payload = data.get("sites") or []
    created_sites = []
    for site_data in sites_payload:
        site = _build_site(project.id, site_data)
        if site:
            db.session.add(site)
            created_sites.append(site)
    if created_sites:
        db.session.commit()

    return jsonify({"project": project.to_dict(include_sites=True)}), 201


@projects_bp.get("/<int:project_id>")
def get_project(project_id):
    project = Project.query.get_or_404(project_id)
    return jsonify({"project": project.to_dict(include_sites=True)})


@projects_bp.put("/<int:project_id>")
@jwt_required()
def update_project(project_id):
    project = Project.query.get_or_404(project_id)
    data = request.get_json(silent=True) or {}

    if "name" in data:
        project.name = data["name"].strip()
    if "description" in data:
        project.description = data["description"]
    if "project_type" in data:
        project_type = data["project_type"].strip().lower()
        if project_type not in VALID_PROJECT_TYPES:
            return jsonify({"error": f"project_type must be one of {sorted(VALID_PROJECT_TYPES)}"}), 400
        project.project_type = project_type

    db.session.commit()
    return jsonify({"project": project.to_dict(include_sites=True)})


@projects_bp.delete("/<int:project_id>")
@jwt_required()
def delete_project(project_id):
    project = Project.query.get_or_404(project_id)
    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "project deleted"})


def _build_site(project_id, site_data):
    name = (site_data.get("name") or "").strip()
    geometry = site_data.get("geometry")
    if not name or not geometry:
        return None
    return Site(
        project_id=project_id,
        name=name,
        description=site_data.get("description", ""),
        country=site_data.get("country", ""),
        geometry=geometry,
    )


@projects_bp.post("/<int:project_id>/sites")
@jwt_required()
def add_site(project_id):
    Project.query.get_or_404(project_id)
    data = request.get_json(silent=True) or {}

    geometry = data.get("geometry")
    if not geometry or "type" not in geometry or "coordinates" not in geometry:
        return jsonify({"error": "geometry must be a valid GeoJSON object (Point or Polygon)"}), 400
    if geometry["type"] not in ("Point", "Polygon"):
        return jsonify({"error": "geometry.type must be 'Point' or 'Polygon'"}), 400

    site = _build_site(project_id, data)
    if not site:
        return jsonify({"error": "name and geometry are required"}), 400

    db.session.add(site)
    db.session.commit()
    return jsonify({"site": site.to_dict()}), 201

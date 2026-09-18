from datetime import date

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models.site import Site
from app.models.site_metric import SiteMetric

sites_bp = Blueprint("sites", __name__)


@sites_bp.get("/sites")
def list_all_sites():
    """Used by the map view to plot every site across every project at once."""
    sites = Site.query.all()
    return jsonify({"sites": [s.to_dict() for s in sites]})


@sites_bp.get("/sites/<int:site_id>")
def get_site(site_id):
    site = Site.query.get_or_404(site_id)
    return jsonify({"site": site.to_dict(include_metrics=True)})


@sites_bp.delete("/sites/<int:site_id>")
@jwt_required()
def delete_site(site_id):
    site = Site.query.get_or_404(site_id)
    db.session.delete(site)
    db.session.commit()
    return jsonify({"message": "site deleted"})


@sites_bp.get("/sites/<int:site_id>/metrics")
def get_site_metrics(site_id):
    Site.query.get_or_404(site_id)
    metrics = SiteMetric.query.filter_by(site_id=site_id).order_by(SiteMetric.recorded_date).all()
    return jsonify({"metrics": [m.to_dict() for m in metrics]})


@sites_bp.post("/sites/<int:site_id>/metrics")
@jwt_required()
def add_site_metric(site_id):
    Site.query.get_or_404(site_id)
    data = request.get_json(silent=True) or {}

    try:
        recorded_date = date.fromisoformat(data["recorded_date"])
    except (KeyError, ValueError):
        return jsonify({"error": "recorded_date must be an ISO date string (YYYY-MM-DD)"}), 400

    metric = SiteMetric(
        site_id=site_id,
        recorded_date=recorded_date,
        carbon_value=float(data.get("carbon_value", 0)),
        biodiversity_value=float(data.get("biodiversity_value", 0)),
        performance=float(data.get("performance", 0)),
    )
    db.session.add(metric)
    db.session.commit()
    return jsonify({"metric": metric.to_dict()}), 201

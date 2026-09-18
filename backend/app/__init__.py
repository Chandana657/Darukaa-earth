import os

from flask import Flask, jsonify

from app.config import config_by_name
from app.extensions import db, migrate, jwt, cors, bcrypt


def create_app(config_name=None):
    config_name = config_name or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["development"]))

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    # For local SQLite development, make sure the tables exist as soon as the
    # app starts (idempotent — a no-op if they're already there). This is
    # what PostgreSQL/production deployments should instead manage with
    # `flask db upgrade` migrations, so it's skipped there.
    if not app.config["SQLALCHEMY_DATABASE_URI"].startswith("postgresql"):
        with app.app_context():
            db.create_all()

    from app.routes.auth import auth_bp
    from app.routes.projects import projects_bp
    from app.routes.sites import sites_bp
    from app.routes.health import health_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(projects_bp, url_prefix="/api/projects")
    app.register_blueprint(sites_bp, url_prefix="/api")

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app

from datetime import datetime, timezone

from app.extensions import db


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    project_type = db.Column(db.String(50), nullable=False, default="carbon")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    sites = db.relationship("Site", backref="project", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, include_sites=False):
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "project_type": self.project_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "created_by": self.created_by,
            "site_count": self.sites.count(),
        }
        if include_sites:
            data["sites"] = [s.to_dict() for s in self.sites]
        return data

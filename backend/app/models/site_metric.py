from app.extensions import db


class SiteMetric(db.Model):
    __tablename__ = "site_metrics"

    id = db.Column(db.Integer, primary_key=True)
    site_id = db.Column(db.Integer, db.ForeignKey("sites.id"), nullable=False)
    recorded_date = db.Column(db.Date, nullable=False)
    carbon_value = db.Column(db.Float, nullable=False, default=0)  # tons CO2e
    biodiversity_value = db.Column(db.Float, nullable=False, default=0)  # species count
    performance = db.Column(db.Float, nullable=False, default=0)  # 0-100 index

    def to_dict(self):
        return {
            "id": self.id,
            "site_id": self.site_id,
            "recorded_date": self.recorded_date.isoformat(),
            "carbon_value": self.carbon_value,
            "biodiversity_value": self.biodiversity_value,
            "performance": self.performance,
        }

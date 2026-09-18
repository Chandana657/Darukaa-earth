import os
from datetime import timedelta

from dotenv import load_dotenv

# basedir = the backend/ directory, computed from this file's own absolute
# path so it is stable no matter what the current working directory is when
# python is invoked (this matters on Windows, and when Flask's debug
# reloader respawns the process).
basedir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load backend/.env (if present) so DATABASE_URL, SECRET_KEY, JWT_SECRET_KEY
# and CORS_ORIGINS below actually pick up what's in it, instead of always
# silently falling back to the defaults.
load_dotenv(os.path.join(basedir, ".env"))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", f"sqlite:///{os.path.join(basedir, 'dev.db')}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", 60)))

    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")

    @property
    def is_postgres(self):
        return self.SQLALCHEMY_DATABASE_URI.startswith("postgresql")


class TestConfig(Config):
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    TESTING = True
    JWT_SECRET_KEY = "test-jwt-secret-key-at-least-32-bytes-long"


config_by_name = {
    "development": Config,
    "production": Config,
    "testing": TestConfig,
}

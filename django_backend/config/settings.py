import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    SECRET_KEY: str = os.getenv("DJANGO_SECRET_KEY", "django-insecure-dev-key-change-in-production")
    DEBUG: bool = os.getenv("DJANGO_DEBUG", "True").lower() == "true"
    ALLOWED_HOSTS: list = os.getenv("DJANGO_ALLOWED_HOSTS", "*").split(",")
    
    HF_TOKEN: str = os.getenv("HF_TOKEN", "")
    HF_MODEL: str = os.getenv("HF_MODEL", "meta-llama/Meta-Llama-3.1-8B-Instruct")
    HF_DEVICE: str = os.getenv("HF_DEVICE", "auto")
    
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    CORS_ALLOWED_ORIGINS: str = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    
    WORKSPACE_DIR: str = os.getenv("WORKSPACE_DIR", str(BASE_DIR / "workspace"))
    
    class Config:
        env_file = BASE_DIR / ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()

SECRET_KEY = settings.SECRET_KEY
DEBUG = settings.DEBUG
ALLOWED_HOSTS = settings.ALLOWED_HOSTS

INSTALLED_APPS = [
    "daphne",
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "channels",
    "config",
    "api",
    "agents",
    "tools",
    "chat",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [settings.REDIS_URL]},
    }
}

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
}

# Fix: Ensure CORS_ALLOWED_ORIGINS is a list
CORS_ALLOWED_ORIGINS = [o.strip() for o in settings.CORS_ALLOWED_ORIGINS.split(",") if o.strip()]
CSRF_TRUSTED_ORIGINS = [o.strip() for o in settings.CORS_ALLOWED_ORIGINS.split(",") if o.strip()]
CORS_ALLOW_CREDENTIALS = True

WORKSPACE_DIR = Path(settings.WORKSPACE_DIR)
WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)

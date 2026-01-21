"""Application configuration management."""
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "Gallery"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:5173"
    BASE_URL: str = "http://localhost:8000"
    
    # MongoDB
    MONGODB_URL: str = "mongodb://mongodb:27017"
    MONGODB_DB_NAME: str = "gallery"
    
    # Security
    SECRET_KEY: str = "change-this-in-production-use-a-real-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin"  # Change in production
    
    # Storage
    UPLOAD_DIR: str = "/app/uploads"
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS: set = {"jpg", "jpeg", "png", "gif", "webp"}
    
    # Image processing
    THUMBNAIL_SIZE: tuple = (400, 400)
    MEDIUM_SIZE: tuple = (1200, 1200)
    # Original is preserved as-is
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()

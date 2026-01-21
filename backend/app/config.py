from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongo_uri: str = Field(..., alias="MONGO_URI")
    mongo_db: str = Field("gallery", alias="MONGO_DB")
    storage_path: str = Field("/data/uploads", alias="STORAGE_PATH")
    cors_origins: str = Field("*", alias="CORS_ORIGINS")
    base_public_url: str | None = Field(None, alias="BASE_PUBLIC_URL")

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()

import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class WorkerSettings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    ENCRYPTION_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = WorkerSettings()

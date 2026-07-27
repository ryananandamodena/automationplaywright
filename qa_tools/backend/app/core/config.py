from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Autonomous QA Testing Platform"
    API_V1_STR: str = "/api/v1"
    
    # Environment variables
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # Security
    JWT_SECRET: str
    ENCRYPTION_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days
    
    # Database
    DATABASE_URL: str
    REDIS_URL: str
    
    # AI Providers
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] | str = []
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()

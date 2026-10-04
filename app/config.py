from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "AURA"
    environment: str = "development"
    secret_key: str = "dev-only-change-me"
    database_url: str = "sqlite:///./data/aura.db"
    access_token_expire_minutes: int = 60
    max_upload_size_mb: int = 5
    allowed_origins: str = "http://127.0.0.1:8000,http://localhost:8000"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    owner_email: str = "owner@aurademo.com"
    owner_password: str = "ChangeMe-123!"
    owner_business_name: str = "AURA Demo Commerce"
    groq_api_key: str | None = None
    groq_model: str = "openai/gpt-oss-120b"

    @property
    def effective_groq_model(self) -> str:
        # Keep older local .env files from forcing the removed Groq model.
        if self.groq_model == "llama-3.3-70b-versatile":
            return "openai/gpt-oss-120b"
        return self.groq_model
    groq_timeout_seconds: int = 60
    rag_collection_prefix: str = "aura_business"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    max_document_size_mb: int = 20
    memory_turn_limit: int = 12
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [x.strip() for x in self.allowed_origins.split(",") if x.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()

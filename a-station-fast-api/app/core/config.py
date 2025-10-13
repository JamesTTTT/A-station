from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    PROJECT_NAME: str = "A-Station"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    API_KEY_1: str =""

    # Database
    DATABASE_URL: str = ""

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]

    #Github Oauth
    GITHUB_CLIENT_ID: str | None = None
    GITHUB_CLIENT_SECRET: str | None = None
    GITHUB_REDIRECT_URI: str | None = None

    # Stripe for when the comes lol
    STRIPE_SECRET_KEY: str | None = None
    STRIPE_PUBLISHABLE_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )


settings = Settings()
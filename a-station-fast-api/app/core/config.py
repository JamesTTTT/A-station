import pydantic_settings import BaseSetting, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "A-station"
    VERSION: str = "0.1.0"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")



settings = Settings()
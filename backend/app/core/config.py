from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    llm_provider: str = Field(default="nvidia", validation_alias="LLM_PROVIDER")
    openai_api_key: str = Field(default="", validation_alias="OPENAI_API_KEY")
    openai_base_url: str = Field(default="https://integrate.api.nvidia.com/v1", validation_alias="OPENAI_BASE_URL")
    anthropic_api_key: str = Field(default="", validation_alias="ANTHROPIC_API_KEY")
    llm_model: str = Field(default="meta/llama-3.3-70b-instruct", validation_alias="LLM_MODEL")

    host: str = Field(default="0.0.0.0", validation_alias="HOST")
    port: int = Field(default=8000, validation_alias="PORT")
    debug: bool = Field(default=True, validation_alias="DEBUG")

    # Fix: Use absolute path for workspace directory
    workspace_dir: str = Field(
        default=str(Path(__file__).parent.parent.parent / "workspace"),
        validation_alias="WORKSPACE_DIR"
    )

    ws_heartbeat_interval: int = Field(default=30, validation_alias="WS_HEARTBEAT_INTERVAL")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()

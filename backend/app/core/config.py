import os
from pathlib import Path
from typing import Final


class Settings:
  def __init__(self) -> None:
    self.openrouter_api_key = self._load_openrouter_api_key()
    self.openrouter_model = os.getenv("OPENROUTER_MODEL", "~openai/gpt-latest")
    self.openrouter_max_tokens = int(os.getenv("OPENROUTER_MAX_TOKENS", "256"))
    self.openrouter_http_referer = os.getenv("OPENROUTER_HTTP_REFERER", "http://127.0.0.1:5173")
    self.openrouter_title = os.getenv("OPENROUTER_TITLE", "ChainGPT")
    self.cors_origins = self._parse_cors_origins(
      os.getenv("CORS_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173")
    )

  def _load_openrouter_api_key(self) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if api_key:
      return api_key

    env_path = Path(__file__).resolve().parents[3] / ".env"
    if env_path.exists():
      for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
          continue
        key, value = line.split("=", 1)
        if key.strip() == "OPENROUTER_API_KEY":
          return value.strip().strip('"').strip("'")

    raise RuntimeError("OPENROUTER_API_KEY was not found in the environment or .env file.")

  def _parse_cors_origins(self, value: str) -> list[str]:
    return [origin.strip() for origin in value.split(",") if origin.strip()]


SETTINGS: Final[Settings] = Settings()

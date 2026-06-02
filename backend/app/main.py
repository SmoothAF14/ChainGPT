from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes import router
from backend.app.core.config import SETTINGS

app = FastAPI(
  title="ChainGPT API",
  version="1.0.0",
  description="FastAPI backend for ChainGPT.",
)

app.add_middleware(
  CORSMiddleware,
  allow_origins=SETTINGS.cors_origins or ["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root() -> dict[str, str]:
  return {"message": "ChainGPT API is running", "docs": "/docs"}

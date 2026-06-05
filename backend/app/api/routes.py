from fastapi import APIRouter, HTTPException

from app.schemas.chat import ChatRequest, ChatResponse, HealthResponse
from app.services.chat_service import generate_reply
from app.services.domains import list_domains
from app.services.openrouter import OpenRouterError

router = APIRouter(prefix="/api", tags=["chat"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
  return HealthResponse(status="ok")


@router.get("/domains")
def domains() -> list[dict[str, str]]:
  return list_domains()


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
  try:
    reply, domain, retrieved_chunks = generate_reply(payload.message.strip(), payload.domain)
    return ChatResponse(
      reply=reply,
      domain=domain,
      sources=[chunk['title'] for chunk in retrieved_chunks],
    )
  except OpenRouterError as exc:
    raise HTTPException(status_code=502, detail=str(exc)) from exc
  except Exception as exc:
    raise HTTPException(status_code=500, detail=f"Unexpected server error: {exc}") from exc

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
  message: str = Field(..., min_length=1, description="User message to send to the model")
  domain: str | None = Field(
    default=None,
    description="Optional domain hint such as crypto, finance, web3, or auto",
  )


class ChatResponse(BaseModel):
  reply: str
  domain: str | None = None
  sources: list[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
  status: str

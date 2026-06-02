from backend.app.services.openrouter import ask_openrouter
from backend.app.services.rag import build_system_prompt, detect_domain, format_context, retrieve_context


def generate_reply(message: str, requested_domain: str | None = None) -> tuple[str, str, list[dict[str, str]]]:
  domain = detect_domain(message, requested_domain)
  retrieved_chunks = retrieve_context(message, domain)
  system_prompt = build_system_prompt(domain, format_context(retrieved_chunks), message)

  reply = ask_openrouter(
    user_message=message,
    system_prompt=system_prompt,
  )
  return reply, domain, retrieved_chunks
import json
from urllib import error, request

from backend.app.core.config import SETTINGS


class OpenRouterError(RuntimeError):
  pass


def ask_openrouter(user_message: str, system_prompt: str | None = None) -> str:
  messages = []
  if system_prompt:
    messages.append({"role": "system", "content": system_prompt})
  messages.append({"role": "user", "content": user_message})

  payload = json.dumps(
    {
      "model": SETTINGS.openrouter_model,
      "messages": messages,
      "max_tokens": SETTINGS.openrouter_max_tokens,
    }
  ).encode("utf-8")

  http_request = request.Request(
    url="https://openrouter.ai/api/v1/chat/completions",
    data=payload,
    headers={
      "Authorization": f"Bearer {SETTINGS.openrouter_api_key}",
      "Content-Type": "application/json",
      "HTTP-Referer": SETTINGS.openrouter_http_referer,
      "X-OpenRouter-Title": SETTINGS.openrouter_title,
    },
    method="POST",
  )

  try:
    with request.urlopen(http_request) as response:
      data = json.loads(response.read().decode("utf-8"))
      return data["choices"][0]["message"]["content"]
  except error.HTTPError as exc:
    details = exc.read().decode("utf-8")
    message_text = details or exc.reason

    try:
      parsed = json.loads(details)
      message_text = parsed.get("error", {}).get("message") or parsed.get("message") or message_text
    except Exception:
      pass

    raise OpenRouterError(f"OpenRouter {exc.code}: {message_text}") from exc

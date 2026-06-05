import json
import math
import re
from collections import Counter
from pathlib import Path

from app.services.domains import DOMAIN_PROFILES, DOMAIN_ORDER


STOPWORDS = {
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have', 'how', 'i',
  'in', 'is', 'it', 'me', 'of', 'on', 'or', 'our', 'tell', 'the', 'their', 'to', 'up', 'what',
  'when', 'where', 'which', 'with', 'you', 'your', 'about', 'into', 'can', 'help', 'please',
}


class KnowledgeChunk(dict):
  domain: str
  title: str
  text: str


def _tokenize(text: str) -> list[str]:
  tokens = re.findall(r"[a-z0-9_]+", text.lower())
  return [token for token in tokens if token not in STOPWORDS and len(token) > 1]


def _vectorize(text: str) -> Counter[str]:
  return Counter(_tokenize(text))


def _cosine_similarity(left: Counter[str], right: Counter[str]) -> float:
  if not left or not right:
    return 0.0

  dot_product = sum(left[token] * right.get(token, 0) for token in left)
  if not dot_product:
    return 0.0

  left_norm = math.sqrt(sum(value * value for value in left.values()))
  right_norm = math.sqrt(sum(value * value for value in right.values()))
  if not left_norm or not right_norm:
    return 0.0

  return dot_product / (left_norm * right_norm)


def load_knowledge_base() -> list[dict[str, str]]:
  data_path = Path(__file__).resolve().parents[1] / 'data' / 'knowledge_base.json'
  return json.loads(data_path.read_text(encoding='utf-8'))


def list_supported_domains() -> list[str]:
  return DOMAIN_ORDER.copy()


def detect_domain(message: str, requested_domain: str | None = None) -> str:
  if requested_domain and requested_domain != 'auto':
    if requested_domain in DOMAIN_PROFILES:
      return requested_domain
    return 'crypto'

  lowered = message.lower()
  if any(term in lowered for term in DOMAIN_PROFILES['blockchain_dev']['keywords'].split()):
    return 'blockchain_dev'
  if any(term in lowered for term in DOMAIN_PROFILES['tokenomics']['keywords'].split()):
    return 'tokenomics'
  if any(term in lowered for term in DOMAIN_PROFILES['defi']['keywords'].split()):
    return 'defi'
  if any(term in lowered for term in DOMAIN_PROFILES['trading']['keywords'].split()):
    return 'trading'
  if any(term in lowered for term in DOMAIN_PROFILES['crypto']['keywords'].split()):
    return 'crypto'
  return 'crypto'


def retrieve_context(message: str, domain: str, limit: int = 4) -> list[dict[str, str]]:
  knowledge_base = load_knowledge_base()
  query_vector = _vectorize(message)

  scored_chunks = []
  for chunk in knowledge_base:
    if chunk['domain'] != domain:
      continue
    chunk_text = f"{chunk['title']} {chunk['text']}"
    score = _cosine_similarity(query_vector, _vectorize(chunk_text))
    scored_chunks.append((score, chunk))

  scored_chunks.sort(key=lambda item: item[0], reverse=True)
  return [chunk for score, chunk in scored_chunks[:limit] if score > 0]


def format_context(chunks: list[dict[str, str]]) -> str:
  if not chunks:
    return 'No retrieved context matched the question.'

  lines = []
  for index, chunk in enumerate(chunks, start=1):
    lines.append(f"[{index}] {chunk['title']}\n{chunk['text']}")
  return '\n\n'.join(lines)


def infer_response_format(message: str) -> str:
  lowered = message.lower()
  if any(term in lowered for term in ('compare', 'difference', 'versus', 'vs', 'table', 'columns', 'rows', 'summary')):
    return 'table'
  if any(term in lowered for term in ('bar chart', 'trend', 'performance', 'numbers', 'metrics', 'stats', 'distribution')):
    return 'chart'
  if any(term in lowered for term in ('flow', 'process', 'architecture', 'diagram', 'graph', 'chart', 'show me how')):
    return 'diagram'
  return 'default'


def build_system_prompt(domain: str, retrieved_context: str, message: str | None = None) -> str:
  profile = DOMAIN_PROFILES.get(domain, DOMAIN_PROFILES['crypto'])
  domain_focus = profile['prompt']
  response_format = infer_response_format(message or '')

  formatting_guidance = {
    'table': (
      'For comparisons, structured data, side-by-side options, or requested tables, answer in a markdown table '\
      'first and keep the prose short.'
    ),
    'diagram': (
      'For processes, relationships, flows, or architecture questions, include a Mermaid diagram in a fenced '\
      'code block when possible. If Mermaid is not suitable, use a clean ASCII flow chart.'
    ),
    'chart': (
      'For numeric summaries, trends, or performance questions, present the main takeaway with a compact '\
      'markdown table and a simple ASCII bar chart or Mermaid-style chart if helpful.'
    ),
    'default': (
      'Use clear prose by default, but switch to a structured format whenever it improves readability.'
    ),
  }[response_format]

  instructions = (
    'Use the retrieved context when it is relevant. If the context is insufficient, say so plainly '
    'and fill the gap with a careful, general answer instead of inventing facts.\n'
    'Stay inside the current domain and answer with that domain\'s vocabulary, examples, and risk framing.\n'
    'If the user asks for recommendations, give practical options and note tradeoffs.\n'
    f'{formatting_guidance}\n'
    'If the question is ambiguous, ask one short clarifying question before answering.'
  )

  return f"{domain_focus}\n\n{instructions}\n\nRetrieved context:\n{retrieved_context}"

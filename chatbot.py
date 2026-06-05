import os
import sys
from pathlib import Path

import uvicorn


def main() -> None:
  # Ensure the backend directory is on the path so `app` package is found
  backend_dir = Path(__file__).resolve().parent / "backend"
  if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

  port = int(os.getenv("PORT", "8000"))
  uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)


if __name__ == "__main__":
  main()

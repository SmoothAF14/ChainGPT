# Frontend

React + Vite frontend for the chatbot.

## Dev

1. Install dependencies in this folder.
2. Run `npm run dev`.
3. Start the backend from the repository root with `python chatbot.py`.

The frontend proxies `/api/*` requests to `http://127.0.0.1:8000`.

## Deploy

For Vercel, set the root directory to this `frontend` folder and add `VITE_API_BASE_URL` with your Railway backend URL.

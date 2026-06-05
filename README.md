# ChainGPT

## Structure

- `backend/` FastAPI backend with Swagger docs
- `frontend/` React frontend with Vite

## Run

Start the backend:

```powershell
cd "c:\Users\Hp\Desktop\genAI"
python chatbot.py
```

Start the frontend:

```powershell
cd "c:\Users\Hp\Desktop\genAI\frontend"
npm run dev
```

Backend docs:

- http://127.0.0.1:8000/docs
- http://127.0.0.1:8000/redoc

## Deploy

Frontend on Vercel:

1. Create a Vercel project from this GitHub repo.
2. Set the root directory to `frontend`.
3. Add an environment variable:
   - `VITE_API_BASE_URL` = your Railway backend URL
4. Deploy the project with the default Vite build settings.
5. If you use a custom Vercel domain, update `CORS_ORIGINS` on Railway so it includes that domain.

Backend on Railway:

1. Create a Railway project from this GitHub repo.
2. Set the root directory to `backend`.
3. Add environment variables:
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL` if you want to override the default
   - `CORS_ORIGINS` = your Vercel app URL
   - `OPENROUTER_HTTP_REFERER` = your Vercel app URL
4. Railway will use the `Procfile` start command automatically.
5. Railway provides `PORT` automatically, and the backend now respects it.

After both deploy:

- Confirm the backend health endpoint works at `/api/health`.
- Confirm the frontend is calling the Railway backend through `VITE_API_BASE_URL`.

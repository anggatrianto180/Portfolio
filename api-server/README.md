# Gemini Proxy (local)

Small Express proxy to keep your Gemini API key on the server side and avoid exposing it in client JS.

1. Copy `.env.example` to `.env` and set `GEMINI_API_KEY`.

2. Install dependencies and run:

```powershell
cd api-server; npm install; npm start
```

3. The proxy serves `/generate` which forwards your request to Gemini and returns the raw response.

4. In `scripts/ai.js` set `proxyUrl = 'http://localhost:3000/generate'` and leave `apiKey` empty for security.

Notes:
- This is a minimal proxy for local/dev use. For production, secure and restrict access (CORS, auth) appropriately.
- The proxy also optionally serves the static site root for convenience when run from the project directory.

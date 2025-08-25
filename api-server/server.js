const express = require('express');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY || '';

if (!API_KEY) {
  console.warn('Warning: GEMINI_API_KEY is not set. The proxy requires a valid API key to forward requests.');
}

app.post('/generate', async (req, res) => {
  if (!API_KEY) return res.status(400).json({ error: 'Server missing GEMINI_API_KEY' });

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    // forward status and raw text for client parsing
    res.status(response.status).send(text);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error' });
  }
});

// Optional: serve the static site for convenience
app.use('/', express.static(path.join(__dirname, '..')));

app.listen(PORT, () => console.log(`Proxy listening on http://localhost:${PORT}`));

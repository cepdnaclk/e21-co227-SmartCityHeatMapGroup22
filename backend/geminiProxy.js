require('dotenv').config();
const express = require('express');
const router = express.Router();

// IMPORTANT: Do NOT commit your API key. Set GEMINI_API_KEY in backend/.env
// Example .env line (do not commit):
// GEMINI_API_KEY=ya29....

const GEMINI_KEY = process.env.GEMINI_API_KEY;

// Build the prompt template
function buildPrompt(userQuery) {
  return `You are a helpful assistant for a museum heatmap system.

There are 8 exhibition zones in the museum. 
Each zone represents a specific category or theme.

Here are the zones:
zone1 - hospital
zone2 - ESCAL
zone3 - ACES(association of computer engineering students)
zone4 - gaming zone
zone5 - Agricultural zone
zone6 - industrial zone
zone7 - Smart Home
zone8 - Smart Cafe

The user will enter an area, topic, or exhibit they are interested in.
Your task is to determine **which zone** they should go to.

User’s query: "${userQuery}"

Respond with only the zone name (for example: "zone3 - ACES") and nothing else. Do not explain your reasoning.
`;
}

// Local simple keyword fallback mapping in case Gemini request fails
function localFallback(userQuery) {
  const q = userQuery.toLowerCase();
  const mapping = [
    { zone: 'zone1 - hospital', keywords: ['health', 'medicine', 'doctor', 'nurse', 'emergency', 'patient'] },
    { zone: 'zone2 - ESCAL', keywords: ['civil', 'construction', 'structural', 'building', 'materials'] },
    { zone: 'zone3 - ACES (Association of Computer Engineering Students)', keywords: ['computer', 'engineering', 'robot', 'embedded', 'ai', 'ml', 'iot'] },
    { zone: 'zone4 - gaming zone', keywords: ['game', 'esport', 'vr', 'arcade', 'indie'] },
    { zone: 'zone5 - Agricultural zone', keywords: ['farm', 'agri', 'hydroponic', 'crop', 'drone'] },
    { zone: 'zone6 - industrial zone', keywords: ['factory', 'automation', 'manufacturing', 'cnc', '3d printing'] },
    { zone: 'zone7 - Smart Home', keywords: ['home', 'automation', 'appliance', 'energy', 'security'] },
    { zone: 'zone8 - Smart Cafe', keywords: ['coffee', 'barista', 'cafe', 'brew', 'pastry'] }
  ];

  for (const m of mapping) {
    for (const k of m.keywords) {
      if (q.includes(k)) return m.zone;
    }
  }
  // default
  return 'zone3 - ACES (Association of Computer Engineering Students)';
}

// POST /api/search-zone
// body: { query: string }
router.post('/search-zone', async (req, res) => {
  const { query } = req.body || {};
  if (!query || typeof query !== 'string') return res.status(400).json({ error: 'Query string required' });

  // If no API key configured, use fallback
  if (!GEMINI_KEY) {
    console.warn('GEMINI_API_KEY not set - using local fallback');
    const zone = localFallback(query);
    return res.json({ zone });
  }

  const prompt = buildPrompt(query);

  try {
  // Use Google Generative Language REST endpoint (adjust model and endpoint as needed).
  // New endpoint pattern: https://generativelanguage.googleapis.com/v1beta/{model=models/*}:generateContent
  // We use an API-key query param to avoid requiring OAuth setup here. If your API uses
  // a different auth method, adapt accordingly.
  // Reverted: use the non-braced concrete form (previous URL before the `{model=...}` change).
  // Example: https://generativelanguage.googleapis.com/v1beta/models/text-bison-001:generateContent
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-bison-001:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;

    const body = {
      prompt: {
        text: prompt
      },
      // Keep response short
      maxOutputTokens: 64
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      console.error('Gemini API error', r.status, await r.text());
      // fallback
      const zone = localFallback(query);
      return res.json({ zone, note: 'used_fallback_due_to_api_error' });
    }

    const json = await r.json();
    // Response shape depends on API; try to extract text content conservatively
    let text = '';
    if (json && json.candidates && Array.isArray(json.candidates) && json.candidates[0].output) {
      text = json.candidates[0].output;
    } else if (json && json.output && Array.isArray(json.output) && json.output[0].content) {
      // another possible shape
      text = json.output[0].content.map(c => c.text || '').join('');
    } else if (json && json.result && json.result.output_text) {
      text = json.result.output_text;
    } else if (typeof json === 'string') {
      text = json;
    } else {
      // unknown shape
      text = '';
    }

    text = (text || '').trim();
    if (!text) {
      const zone = localFallback(query);
      return res.json({ zone, note: 'used_fallback_empty_response' });
    }

    // The model should return the zone name only. Return that text as zone.
    return res.json({ zone: text });
  } catch (err) {
    console.error('Error calling Gemini API', err);
    const zone = localFallback(query);
    return res.json({ zone, note: 'used_fallback_on_exception' });
  }
});

module.exports = router;

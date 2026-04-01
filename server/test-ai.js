import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const MODELS_TO_TRY = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-pro-latest'
];

const callGeminiREST = async (apiKey, modelName, prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData?.error?.message || response.statusText;
    throw new Error(`${response.status} — ${errMsg}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
};

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('API Key not found!');
    process.exit(1);
}

const aiPrompt = `Generate exactly 2 multiple-choice questions about "React Hooks". Reply ONLY with a raw JSON array.`;

(async () => {
    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`[AI] Trying model: ${modelName}...`);
        const text = await callGeminiREST(apiKey, modelName, aiPrompt);
        console.log(`[AI] Success with ${modelName}! Response:`, text);
        return;
      } catch (err) {
        console.error(`[AI] Model "${modelName}" failed: ${err.message}`);
      }
    }
})();

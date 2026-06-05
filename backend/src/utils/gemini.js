import { GoogleGenerativeAI } from "@google/generative-ai";

const FALLBACK_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-flash-latest",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-pro-latest",
  "gemini-2.5-pro",
].filter(Boolean);

export async function geminiText(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY in .env");

  const genAI = new GoogleGenerativeAI(key);

  let lastErr;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}
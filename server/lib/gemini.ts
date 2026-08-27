/**
 * The only place we talk to Gemini. Returns parsed JSON or null — never throws,
 * never leaks an SDK error upward. Every caller treats null as "use the fallback".
 *
 * Uses models.generateContent rather than the newer interactions API: that one
 * still prints an "experimental, may change" warning, and demo day is a bad
 * time to find out what changed.
 */

import { GoogleGenAI } from '@google/genai';
import type { Schema } from '@google/genai';

const MODEL = process.env.COACH_MODEL ?? 'gemini-3.7-flash';
const TIMEOUT_MS = 9_000;

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

export interface GeminiResult<T> {
  value: T | null;
  latencyMs: number;
  model: string;
  error?: string;
}

export async function generateJson<T>(input: string, schema: Schema): Promise<GeminiResult<T>> {
  const started = Date.now();
  const ai = getClient();
  if (!ai) {
    return { value: null, latencyMs: 0, model: MODEL, error: 'GEMINI_API_KEY not set' };
  }

  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model: MODEL,
        contents: input,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.7,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS),
      ),
    ]);

    const text = response.text;
    if (!text) {
      return { value: null, latencyMs: Date.now() - started, model: MODEL, error: 'empty output' };
    }
    return { value: JSON.parse(text) as T, latencyMs: Date.now() - started, model: MODEL };
  } catch (err) {
    return {
      value: null,
      latencyMs: Date.now() - started,
      model: MODEL,
      error: err instanceof Error ? err.message : 'unknown',
    };
  }
}

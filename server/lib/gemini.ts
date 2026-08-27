/**
 * The only place we talk to Gemini. Returns parsed JSON or null — never throws,
 * never leaks an SDK error upward. Every caller treats null as "use the fallback".
 *
 * Uses the Interactions API, which is what Google recommends and what the
 * quickstart documents. Requires @google/genai >= 2.x: on 1.x, interactions
 * exists but `output_text` is not implemented and the SDK warns that the
 * surface is experimental.
 */

import { GoogleGenAI } from '@google/genai';

const MODEL = process.env.COACH_MODEL ?? 'gemini-3.7-flash';
const TIMEOUT_MS = 9_000;

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

/** Plain JSON Schema — lowercase types, as Pydantic and Zod emit. */
export type JsonSchema = { [k: string]: unknown };

export interface GeminiResult<T> {
  value: T | null;
  latencyMs: number;
  model: string;
  error?: string;
}

export async function generateJson<T>(
  input: string,
  schema: JsonSchema,
): Promise<GeminiResult<T>> {
  const started = Date.now();
  const ai = getClient();
  if (!ai) {
    return { value: null, latencyMs: 0, model: MODEL, error: 'GEMINI_API_KEY not set' };
  }

  try {
    const interaction = await Promise.race([
      ai.interactions.create({
        model: MODEL,
        input,
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS),
      ),
    ]);

    if (interaction.status !== 'completed') {
      return {
        value: null,
        latencyMs: Date.now() - started,
        model: MODEL,
        error: `status ${interaction.status}`,
      };
    }

    const text = interaction.output_text;
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

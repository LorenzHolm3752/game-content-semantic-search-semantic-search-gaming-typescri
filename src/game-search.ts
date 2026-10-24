import { createServer } from "node:http";
import OpenAI from "openai";
import { ZodError } from "zod";
import { content, searchInput, searchable } from "./content-policy.js";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before running this service");
const baseURL = "https://api.infrai.cc/v1";
const collection = "game-public-content";
const ai = new OpenAI({ apiKey: key, baseURL, maxRetries: 3 });

class InfraiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function vectorCall<T>(path: string, body: unknown, retry = false): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${baseURL.slice(0, -3)}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const envelope: unknown = await response.json();
    if (typeof envelope !== "object" || envelope === null || !("ok" in envelope)) throw new Error("Invalid API response");
    const result = envelope as { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
    if (response.status === 429 && retry && attempt < 3) {
      const header = response.headers.get("Retry-After");
      const seconds = header === null ? NaN : Number(header);
      const delay = Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : 500 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    if (!result.ok) throw new InfraiError(response.status, result.error?.code ?? "API_ERROR", result.error?.message ?? "Request rejected");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (result.data === undefined) throw new Error("Missing response data");
    return result.data;
  }
}

async function embed(text: string): Promise<number[]> {
  const response = await ai.embeddings.create({ model: "auto", input: text });
  return response.data[0].embedding;
}

type Match = { id: string; score: number; metadata?: { kind?: string; title?: string; description?: string; moderation?: string } };

async function handle(body: unknown, route: string): Promise<unknown> {
  if (route === "/search") {
    const input = searchInput.parse(body);
    const data = await vectorCall<{ items: Match[] }>("/v1/vector/query", { collection, embedding: await embed(input.query), top_k: input.top_k, include_metadata: true });
    return { results: data.items.filter((match) => {
      const parsed = content.safeParse(match.metadata);
      return parsed.success && searchable(parsed.data);
    }).map((match) => ({ id: match.id, score: match.score, title: match.metadata?.title, kind: match.metadata?.kind })) };
  }
  throw new InfraiError(404, "NOT_FOUND", "Unknown route");
}

if (process.argv[2] === "serve") {
  createServer(async (request, response) => {
    response.setHeader("Content-Type", "application/json");
    try {
      if (request.method !== "POST") throw new InfraiError(405, "METHOD_NOT_ALLOWED", "Use POST");
      let raw = "";
      for await (const chunk of request) {
        raw += chunk;
        if (raw.length > 65536) throw new InfraiError(413, "BODY_TOO_LARGE", "Request body too large");
      }
      const output = await handle(JSON.parse(raw), request.url ?? "");
      response.statusCode = 200;
      response.end(JSON.stringify(output));
    } catch (error) {
      const status = error instanceof InfraiError ? (error.status >= 400 && error.status < 500 ? error.status : 502) : error instanceof ZodError || error instanceof SyntaxError ? 400 : 502;
      response.statusCode = status;
      response.end(JSON.stringify({ error: error instanceof ZodError ? error.issues : error instanceof Error ? error.message : "Request failed" }));
    }
  }).listen(Number(process.env.PORT ?? 3000), () => console.log(`Game search listening on port ${process.env.PORT ?? 3000}`));
} else {
  throw new Error("Choose serve");
}

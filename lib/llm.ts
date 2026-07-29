/* ============================================================
   LLM PROVIDER — the real Claude call behind every /api/ai route.

   Server-only. Every authoring endpoint goes through `generateJson`,
   which constrains the model to a JSON Schema so the result parses
   into the same typed shapes the studio already edits (lib/types.ts).

   When no credential is configured the routes fall back to the
   deterministic generator in lib/ai.ts and say so in the response
   (`source: "local"`), so the UI can label a draft honestly instead
   of presenting a heuristic as a model output.
   ============================================================ */

import Anthropic from "@anthropic-ai/sdk";

/* Opus 5 is the default; override per deployment without a code change. */
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";
const MAX_TOKENS = Number(process.env.ANTHROPIC_MAX_TOKENS ?? 16000);

/* The SDK resolves ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, or an
   `ant auth login` profile on its own — we only need to know whether
   *something* is configured before choosing the live path. */
export function isLlmConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export interface LlmMeta {
  source: "llm" | "local";
  model: string;
  promptId: string;
  promptVersion: string;
  /* Present on the live path — lets the caller log real spend. */
  usage?: { inputTokens: number; outputTokens: number };
}

/* Thrown for every failure mode the caller might want to distinguish:
   refusal, transport, or a response that didn't match the schema. */
export class LlmError extends Error {
  constructor(
    message: string,
    readonly kind: "refusal" | "transport" | "invalid_output" | "not_configured",
    readonly status?: number,
  ) {
    super(message);
    this.name = "LlmError";
  }
}

export interface GenerateJsonRequest {
  promptId: string;
  promptVersion: string;
  system: string;
  prompt: string;
  /* JSON Schema the model's output is constrained to. Objects need
     `additionalProperties: false` and a `required` list. */
  schema: Record<string, unknown>;
  maxTokens?: number;
}

export interface GenerateJsonResult<T> {
  data: T;
  meta: LlmMeta;
}

/* One structured-output call. Returns parsed JSON matching `schema`. */
export async function generateJson<T>(req: GenerateJsonRequest): Promise<GenerateJsonResult<T>> {
  if (!isLlmConfigured()) {
    throw new LlmError("No Anthropic credential configured.", "not_configured");
  }

  let response;
  try {
    response = await getClient().messages.create({
      model: MODEL,
      max_tokens: req.maxTokens ?? MAX_TOKENS,
      system: req.system,
      output_config: { format: { type: "json_schema", schema: req.schema } },
      messages: [{ role: "user", content: req.prompt }],
    });
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      throw new LlmError(`Claude API error: ${e.message}`, "transport", e.status);
    }
    throw new LlmError(e instanceof Error ? e.message : "Unknown transport failure.", "transport");
  }

  /* Check stop_reason before touching content — a refusal returns 200
     with empty or partial content, so indexing content[0] would throw. */
  if (response.stop_reason === "refusal") {
    throw new LlmError(
      "The model declined this request. Rephrase the role description and try again.",
      "refusal",
    );
  }
  if (response.stop_reason === "max_tokens") {
    throw new LlmError(
      "The model hit the output limit before finishing. Try a shorter description.",
      "invalid_output",
    );
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  if (!text.trim()) {
    throw new LlmError("The model returned no content.", "invalid_output");
  }

  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new LlmError("The model returned output that is not valid JSON.", "invalid_output");
  }

  return {
    data,
    meta: {
      source: "llm",
      model: response.model,
      promptId: req.promptId,
      promptVersion: req.promptVersion,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    },
  };
}

/* Metadata for a fallback result, so the response shape never differs
   between the live and local paths. */
export function localMeta(promptId: string, promptVersion: string): LlmMeta {
  return { source: "local", model: "wbx-local-heuristic", promptId, promptVersion };
}

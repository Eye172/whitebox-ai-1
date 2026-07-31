import { readFileSync } from "node:fs";
import path from "node:path";

const LOCAL_API_FILE = "API.md";
const LOCAL_KEY_LINE =
  /^\s*(?:open_ai_api|OPENAI_API_KEY)\s*=\s*["']([^"'\r\n]+)["']\s*$/m;

export function parseLocalOpenAIKey(contents: string): string | undefined {
  const value = LOCAL_KEY_LINE.exec(contents)?.[1]?.trim();
  return value && value.length >= 20 ? value : undefined;
}

export function readLocalOpenAIKey(): string | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  try {
    return parseLocalOpenAIKey(
      readFileSync(path.join(process.cwd(), LOCAL_API_FILE), "utf8"),
    );
  } catch {
    return undefined;
  }
}

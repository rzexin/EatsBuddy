import { NextResponse } from "next/server";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import type {
  AnalyzeRequestBody,
  AnalyzeResult,
  Dish,
  TargetLanguage,
} from "@/lib/types";

export const runtime = "nodejs";
// Vercel function timeout (seconds). Hobby plan caps at 60s; Pro plan allows up to 300s.
export const maxDuration = 300;

function isLanguage(value: unknown): value is TargetLanguage {
  return value === "en" || value === "ja";
}

/** Best-effort extraction of a JSON object from a model response that may wrap it in prose/fences. */
function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  // Strip ```json ... ``` fences if present.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    // Fall back to the first {...} block.
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error("Model did not return valid JSON.");
  }
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v)).filter(Boolean);
}

function clampSpicy(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(3, Math.max(0, Math.round(n)));
}

/** Normalize loose model output into a strongly-typed AnalyzeResult. */
function normalizeResult(data: unknown): AnalyzeResult {
  const obj = (data ?? {}) as Record<string, unknown>;
  const rawDishes = Array.isArray(obj.dishes) ? obj.dishes : [];

  const dishes: Dish[] = rawDishes.map((item, index) => {
    const d = (item ?? {}) as Record<string, unknown>;
    return {
      id: `dish-${index}`,
      originalName: String(d.originalName ?? "").trim(),
      translatedName: String(d.translatedName ?? "").trim(),
      pinyin: String(d.pinyin ?? "").trim(),
      price: String(d.price ?? "").trim(),
      ingredients: toStringArray(d.ingredients),
      allergens: toStringArray(d.allergens).map((a) => a.toLowerCase()),
      spicyLevel: clampSpicy(d.spicyLevel),
      containsPork: Boolean(d.containsPork),
      containsBeef: Boolean(d.containsBeef),
      vegetarian: Boolean(d.vegetarian),
      description: String(d.description ?? "").trim(),
      cultureNote: String(d.cultureNote ?? "").trim(),
      recommended: Boolean(d.recommended),
    };
  });

  return {
    summary: String(obj.summary ?? "").trim(),
    dishes: dishes.filter((d) => d.originalName || d.translatedName),
  };
}

export async function POST(request: Request) {
  const baseUrl = process.env.OPENAI_BASE_URL;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_VISION_MODEL;

  if (!baseUrl || !apiKey || !model) {
    return NextResponse.json(
      {
        error:
          "Server is not configured. Copy .env.example to .env and set OPENAI_BASE_URL, OPENAI_API_KEY and OPENAI_VISION_MODEL.",
      },
      { status: 500 },
    );
  }

  let body: AnalyzeRequestBody;
  try {
    body = (await request.json()) as AnalyzeRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { image, language } = body;
  if (!image || typeof image !== "string" || !image.startsWith("data:image")) {
    return NextResponse.json(
      { error: "A menu image (data URL) is required." },
      { status: 400 },
    );
  }
  if (!isLanguage(language)) {
    return NextResponse.json(
      { error: "language must be 'en' or 'ja'." },
      { status: 400 },
    );
  }

  const endpoint = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  const payload = {
    model,
    temperature: 0.2,
    response_format: { type: "json_object" as const },
    messages: [
      { role: "system", content: buildSystemPrompt(language) },
      {
        role: "user",
        content: [
          { type: "text", text: buildUserPrompt(language) },
          { type: "image_url", image_url: { url: image } },
        ],
      },
    ],
  };

  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the model endpoint. Check OPENAI_BASE_URL and your network." },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return NextResponse.json(
      {
        error: `Model endpoint returned ${upstream.status}. ${detail.slice(0, 300)}`,
      },
      { status: 502 },
    );
  }

  let completion: unknown;
  try {
    completion = await upstream.json();
  } catch {
    return NextResponse.json(
      { error: "Model endpoint returned a non-JSON response." },
      { status: 502 },
    );
  }

  const content = (completion as {
    choices?: { message?: { content?: string } }[];
  })?.choices?.[0]?.message?.content;

  if (!content) {
    return NextResponse.json(
      { error: "Model returned an empty response." },
      { status: 502 },
    );
  }

  try {
    const parsed = extractJson(content);
    const result = normalizeResult(parsed);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Could not parse the menu. Please try a clearer photo." },
      { status: 502 },
    );
  }
}

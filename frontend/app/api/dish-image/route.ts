import { NextResponse } from "next/server";
import { buildDishImagePrompt } from "@/lib/prompt";

export const runtime = "nodejs";
// Image generation can take a while; allow generous headroom.
export const maxDuration = 120;

interface DishImageRequestBody {
  originalName?: unknown;
  translatedName?: unknown;
  ingredients?: unknown;
  description?: unknown;
}

/**
 * Image-generation connection settings, resolved independently from the vision
 * and TTS models.
 *
 * The image provider can differ from the others, so the base URL / API key are
 * read from dedicated OPENAI_IMAGE_* variables. For convenience they fall back
 * to the TTS settings (e.g. StepFun, whose `step-1x-medium` supports
 * `/images/generations`) and finally to the shared OPENAI_* settings.
 */
function getImageConfig() {
  const baseUrl =
    process.env.OPENAI_IMAGE_BASE_URL ||
    process.env.OPENAI_TTS_BASE_URL ||
    process.env.OPENAI_BASE_URL;
  const apiKey =
    process.env.OPENAI_IMAGE_API_KEY ||
    process.env.OPENAI_TTS_API_KEY ||
    process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_IMAGE_MODEL;
  const size = process.env.OPENAI_IMAGE_SIZE || "1024x1024";
  return { baseUrl, apiKey, model, size };
}

/**
 * Whether server-side dish-photo generation is configured. The model is the
 * decisive switch: when OPENAI_IMAGE_MODEL is unset the feature is hidden in
 * the UI instead of failing on demand.
 */
function isImageEnabled() {
  const { baseUrl, apiKey, model } = getImageConfig();
  return Boolean(baseUrl && apiKey && model);
}

/** Capability probe so the client can decide whether to surface the feature. */
export async function GET() {
  return NextResponse.json({ enabled: isImageEnabled() });
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v)).filter(Boolean);
}

/** Guess the image mime type from the leading bytes of a base64 payload. */
function mimeFromBase64(b64: string): string {
  if (b64.startsWith("/9j/")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("R0lGOD")) return "image/gif";
  if (b64.startsWith("UklGR")) return "image/webp";
  return "image/png";
}

/**
 * Server-side proxy to an OpenAI-compatible image-generation endpoint
 * (`POST {base}/images/generations`). Keeping it on the server hides the API
 * key from the browser and returns a self-contained data URL to the client.
 */
export async function POST(request: Request) {
  const { baseUrl, apiKey, model, size } = getImageConfig();

  if (!baseUrl || !apiKey || !model) {
    return NextResponse.json(
      {
        error:
          "Dish-photo generation is not configured. Set OPENAI_IMAGE_MODEL (and optionally OPENAI_IMAGE_BASE_URL / OPENAI_IMAGE_API_KEY) in .env.",
      },
      { status: 503 },
    );
  }

  let body: DishImageRequestBody;
  try {
    body = (await request.json()) as DishImageRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const originalName =
    typeof body.originalName === "string" ? body.originalName.trim() : "";
  const translatedName =
    typeof body.translatedName === "string" ? body.translatedName.trim() : "";
  if (!originalName && !translatedName) {
    return NextResponse.json(
      { error: "A dish name is required." },
      { status: 400 },
    );
  }

  const prompt = buildDishImagePrompt({
    originalName,
    translatedName,
    ingredients: toStringArray(body.ingredients),
    description:
      typeof body.description === "string" ? body.description.trim() : "",
  });

  const endpoint = `${baseUrl.replace(/\/$/, "")}/images/generations`;

  const payload = {
    model,
    prompt,
    size,
    n: 1,
    response_format: "b64_json" as const,
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
      {
        error:
          "Could not reach the image endpoint. Check OPENAI_IMAGE_BASE_URL and your network.",
      },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: `Image endpoint returned ${upstream.status}. ${detail.slice(0, 300)}` },
      { status: 502 },
    );
  }

  let completion: {
    data?: { b64_json?: string; url?: string }[];
  };
  try {
    completion = await upstream.json();
  } catch {
    return NextResponse.json(
      { error: "Image endpoint returned a non-JSON response." },
      { status: 502 },
    );
  }

  const first = completion?.data?.[0];
  const b64 = first?.b64_json;
  if (b64) {
    return NextResponse.json({ image: `data:${mimeFromBase64(b64)};base64,${b64}` });
  }
  if (first?.url) {
    return NextResponse.json({ image: first.url });
  }

  return NextResponse.json(
    { error: "Image endpoint returned no image." },
    { status: 502 },
  );
}

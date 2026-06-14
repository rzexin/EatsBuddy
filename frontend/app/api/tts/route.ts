import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// StepAudio 2.5 TTS caps a single synthesis request at 1000 characters.
const MAX_INPUT_CHARS = 1000;

interface TtsRequestBody {
  text?: unknown;
}

// Default voice used when OPENAI_TTS_VOICE is omitted but a model is configured.
const DEFAULT_VOICE = "boyinnansheng";

/**
 * TTS connection settings, resolved independently from the vision model.
 *
 * The TTS provider (e.g. StepFun's StepAudio) can differ from the vision
 * provider (e.g. Alibaba's qwen-vl-max), so the base URL / API key are read
 * from dedicated OPENAI_TTS_* variables. For backward compatibility they fall
 * back to the shared OPENAI_BASE_URL / OPENAI_API_KEY when unset.
 */
function getTtsConfig() {
  const baseUrl = process.env.OPENAI_TTS_BASE_URL || process.env.OPENAI_BASE_URL;
  const apiKey = process.env.OPENAI_TTS_API_KEY || process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_TTS_MODEL;
  const voice = process.env.OPENAI_TTS_VOICE || DEFAULT_VOICE;
  return { baseUrl, apiKey, model, voice };
}

/**
 * Whether server-side TTS is configured. The model is the decisive switch:
 * if OPENAI_TTS_MODEL is unset, the client should fall back to the browser's
 * built-in speech synthesis instead.
 */
function isTtsEnabled() {
  const { baseUrl, apiKey, model } = getTtsConfig();
  return Boolean(baseUrl && apiKey && model);
}

/**
 * Lightweight capability probe so the client can decide which speech engine to
 * use before issuing a (potentially billable) synthesis request.
 */
export async function GET() {
  return NextResponse.json({ enabled: isTtsEnabled() });
}

/**
 * Server-side proxy to StepFun's StepAudio 2.5 TTS endpoint
 * (`POST {OPENAI_TTS_BASE_URL}/audio/speech`).
 *
 * Keeping this on the server means the API key is never exposed to the browser.
 * The synthesized audio is returned to the client as an MP3 stream.
 */
export async function POST(request: Request) {
  const { baseUrl, apiKey, model, voice } = getTtsConfig();

  // When the TTS model isn't configured, signal the client to fall back to the
  // browser's system voice (Web Speech API) via a dedicated status code.
  if (!baseUrl || !apiKey || !model) {
    return NextResponse.json(
      {
        error:
          "TTS is not configured. Set OPENAI_TTS_MODEL (and OPENAI_TTS_BASE_URL / OPENAI_TTS_API_KEY) in .env, or rely on the browser's system voice.",
      },
      { status: 503 },
    );
  }

  let body: TtsRequestBody;
  try {
    body = (await request.json()) as TtsRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "text is required." }, { status: 400 });
  }

  const endpoint = `${baseUrl.replace(/\/$/, "")}/audio/speech`;

  const payload = {
    model,
    voice,
    input: text.slice(0, MAX_INPUT_CHARS),
    response_format: "mp3" as const,
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
      { error: "Could not reach the TTS endpoint. Check OPENAI_TTS_BASE_URL and your network." },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: `TTS endpoint returned ${upstream.status}. ${detail.slice(0, 300)}` },
      { status: 502 },
    );
  }

  const audio = await upstream.arrayBuffer();
  return new NextResponse(audio, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}

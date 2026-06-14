"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Engine = "stepaudio" | "system";

/**
 * Reads dish names and the final order aloud.
 *
 * Two engines are supported with automatic selection:
 * - "stepaudio": StepFun's StepAudio 2.5 TTS, synthesized on the server
 *   (`/api/tts`, which keeps the API key secret) and played as an MP3 blob.
 *   Used when OPENAI_TTS_MODEL is configured.
 * - "system": the browser's built-in Web Speech API (`speechSynthesis`).
 *   Used as a zero-cost fallback when TTS isn't configured (no
 *   OPENAI_TTS_MODEL) or when a synthesis request fails.
 *
 * The public interface mirrors the previous wrapper so callers don't need to
 * change: `{ supported, speakingId, speak, stop }`.
 */
export function useSpeech() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Resolved engine + a cached in-flight probe so concurrent speak() calls
  // share a single capability check.
  const engineRef = useRef<Engine | null>(null);
  const probeRef = useRef<Promise<Engine> | null>(null);

  const systemSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  // Create a single reusable audio element on the client.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = new Audio();
    audioRef.current = audio;

    // System speech is always usable as a baseline; the probe may upgrade to
    // StepAudio. If neither is available we stay unsupported.
    setSupported(systemSupported);

    return () => {
      audio.pause();
      abortRef.current?.abort();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      if (systemSupported) window.speechSynthesis.cancel();
    };
  }, [systemSupported]);

  // Detect which engine to use (cached). Falls back to "system" on any error.
  const resolveEngine = useCallback(async (): Promise<Engine> => {
    if (engineRef.current) return engineRef.current;
    if (probeRef.current) return probeRef.current;

    probeRef.current = (async () => {
      let engine: Engine = "system";
      try {
        const res = await fetch("/api/tts", { method: "GET" });
        if (res.ok) {
          const data = (await res.json()) as { enabled?: boolean };
          if (data?.enabled) engine = "stepaudio";
        }
      } catch {
        // Network/probe failure -> use the browser's system voice.
      }
      // Without server TTS we need the Web Speech API to play anything.
      if (engine === "stepaudio" || systemSupported) {
        setSupported(true);
      }
      engineRef.current = engine;
      return engine;
    })();

    return probeRef.current;
  }, [systemSupported]);

  const revokeUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    revokeUrl();
    if (systemSupported) window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, [revokeUrl, systemSupported]);

  // Browser-native fallback using the Web Speech API.
  const speakWithSystem = useCallback(
    (text: string, id: string, lang: string) => {
      if (!systemSupported) {
        setSpeakingId((cur) => (cur === id ? null : cur));
        return;
      }
      const synth = window.speechSynthesis;
      synth.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.onend = () => setSpeakingId((cur) => (cur === id ? null : cur));
      utter.onerror = () => setSpeakingId((cur) => (cur === id ? null : cur));

      setSpeakingId(id);
      synth.speak(utter);
    },
    [systemSupported],
  );

  // Server-side StepAudio 2.5 TTS, played through the shared <audio> element.
  const speakWithStepAudio = useCallback(
    async (text: string, id: string, lang: string) => {
      const audio = audioRef.current;
      if (!audio) return;

      const controller = new AbortController();
      abortRef.current = controller;
      setSpeakingId(id);

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });

        // 503 means TTS got unconfigured at runtime -> downgrade permanently.
        if (res.status === 503) {
          engineRef.current = "system";
          speakWithSystem(text, id, lang);
          return;
        }
        if (!res.ok) throw new Error(`TTS request failed (${res.status})`);

        const blob = await res.blob();
        if (controller.signal.aborted) return;

        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        audio.src = url;

        audio.onended = () => {
          revokeUrl();
          setSpeakingId((cur) => (cur === id ? null : cur));
        };
        audio.onerror = () => {
          revokeUrl();
          setSpeakingId((cur) => (cur === id ? null : cur));
        };

        await audio.play();
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        revokeUrl();
        // Best-effort fallback to the system voice if synthesis fails.
        if (systemSupported) {
          speakWithSystem(text, id, lang);
        } else {
          setSpeakingId((cur) => (cur === id ? null : cur));
        }
      }
    },
    [revokeUrl, speakWithSystem, systemSupported],
  );

  const speak = useCallback(
    async (text: string, id: string, lang = "zh-CN") => {
      if (typeof window === "undefined") return;
      const trimmed = text.trim();
      if (!trimmed) return;

      // Cancel any in-flight request / current playback before starting anew.
      abortRef.current?.abort();
      abortRef.current = null;
      audioRef.current?.pause();
      revokeUrl();
      if (systemSupported) window.speechSynthesis.cancel();

      const engine = await resolveEngine();
      if (engine === "stepaudio") {
        await speakWithStepAudio(trimmed, id, lang);
      } else {
        speakWithSystem(trimmed, id, lang);
      }
    },
    [resolveEngine, revokeUrl, speakWithStepAudio, speakWithSystem, systemSupported],
  );

  return { supported, speakingId, speak, stop };
}

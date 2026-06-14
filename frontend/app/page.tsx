"use client";

import { useMemo, useState } from "react";
import type {
  AnalyzeResult,
  DietaryTag,
  Dish,
  TargetLanguage,
} from "@/lib/types";
import { STRINGS } from "@/lib/i18n";
import { dishConflicts } from "@/lib/dietary";
import { useSpeech } from "@/components/useSpeech";
import ImageUploader from "@/components/ImageUploader";
import LanguageToggle from "@/components/LanguageToggle";
import DietaryFilters from "@/components/DietaryFilters";
import DishCard from "@/components/DishCard";
import OrderTray from "@/components/OrderTray";
import BroadcastPanel from "@/components/BroadcastPanel";

type Phase = "idle" | "loading" | "done" | "error";

export default function Home() {
  const [language, setLanguage] = useState<TargetLanguage>("en");
  const [image, setImage] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const [dietary, setDietary] = useState<DietaryTag[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showOrder, setShowOrder] = useState(false);

  const { supported: speechSupported, speakingId, speak, stop } = useSpeech();

  const t = STRINGS[language];

  const toggleDietary = (tag: DietaryTag) =>
    setDietary((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag],
    );

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const changeQty = (id: string, delta: number) =>
    setQuantities((prev) => {
      const next = Math.max(1, (prev[id] ?? 1) + delta);
      return { ...prev, [id]: next };
    });

  const selectedDishes = useMemo<Dish[]>(
    () => (result?.dishes ?? []).filter((d) => selectedIds.includes(d.id)),
    [result, selectedIds],
  );

  async function analyze() {
    if (!image) return;
    setPhase("loading");
    setError("");
    setResult(null);
    setSelectedIds([]);
    setQuantities({});
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, language }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Request failed.");
        setPhase("error");
        return;
      }
      setResult(data as AnalyzeResult);
      setPhase("done");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setPhase("error");
    }
  }

  return (
    <main className="shell">
      <header className="masthead">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            食
          </span>
          <div>
            <div className="brand-name">
              Eats<em>Buddy</em>
            </div>
            <div className="brand-sub">{t.tagline}</div>
          </div>
        </div>
        <div className="masthead-meta">
          2026 APEC
          <br />
          <strong>Shenzhen 深圳</strong>
        </div>
      </header>

      <section className="hero">
        <div>
          <span className="eyebrow">{t.tagline}</span>
          <h1 className="hero-title">
            {t.heroTitlePre} <em>{t.heroTitleEm}</em>
          </h1>
          <p className="hero-lead">{t.heroLead}</p>
          <p className="hero-note">
            <span aria-hidden>✦</span> {t.heroNote}
          </p>
          <p className="disclaimer">ⓘ {t.disclaimer}</p>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <span className="eyebrow">{t.langLabel}</span>
            <LanguageToggle value={language} onChange={setLanguage} />
          </div>

          <ImageUploader
            language={language}
            preview={image}
            onSelect={(url) => {
              setImage(url);
              setPhase("idle");
            }}
            onClear={() => {
              setImage(null);
              setResult(null);
              setPhase("idle");
            }}
          />

          {image && (
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={analyze}
                disabled={phase === "loading"}
              >
                {phase === "loading" ? t.analyzingStep : `${t.translate} →`}
              </button>
            </div>
          )}
        </div>
      </section>

      {phase === "loading" && (
        <div className="loading">
          <div className="wok" aria-hidden>
            🥘
          </div>
          <div className="step">{t.analyzingStep}</div>
          <p>{t.analyzingNote}</p>
        </div>
      )}

      {phase === "error" && (
        <div className="alert" role="alert">
          <strong>{t.errorTitle}</strong>
          {error}
        </div>
      )}

      {phase === "done" && result && (
        <section>
          <div className="section-head">
            <div>
              <span className="eyebrow">{t.resultsEyebrow}</span>
              <h2>{t.resultsTitle}</h2>
            </div>
            <DietaryFilters
              language={language}
              selected={dietary}
              onToggle={toggleDietary}
            />
          </div>

          {result.summary && (
            <p className="summary-card">
              <span className="quote">&ldquo;</span>
              {result.summary}
            </p>
          )}

          {result.dishes.length === 0 ? (
            <p className="empty">{t.noDishes}</p>
          ) : (
            <div className="dish-grid">
              {result.dishes.map((dish, i) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  index={i}
                  language={language}
                  selected={selectedIds.includes(dish.id)}
                  conflicts={dishConflicts(dish, dietary)}
                  speaking={speakingId === dish.id}
                  onToggleSelect={() => toggleSelect(dish.id)}
                  onSpeak={() =>
                    speakingId === dish.id
                      ? stop()
                      : speak(dish.originalName, dish.id, "zh-CN")
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}

      <footer className="foot">
        <span>{t.footNote}</span>
        <span>{t.disclaimer}</span>
      </footer>

      <OrderTray
        language={language}
        dishes={selectedDishes}
        onReview={() => setShowOrder(true)}
      />

      {showOrder && (
        <BroadcastPanel
          language={language}
          dishes={selectedDishes}
          quantities={quantities}
          speaking={speakingId === "__order__"}
          speechSupported={speechSupported}
          onQty={changeQty}
          onSpeak={(text) => speak(text, "__order__", "zh-CN")}
          onStop={stop}
          onClose={() => {
            stop();
            setShowOrder(false);
          }}
        />
      )}
    </main>
  );
}

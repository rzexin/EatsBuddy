"use client";

import { useEffect, useMemo } from "react";
import type { Dish, TargetLanguage } from "@/lib/types";
import { STRINGS } from "@/lib/i18n";
import { buildBroadcastScript, type OrderLine } from "@/lib/order";

interface Props {
  language: TargetLanguage;
  dishes: Dish[];
  quantities: Record<string, number>;
  speaking: boolean;
  speechSupported: boolean;
  onQty: (id: string, delta: number) => void;
  onSpeak: (text: string) => void;
  onStop: () => void;
  onClose: () => void;
}

export default function BroadcastPanel({
  language,
  dishes,
  quantities,
  speaking,
  speechSupported,
  onQty,
  onSpeak,
  onStop,
  onClose,
}: Props) {
  const t = STRINGS[language];

  const lines: OrderLine[] = useMemo(
    () => dishes.map((dish) => ({ dish, qty: quantities[dish.id] ?? 1 })),
    [dishes, quantities],
  );

  const script = useMemo(() => buildBroadcastScript(lines), [lines]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={t.orderTitle}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">{t.orderEyebrow}</span>
            <h2>{t.orderTitle}</h2>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            {t.close}
          </button>
        </div>

        {dishes.length === 0 ? (
          <p className="empty">{t.orderEmpty}</p>
        ) : (
          <>
            <ul className="order-list">
              {lines.map(({ dish, qty }) => (
                <li key={dish.id} className="order-item">
                  <div>
                    <div className="order-han">{dish.originalName}</div>
                    <div className="order-sub">
                      {dish.translatedName}
                      {dish.price ? ` · ${dish.price}` : ""}
                    </div>
                  </div>
                  <div className="qty" aria-label={dish.translatedName}>
                    <button type="button" onClick={() => onQty(dish.id, -1)} aria-label="decrease">
                      −
                    </button>
                    <span>{qty}</span>
                    <button type="button" onClick={() => onQty(dish.id, 1)} aria-label="increase">
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="script">
              <div className="label">{t.scriptLabel}</div>
              <p className="zh">{script}</p>
            </div>

            <div className="modal-actions">
              {speaking ? (
                <button type="button" className="btn btn-ghost" onClick={onStop}>
                  ■ {t.stop}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!speechSupported || !script}
                  onClick={() => onSpeak(script)}
                >
                  ▶ {t.playToWaiter}
                </button>
              )}
            </div>

            {!speechSupported && (
              <p className="disclaimer" style={{ marginTop: 12 }}>
                ⚠ Voice playback is not supported in this browser. You can still show the
                Chinese text above to the waiter.
              </p>
            )}
            <p className="disclaimer">ⓘ {t.disclaimer}</p>
          </>
        )}
      </div>
    </div>
  );
}

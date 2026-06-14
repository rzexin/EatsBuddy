"use client";

import type { Dish, TargetLanguage } from "@/lib/types";
import { STRINGS } from "@/lib/i18n";

interface Props {
  language: TargetLanguage;
  dishes: Dish[];
  onReview: () => void;
}

export default function OrderTray({ language, dishes, onReview }: Props) {
  const t = STRINGS[language];
  if (!dishes.length) return null;

  const names = dishes.map((d) => d.translatedName || d.originalName).join(" · ");

  return (
    <div className="tray" role="region" aria-label={t.orderEyebrow}>
      <div className="tray-count">
        <span className="tray-badge">{dishes.length}</span>
        <div>
          <div>{t.trayItems}</div>
          <div className="tray-names">{names}</div>
        </div>
      </div>
      <button type="button" className="btn btn-gold" onClick={onReview}>
        {t.reviewOrder} →
      </button>
    </div>
  );
}

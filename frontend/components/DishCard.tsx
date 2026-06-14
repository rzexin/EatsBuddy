"use client";

import type { DietaryTag, Dish, TargetLanguage } from "@/lib/types";
import { STRINGS } from "@/lib/i18n";

interface Props {
  dish: Dish;
  language: TargetLanguage;
  index: number;
  selected: boolean;
  conflicts: DietaryTag[];
  speaking: boolean;
  onToggleSelect: () => void;
  onSpeak: () => void;
}

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      {on ? (
        <>
          <path d="M16 8.5a4 4 0 0 1 0 7" />
          <path d="M18.5 6a7 7 0 0 1 0 12" />
        </>
      ) : (
        <path d="M16 9.5l4 5M20 9.5l-4 5" />
      )}
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12l4.5 4.5L19 7" />
    </svg>
  );
}

export default function DishCard({
  dish,
  language,
  index,
  selected,
  conflicts,
  speaking,
  onToggleSelect,
  onSpeak,
}: Props) {
  const t = STRINGS[language];
  const hasConflict = conflicts.length > 0;

  return (
    <article
      className={`dish${selected ? " selected" : ""}${hasConflict ? " conflict" : ""}`}
      style={{ animationDelay: `${Math.min(index * 55, 600)}ms` }}
    >
      {dish.recommended && <span className="recommend-flag">★ {t.recommended}</span>}

      <div className="dish-top">
        <div>
          <div className="dish-han">{dish.originalName}</div>
          <h3 className="dish-name">{dish.translatedName || dish.originalName}</h3>
          {dish.pinyin && <div className="dish-pinyin">{dish.pinyin}</div>}
        </div>
        {dish.price && <div className="dish-price">{dish.price}</div>}
      </div>

      {dish.description && <p className="dish-desc">{dish.description}</p>}

      <div className="tag-row">
        {dish.spicyLevel > 0 && (
          <span className="tag" title={t.spicyLabels[dish.spicyLevel]}>
            <span className="spicy">
              {[1, 2, 3].map((n) => (
                <span key={n} className={n <= dish.spicyLevel ? "" : "off"}>
                  🌶️
                </span>
              ))}
            </span>
          </span>
        )}
        {dish.ingredients.slice(0, 4).map((ing) => (
          <span key={ing} className="tag">
            {ing}
          </span>
        ))}
        {dish.allergens.map((a) => (
          <span key={a} className="tag allergen">
            ⚠ {a}
          </span>
        ))}
      </div>

      {hasConflict && (
        <div className="tag-row">
          {conflicts.map((c) => (
            <span key={c} className="tag warn">
              {t.conflict}: {t.dietary[c]}
            </span>
          ))}
        </div>
      )}

      {dish.cultureNote && (
        <details className="culture">
          <summary>✺ {t.cultureNote}</summary>
          <p>{dish.cultureNote}</p>
        </details>
      )}

      <div className="dish-foot">
        <button
          type="button"
          className={`icon-btn${speaking ? " speaking" : ""}`}
          onClick={onSpeak}
          aria-label={t.speak}
          title={t.speak}
        >
          <SpeakerIcon on={speaking} />
        </button>
        <button
          type="button"
          className={`add-toggle${selected ? " on" : ""}`}
          aria-pressed={selected}
          onClick={onToggleSelect}
        >
          {selected ? (
            <>
              <CheckIcon /> {t.added}
            </>
          ) : (
            <>+ {t.add}</>
          )}
        </button>
      </div>
    </article>
  );
}

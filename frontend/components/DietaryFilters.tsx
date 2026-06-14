"use client";

import type { DietaryTag, TargetLanguage } from "@/lib/types";
import { DIETARY_TAGS, STRINGS } from "@/lib/i18n";

interface Props {
  language: TargetLanguage;
  selected: DietaryTag[];
  onToggle: (tag: DietaryTag) => void;
}

const ICON: Record<DietaryTag, string> = {
  vegetarian: "🥬",
  vegan: "🌱",
  "no-pork": "🚫🐖",
  "no-beef": "🚫🐄",
  halal: "☪️",
  "peanut-allergy": "🥜",
  "shellfish-allergy": "🦐",
  "gluten-free": "🌾",
  "no-spicy": "🌶️",
};

export default function DietaryFilters({ language, selected, onToggle }: Props) {
  const t = STRINGS[language];
  return (
    <div className="filters" role="group" aria-label={t.dietaryTitle}>
      {DIETARY_TAGS.map((tag) => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            className={`chip${active ? " active" : ""}`}
            aria-pressed={active}
            onClick={() => onToggle(tag)}
          >
            <span aria-hidden>{ICON[tag]}</span>
            {t.dietary[tag]}
          </button>
        );
      })}
    </div>
  );
}

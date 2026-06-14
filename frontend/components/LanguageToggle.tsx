"use client";

import type { TargetLanguage } from "@/lib/types";

interface Props {
  value: TargetLanguage;
  onChange: (lang: TargetLanguage) => void;
}

const OPTIONS: { id: TargetLanguage; label: string }[] = [
  { id: "en", label: "English" },
  { id: "ja", label: "日本語" },
];

export default function LanguageToggle({ value, onChange }: Props) {
  return (
    <div className="seg" role="group" aria-label="Target language">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={value === opt.id ? "active" : ""}
          aria-pressed={value === opt.id}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

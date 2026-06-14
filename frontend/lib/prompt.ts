import type { TargetLanguage } from "./types";

const LANGUAGE_LABEL: Record<TargetLanguage, string> = {
  en: "English",
  ja: "Japanese (日本語)",
};

/**
 * System prompt for the vision model. Forces a strict JSON shape that maps to AnalyzeResult.
 */
export function buildSystemPrompt(language: TargetLanguage): string {
  const target = LANGUAGE_LABEL[language];
  return `You are EatsBuddy, a friendly dining assistant helping a foreign guest read a Chinese
restaurant menu at APEC 2026 in Shenzhen, China.

You will be given a PHOTO of a menu. Identify every distinct dish you can read. For each dish,
produce a structured entry. Translate all human-readable text (translatedName, ingredients,
description, cultureNote, summary) into ${target}. Keep "originalName" in the original Chinese
characters and "pinyin" as Mandarin pinyin WITH tone marks.

Be accurate and conservative: if you cannot read a price, use an empty string; if unsure about an
allergen, do not invent it. Allergens must be lowercase English keywords from this set when
applicable: "peanut", "tree-nut", "shellfish", "fish", "egg", "dairy", "soy", "gluten", "sesame".

cultureNote should briefly explain the dish's origin, regional style, or how it is typically eaten
— something that helps a foreign guest appreciate Chinese food culture.

Respond with ONLY a JSON object (no markdown, no code fences) of exactly this shape:

{
  "summary": string,
  "dishes": [
    {
      "originalName": string,
      "translatedName": string,
      "pinyin": string,
      "price": string,
      "ingredients": string[],
      "allergens": string[],
      "spicyLevel": 0 | 1 | 2 | 3,
      "containsPork": boolean,
      "containsBeef": boolean,
      "vegetarian": boolean,
      "description": string,
      "cultureNote": string,
      "recommended": boolean
    }
  ]
}

If the image is not a menu or you can read no dishes, return {"summary": "...", "dishes": []} with a
short explanation in the summary. Do not include any text outside the JSON object.`;
}

export function buildUserPrompt(language: TargetLanguage): string {
  const target = LANGUAGE_LABEL[language];
  return `Here is the menu photo. Extract the dishes and respond in ${target} as strict JSON.`;
}

/**
 * Prompt for the text-to-image model. Produces a realistic, appetizing photo of
 * a single Chinese dish. Kept under ~512 characters to satisfy provider limits.
 */
export function buildDishImagePrompt(dish: {
  originalName: string;
  translatedName: string;
  ingredients: string[];
  description: string;
}): string {
  const name = [dish.translatedName, dish.originalName]
    .filter(Boolean)
    .join(" / ");
  const ingredients = dish.ingredients.slice(0, 5).join(", ");

  const parts = [
    `A professional, realistic food photograph of the Chinese dish "${name}".`,
    ingredients ? `Key ingredients: ${ingredients}.` : "",
    dish.description ? `Dish: ${dish.description}` : "",
    "Authentic Chinese restaurant presentation, plated on tableware, served on a table.",
    "Appetizing, fresh, natural soft lighting, shallow depth of field, 45-degree angle, high detail.",
    "No text, no watermark, no logo, no people, no hands.",
  ].filter(Boolean);

  return parts.join(" ").slice(0, 500);
}

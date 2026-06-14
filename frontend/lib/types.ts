export type TargetLanguage = "en" | "ja";

export type DietaryTag =
  | "vegetarian"
  | "vegan"
  | "no-pork"
  | "no-beef"
  | "halal"
  | "peanut-allergy"
  | "shellfish-allergy"
  | "gluten-free"
  | "no-spicy";

export interface Dish {
  id: string;
  /** Original Chinese name as printed on the menu. */
  originalName: string;
  /** Name translated into the requested target language. */
  translatedName: string;
  /** Mandarin pinyin with tone marks, to help pronounce the dish. */
  pinyin: string;
  /** Price as printed, e.g. "¥38". Empty string if not visible. */
  price: string;
  /** Key ingredients, in the target language. */
  ingredients: string[];
  /** Allergen keywords, normalized to lowercase English (e.g. "peanut", "shellfish", "gluten"). */
  allergens: string[];
  /** 0 = not spicy, 1 = mild, 2 = medium, 3 = hot. */
  spicyLevel: number;
  /** Whether the dish contains pork. */
  containsPork: boolean;
  /** Whether the dish contains beef. */
  containsBeef: boolean;
  /** Whether the dish is meat-free (vegetarian-friendly). */
  vegetarian: boolean;
  /** One- or two-sentence description in the target language. */
  description: string;
  /** A short Chinese food-culture note in the target language. */
  cultureNote: string;
  /** Whether the model recommends this as a signature/representative dish. */
  recommended: boolean;
}

export interface AnalyzeResult {
  /** Short overview of the menu / cuisine in the target language. */
  summary: string;
  dishes: Dish[];
}

export interface AnalyzeRequestBody {
  image: string; // data URL (base64)
  language: TargetLanguage;
}

export interface ApiError {
  error: string;
}

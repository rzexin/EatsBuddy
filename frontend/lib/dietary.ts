import type { DietaryTag, Dish } from "./types";

const PEANUT_KEYS = ["peanut", "groundnut"];
const SHELLFISH_KEYS = ["shellfish", "shrimp", "prawn", "crab", "lobster", "clam", "oyster"];
const GLUTEN_KEYS = ["gluten", "wheat", "noodle", "flour", "soy sauce"];

function hasAllergen(dish: Dish, keys: string[]): boolean {
  const haystack = [...dish.allergens, ...dish.ingredients].map((s) => s.toLowerCase());
  return haystack.some((h) => keys.some((k) => h.includes(k)));
}

/**
 * Returns the subset of selected dietary tags that this dish conflicts with.
 */
export function dishConflicts(dish: Dish, tags: DietaryTag[]): DietaryTag[] {
  const conflicts: DietaryTag[] = [];
  for (const tag of tags) {
    switch (tag) {
      case "vegetarian":
      case "vegan":
        if (!dish.vegetarian) conflicts.push(tag);
        break;
      case "no-pork":
      case "halal":
        if (dish.containsPork) conflicts.push(tag);
        break;
      case "no-beef":
        if (dish.containsBeef) conflicts.push(tag);
        break;
      case "peanut-allergy":
        if (hasAllergen(dish, PEANUT_KEYS)) conflicts.push(tag);
        break;
      case "shellfish-allergy":
        if (hasAllergen(dish, SHELLFISH_KEYS)) conflicts.push(tag);
        break;
      case "gluten-free":
        if (hasAllergen(dish, GLUTEN_KEYS)) conflicts.push(tag);
        break;
      case "no-spicy":
        if (dish.spicyLevel > 0) conflicts.push(tag);
        break;
    }
  }
  return conflicts;
}

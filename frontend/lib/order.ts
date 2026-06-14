import type { Dish } from "./types";

export interface OrderLine {
  dish: Dish;
  qty: number;
}

const ZH_NUM = ["零", "一", "两", "三", "四", "五", "六", "七", "八", "九", "十"];

function zhCount(n: number): string {
  if (n <= 10) return ZH_NUM[n] ?? String(n);
  return String(n);
}

/**
 * Builds the Chinese sentence the guest's phone will read aloud to the waiter.
 */
export function buildBroadcastScript(lines: OrderLine[]): string {
  const items = lines
    .filter((l) => l.qty > 0)
    .map((l) => `${l.dish.originalName} ${zhCount(l.qty)}份`);
  if (!items.length) return "";
  return `你好，我想点这些菜：${items.join("，")}。谢谢！`;
}

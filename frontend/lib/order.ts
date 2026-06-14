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

/** Extracts the leading numeric amount from a printed price like "88 元 / 斤" → 88. */
export function parsePrice(price: string): number | null {
  if (!price) return null;
  const match = price.replace(/[,，]/g, "").match(/\d+(\.\d+)?/);
  if (!match) return null;
  const value = Number.parseFloat(match[0]);
  return Number.isFinite(value) ? value : null;
}

export interface OrderTotal {
  /** Sum of (unit price × qty) for every line whose price could be parsed. */
  amount: number;
  /** Whether every selected line had a parseable price. */
  complete: boolean;
  /** Whether at least one line contributed a price. */
  hasPrice: boolean;
}

/**
 * Computes the estimated order total. Prices are taken as the leading number
 * in each dish's printed price (units like "/斤" or "/份" are ignored), so the
 * result is an estimate rather than the exact bill.
 */
export function computeOrderTotal(lines: OrderLine[]): OrderTotal {
  let amount = 0;
  let hasPrice = false;
  let complete = true;
  for (const { dish, qty } of lines) {
    if (qty <= 0) continue;
    const unit = parsePrice(dish.price);
    if (unit == null) {
      complete = false;
      continue;
    }
    hasPrice = true;
    amount += unit * qty;
  }
  return { amount, complete: complete && hasPrice, hasPrice };
}

/**
 * Rough CNY → USD reference rate. This is a fixed estimate for display only;
 * it does not reflect live foreign-exchange rates.
 */
export const CNY_TO_USD_RATE = 6.77;

/** Converts a CNY amount to an approximate USD value. */
export function cnyToUsd(amountCny: number, rate: number = CNY_TO_USD_RATE): number {
  if (rate <= 0) return 0;
  return amountCny / rate;
}

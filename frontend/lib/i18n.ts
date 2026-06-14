import type { DietaryTag, TargetLanguage } from "./types";

interface Strings {
  tagline: string;
  heroTitlePre: string;
  heroTitleEm: string;
  heroLead: string;
  heroNote: string;
  dropTitle: string;
  dropHint: string;
  takePhoto: string;
  chooseImage: string;
  retake: string;
  translate: string;
  langLabel: string;
  dietaryTitle: string;
  dietaryHint: string;
  analyzingStep: string;
  analyzingNote: string;
  resultsTitle: string;
  resultsEyebrow: string;
  recommended: string;
  ingredients: string;
  cultureNote: string;
  speak: string;
  add: string;
  added: string;
  conflict: string;
  spicyLabels: string[];
  trayItems: string;
  reviewOrder: string;
  orderTitle: string;
  orderEyebrow: string;
  orderEmpty: string;
  scriptLabel: string;
  playToWaiter: string;
  stop: string;
  close: string;
  noDishes: string;
  errorTitle: string;
  footNote: string;
  disclaimer: string;
  dietary: Record<DietaryTag, string>;
}

export const STRINGS: Record<TargetLanguage, Strings> = {
  en: {
    tagline: "Menu translator & ordering buddy",
    heroTitlePre: "Read any",
    heroTitleEm: "Chinese menu",
    heroLead:
      "Snap a photo of the menu. EatsBuddy translates every dish, breaks down the ingredients, flags anything you avoid, recommends the classics — and reads your order to the waiter in Chinese.",
    heroNote: "No sign-up. No app. Just one photo.",
    dropTitle: "Add a menu photo",
    dropHint: "Take a picture or drop an image here (JPG / PNG / HEIC)",
    takePhoto: "Take photo",
    chooseImage: "Choose image",
    retake: "Use another photo",
    translate: "Translate menu",
    langLabel: "Translate to",
    dietaryTitle: "Anything to avoid?",
    dietaryHint: "We'll highlight dishes that clash with your choices.",
    analyzingStep: "Reading the menu…",
    analyzingNote: "Translating dishes, parsing ingredients and spotting allergens.",
    resultsTitle: "Your menu, decoded",
    resultsEyebrow: "Dishes",
    recommended: "Chef's pick",
    ingredients: "Ingredients",
    cultureNote: "Culture note",
    speak: "Hear the name",
    add: "Add",
    added: "Added",
    conflict: "Heads up",
    spicyLabels: ["Not spicy", "Mild", "Medium", "Hot"],
    trayItems: "dishes selected",
    reviewOrder: "Review & order",
    orderTitle: "Tell the waiter",
    orderEyebrow: "Your order",
    orderEmpty: "Pick a few dishes to build your order.",
    scriptLabel: "Read this aloud in Chinese",
    playToWaiter: "Play to waiter",
    stop: "Stop",
    close: "Close",
    noDishes:
      "We couldn't read any dishes from that photo. Try a clearer, well-lit shot of the menu.",
    errorTitle: "Something went wrong",
    footNote: "EatsBuddy · 2026 APEC Shenzhen",
    disclaimer:
      "EatsBuddy does not place orders or take payments — it only builds a list and speaks it aloud.",
    dietary: {
      vegetarian: "Vegetarian",
      vegan: "Vegan",
      "no-pork": "No pork",
      "no-beef": "No beef",
      halal: "Halal",
      "peanut-allergy": "Peanut allergy",
      "shellfish-allergy": "Shellfish allergy",
      "gluten-free": "Gluten-free",
      "no-spicy": "No spicy",
    },
  },
  ja: {
    tagline: "メニュー翻訳・注文アシスタント",
    heroTitlePre: "どんな",
    heroTitleEm: "中華メニューも",
    heroLead:
      "メニューを撮影するだけ。EatsBuddy が料理を翻訳し、食材を分解し、苦手なものを警告し、定番をおすすめして、最後に注文を中国語で店員さんに読み上げます。",
    heroNote: "登録不要・アプリ不要。写真1枚でOK。",
    dropTitle: "メニューの写真を追加",
    dropHint: "写真を撮るか、画像をここにドロップ（JPG / PNG / HEIC）",
    takePhoto: "写真を撮る",
    chooseImage: "画像を選ぶ",
    retake: "別の写真を使う",
    translate: "メニューを翻訳",
    langLabel: "翻訳先",
    dietaryTitle: "避けたいものは？",
    dietaryHint: "選んだ条件に合わない料理を強調表示します。",
    analyzingStep: "メニューを読み取り中…",
    analyzingNote: "料理を翻訳し、食材を解析し、アレルゲンを検出しています。",
    resultsTitle: "メニューを解読しました",
    resultsEyebrow: "料理",
    recommended: "おすすめ",
    ingredients: "食材",
    cultureNote: "食文化メモ",
    speak: "名前を聞く",
    add: "追加",
    added: "追加済み",
    conflict: "注意",
    spicyLabels: ["辛くない", "ピリ辛", "中辛", "激辛"],
    trayItems: "品を選択中",
    reviewOrder: "確認して注文",
    orderTitle: "店員さんへ",
    orderEyebrow: "あなたの注文",
    orderEmpty: "料理を選んで注文を作りましょう。",
    scriptLabel: "これを中国語で読み上げます",
    playToWaiter: "店員さんに再生",
    stop: "停止",
    close: "閉じる",
    noDishes:
      "写真から料理を読み取れませんでした。明るく鮮明なメニューの写真をお試しください。",
    errorTitle: "問題が発生しました",
    footNote: "EatsBuddy · 2026 APEC 深圳",
    disclaimer:
      "EatsBuddy は注文や支払いを行いません。リストを作成して読み上げるだけです。",
    dietary: {
      vegetarian: "ベジタリアン",
      vegan: "ヴィーガン",
      "no-pork": "豚肉なし",
      "no-beef": "牛肉なし",
      halal: "ハラル",
      "peanut-allergy": "ピーナッツアレルギー",
      "shellfish-allergy": "甲殻類アレルギー",
      "gluten-free": "グルテンフリー",
      "no-spicy": "辛さなし",
    },
  },
};

export const DIETARY_TAGS: DietaryTag[] = [
  "vegetarian",
  "vegan",
  "no-pork",
  "no-beef",
  "halal",
  "peanut-allergy",
  "shellfish-allergy",
  "gluten-free",
  "no-spicy",
];

import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk, Noto_Serif_SC } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const notoSerifSc = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-han",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EatsBuddy · 菜单拍照翻译点餐助手",
  description:
    "2026 APEC Shenzhen — snap a Chinese menu, get instant translation, ingredients, allergen alerts, recommendations and culture notes, then broadcast your order to the waiter in Chinese.",
};

export const viewport: Viewport = {
  themeColor: "#f6ede0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${hanken.variable} ${notoSerifSc.variable}`}
      >
        {children}
      </body>
    </html>
  );
}

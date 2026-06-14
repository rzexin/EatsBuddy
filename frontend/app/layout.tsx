import type { Metadata, Viewport } from "next";
import "./globals.css";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;0,700;0,900;1,400;1,500;1,600;1,700;1,900&family=Hanken+Grotesk:wght@400;500;600;700&family=Noto+Serif+SC:wght@500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

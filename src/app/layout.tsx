import type { Metadata } from "next";
import { Alex_Brush, Cormorant_Garamond, Geist } from "next/font/google";
import "./globals.css";

// Script — Alex Brush (ampersands and hand-written map notes)
const alexBrush = Alex_Brush({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

// Body font — Geist
const geist = Geist({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

// Display serif — headings, poems, numerals
const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tinaandemmanuel.me"),
  title: "Emmanuel & Tina — July 27, 2026",
  description:
    "Join us to celebrate the wedding of Tina and Emmanuel in Guwahati on July 27, 2026. A day of love, laughter, and unforgettable memories.",
  openGraph: {
    title: "Emmanuel & Tina — July 27, 2026",
    description: "A wedding celebration in Guwahati on July 27, 2026. A day of love, laughter, and unforgettable memories.",
    type: "website",
    images: [
      {
        url: "/illustrations/ghibli_couple_og.jpeg",
        width: 1200,
        height: 630,
        alt: "Emmanuel & Tina — July 27, 2026",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${alexBrush.variable} ${geist.variable} ${cormorant.variable}`}
    >
      <body className="grain">
        {children}
      </body>
    </html>
  );
}

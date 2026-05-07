import type { Metadata } from "next";
import { Alex_Brush, Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

// Hero display font — Alex Brush (script, hero names only)
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

// Mono font — Geist Mono
const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tina & Emmanuel — July 21, 2026",
  description:
    "Join us to celebrate the wedding of Tina and Emmanuel in Guwahati on July 21, 2026. A day of love, laughter, and unforgettable memories.",
  openGraph: {
    title: "Tina & Emmanuel — July 21, 2026",
    description: "A wedding celebration in Guwahati on July 21, 2026. A day of love, laughter, and unforgettable memories.",
    type: "website",
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
      className={`${alexBrush.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <body className="grain">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

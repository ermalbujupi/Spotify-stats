import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Spotify Stats — your personal listening dashboard",
  description:
    "A clean, private dashboard for your Spotify listening: top artists, tracks, genres, eras, vibes, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="app-backdrop min-h-dvh antialiased">{children}</body>
    </html>
  );
}

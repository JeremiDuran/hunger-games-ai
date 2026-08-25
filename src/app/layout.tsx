import type { Metadata } from "next";
import { Cinzel, Rajdhani, Share_Tech_Mono, Inter } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const shareTechMono = Share_Tech_Mono({
  variable: "--font-share-tech-mono",
  subsets: ["latin"],
  weight: ["400"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hunger Games AI — Fan Simulation & Narrative Engine",
  description: "An AI-powered procedural Hunger Games narrative simulator and interactive orchestrator.",
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
      className={`${inter.variable} ${cinzel.variable} ${rajdhani.variable} ${shareTechMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans transition-colors duration-500">
        {children}
      </body>
    </html>
  );
}


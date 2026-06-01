import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Ready?.com — AI Mock Interview Platform",
  description:
    "Practice technical interviews with an AI interviewer. Get real-time feedback, scoring, and personalized coaching to ace your next interview.",
  keywords: ["mock interview", "AI interview", "technical interview", "interview practice", "coding interview"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-white text-slate-900 min-h-screen`}
      >
        {/* Subtle ambient gradient */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/60 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-50/40 rounded-full blur-[100px]" />
        </div>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arova - Find Your Perfect Match",
  description:
    "Connect with like-minded people through live streaming, meaningful conversations, and authentic connections on Arova.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <AppProviders>
          <div className="flex min-h-full flex-col">
            <Navbar />
            <main className="flex flex-1 flex-col">{children}</main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { getSettings } from "@/actions/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nessa Lite",
  description: "Nessa’s workout and dance app",
  // Private single-user app: never indexed.
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Calm mode is applied at the root so every animation class can honour it
  // from CSS alone (see globals.css). getSettings never throws.
  const settings = await getSettings();
  return (
    <html
      lang="en"
      data-reduced-motion={settings.reducedMotion ? "true" : undefined}
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <main className="flex-1 pb-28">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://theprayerroom.tvrapp.app"),
  title: { default: "The Prayer Room - Prayer Journal, Guided Sessions & Prayer Groups", template: "%s | The Prayer Room" },
  description: "Personal prayer journal, guided ACTS prayer sessions with AI prompts, and prayer groups. Log prayers, track answered prayers, and pray together. Free for everyone.",
  keywords: ["prayer journal", "prayer app", "guided prayer", "ACTS prayer", "prayer group", "prayer requests", "answered prayers"],
  authors: [{ name: "TVR App Store" }],
  creator: "TVR App Store",
  publisher: "TVR App Store",
  robots: { index: true, follow: true },
  openGraph: { type: "website", locale: "en_US", url: "https://theprayerroom.tvrapp.app", siteName: "The Prayer Room", title: "The Prayer Room - Prayer Journal, Guided Sessions & Prayer Groups", description: "Personal prayer journal, guided sessions, and prayer groups. Free for everyone.", images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "The Prayer Room" }] },
  twitter: { card: "summary_large_image", title: "The Prayer Room", description: "Prayer journal, guided sessions, and prayer groups. Free for everyone.", images: ["/og-image.png"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-brand-black text-brand-white`}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}

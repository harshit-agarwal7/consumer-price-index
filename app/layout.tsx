import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://consumer-price-index-green.vercel.app"),
  title: "Consumer Price Index – India",
  description: "Visualization tool for the consumer price index in India.",
  openGraph: {
    title: "Consumer Price Index Visualizer",
    description: "Explore CPI trends across India",
    url: "https://consumer-price-index-green.vercel.app",
    siteName: "Consumer Price Index – India",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Consumer Price Index visualizer for India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Consumer Price Index Visualizer",
    description: "Explore CPI trends across India",
    images: ["/docs/screenshots/og-image.jpg"],
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

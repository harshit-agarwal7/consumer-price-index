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
  title: "Consumer Price Index - India",
  description: "Visualization tool for the consumer price index in Inida.",
  openGraph: {
    title: "Consumer Price Index Visualizer",
    description: "Explore CPI trends across India",
    url: "https://consumer-price-index-green.vercel.app",
    images: [
      {
        url: "https://consumer-price-index-green.vercel.app/docs/screenshots/og-image.jpg",
        width: 1200,
        height: 630,
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

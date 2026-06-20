import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import RegisterSW from "./RegisterSW";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "OpenWhoop — your WHOOP data, on your terms",
  description:
    "Open-source dashboard for the WHOOP 4.0 and 5.0 straps. Connects over Bluetooth, runs entirely in your browser. No subscription, no cloud.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon-192.png", apple: "/icon-180.png" },
  appleWebApp: { capable: true, title: "OpenWhoop", statusBarStyle: "black-translucent" },
  openGraph: {
    title: "OpenWhoop",
    description:
      "Open-source WHOOP dashboard. Bluetooth, local-first, no subscription.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="grain" aria-hidden />
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}

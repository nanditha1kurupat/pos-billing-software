import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = { title: "Textile POS", description: "POS and billing for a textile shop" };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

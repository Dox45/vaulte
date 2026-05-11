import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vault — Vendor Verification",
  description: "AI-powered vendor verification for ecom brands",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

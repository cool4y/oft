import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OFT Bridge - LayerZero Cross-Chain Token",
  description: "Send OFT tokens between Solana and Base using LayerZero V2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "PredArb - Prediction Market Arbitrage",
  description: "Find and execute arbitrage trades between Polymarket and Kalshi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100">
        <AppProvider>
          <Nav />
          <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}

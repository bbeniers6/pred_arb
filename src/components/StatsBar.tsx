"use client";

import { useApp } from "@/context/AppContext";

export function StatsBar() {
  const { markets, opportunities, trades, loading } = useApp();

  const totalMarkets = markets.polymarket.length + markets.kalshi.length;
  const profitableOpps = opportunities.filter((o) => o.bestStrategy.profitPct > 0.5).length;
  const bestProfit = opportunities.length > 0 ? opportunities[0].bestStrategy.profitPct : 0;
  const totalTraded = trades.reduce((sum, t) => sum + t.stake, 0);
  const totalProfit = trades.filter((t) => t.status === "filled").reduce((sum, t) => sum + t.expectedProfit, 0);

  const stats = [
    { label: "Markets Scanned", value: loading ? "..." : totalMarkets.toString() },
    { label: "Arb Opportunities", value: profitableOpps.toString(), highlight: profitableOpps > 0 },
    { label: "Best Spread", value: `+${bestProfit.toFixed(1)}%`, highlight: bestProfit > 1 },
    { label: "Total Traded", value: `$${totalTraded.toFixed(0)}` },
    { label: "Total P&L", value: `$${totalProfit.toFixed(2)}`, highlight: totalProfit > 0 },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
          <div className={`text-lg font-bold font-mono ${stat.highlight ? "text-green-400" : "text-white"}`}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

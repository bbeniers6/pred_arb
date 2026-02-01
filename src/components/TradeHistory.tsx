"use client";

import { useApp } from "@/context/AppContext";

export function TradeHistory() {
  const { trades } = useApp();

  if (trades.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-4">Recent Trades</h2>
      <div className="space-y-2">
        {trades.map((trade) => (
          <div
            key={trade.id}
            className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{trade.opportunity.marketA.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(trade.createdAt).toLocaleString()} &middot;{" "}
                {trade.legA.amount} contracts
              </p>
            </div>
            <div className="flex items-center gap-4 ml-4">
              <div className="text-right">
                <div className="text-sm font-mono text-gray-400">${trade.stake.toFixed(2)}</div>
                <div className="text-sm font-mono text-green-400">+${trade.expectedProfit.toFixed(2)}</div>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  trade.status === "filled"
                    ? "bg-green-500/20 text-green-400"
                    : trade.status === "partial"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : trade.status === "failed"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {trade.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

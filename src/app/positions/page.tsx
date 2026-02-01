"use client";

import { useApp } from "@/context/AppContext";

export default function PositionsPage() {
  const { trades } = useApp();

  const filledTrades = trades.filter((t) => t.status === "filled" || t.status === "partial");
  const totalStake = filledTrades.reduce((s, t) => s + t.stake, 0);
  const totalExpectedProfit = filledTrades.reduce((s, t) => s + t.expectedProfit, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Positions</h1>
      <p className="text-gray-400 text-sm mb-6">Track your open arbitrage positions and P&amp;L.</p>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Open Positions</div>
          <div className="text-2xl font-bold">{filledTrades.length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Total Capital Deployed</div>
          <div className="text-2xl font-bold font-mono">${totalStake.toFixed(2)}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Expected Profit</div>
          <div className="text-2xl font-bold font-mono text-green-400">${totalExpectedProfit.toFixed(2)}</div>
        </div>
      </div>

      {/* Positions table */}
      {filledTrades.length > 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs">
                <th className="text-left p-4 font-medium">Market</th>
                <th className="text-left p-4 font-medium">Leg A</th>
                <th className="text-left p-4 font-medium">Leg B</th>
                <th className="text-right p-4 font-medium">Stake</th>
                <th className="text-right p-4 font-medium">Exp. Profit</th>
                <th className="text-right p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filledTrades.map((trade) => (
                <tr key={trade.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="p-4 max-w-[200px] truncate">{trade.opportunity.marketA.title}</td>
                  <td className="p-4 text-xs">
                    <span className="text-blue-400">{trade.legA.side.toUpperCase()}</span> on{" "}
                    {trade.legA.platform} @ {(trade.legA.price * 100).toFixed(1)}&cent;
                  </td>
                  <td className="p-4 text-xs">
                    <span className="text-green-400">{trade.legB.side.toUpperCase()}</span> on{" "}
                    {trade.legB.platform} @ {(trade.legB.price * 100).toFixed(1)}&cent;
                  </td>
                  <td className="p-4 text-right font-mono">${trade.stake.toFixed(2)}</td>
                  <td className="p-4 text-right font-mono text-green-400">+${trade.expectedProfit.toFixed(2)}</td>
                  <td className="p-4 text-right">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      trade.status === "filled"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {trade.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <div className="text-lg mb-2">No positions yet</div>
          <p className="text-sm">Execute an arbitrage trade from the Dashboard to see it here.</p>
        </div>
      )}
    </div>
  );
}

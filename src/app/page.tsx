"use client";

import { useApp } from "@/context/AppContext";
import { StatsBar } from "@/components/StatsBar";
import { OpportunityCard } from "@/components/OpportunityCard";
import { TradeHistory } from "@/components/TradeHistory";

export default function Dashboard() {
  const { opportunities, loading, error, warnings, marketCounts, useDemo } = useApp();

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Arbitrage Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          {useDemo ? "Showing demo data" : "Live market data"} &middot; Scanning Polymarket &amp; Kalshi
        </p>
      </div>

      <StatsBar />

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Warnings from individual platform APIs */}
      {warnings.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 text-yellow-400 text-sm space-y-1">
          {warnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      )}

      {/* Market fetch diagnostics */}
      {!useDemo && !loading && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 mb-6 text-sm text-gray-400 flex gap-6">
          <span>Polymarket: <strong className="text-gray-200">{marketCounts.polymarket}</strong> markets</span>
          <span>Kalshi: <strong className="text-gray-200">{marketCounts.kalshi}</strong> markets</span>
          <span>Matched: <strong className="text-gray-200">{opportunities.length}</strong> opportunities</span>
        </div>
      )}

      {/* Loading state */}
      {loading && opportunities.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <div className="animate-pulse text-lg">Scanning markets for arbitrage opportunities...</div>
        </div>
      )}

      {/* Opportunities grid */}
      {opportunities.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">
            Opportunities
            <span className="text-sm font-normal text-gray-500 ml-2">
              {opportunities.length} found
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {opportunities.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && opportunities.length === 0 && !error && (
        <div className="text-center py-20 text-gray-500">
          <div className="text-lg mb-2">No arbitrage opportunities found</div>
          <p className="text-sm">Markets are efficiently priced right now. Check back later or adjust your filters.</p>
        </div>
      )}

      <TradeHistory />
    </div>
  );
}

"use client";

import { ArbOpportunity } from "@/types";
import { useState } from "react";
import { TradeModal } from "./TradeModal";

function platformBadge(platform: string) {
  if (platform === "polymarket") {
    return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-400">Polymarket</span>;
  }
  return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-500/20 text-green-400">Kalshi</span>;
}

function profitColor(pct: number) {
  if (pct >= 5) return "text-green-400";
  if (pct >= 2) return "text-emerald-400";
  if (pct >= 0.5) return "text-yellow-400";
  return "text-gray-400";
}

export function OpportunityCard({ opp }: { opp: ArbOpportunity }) {
  const [showTrade, setShowTrade] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const strat = opp.bestStrategy;

  const polyMarket = opp.marketA.platform === "polymarket" ? opp.marketA : opp.marketB;
  const kalshiMarket = opp.marketA.platform === "kalshi" ? opp.marketA : opp.marketB;

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-left w-full group"
            >
              <h3 className={`font-semibold text-white ${expanded ? "" : "truncate"}`}>
                {opp.marketA.title}
                <span className="ml-2 text-gray-600 group-hover:text-gray-400 text-xs">
                  {expanded ? "[-]" : "[+]"}
                </span>
              </h3>
            </button>
            {expanded && opp.marketA.title !== opp.marketB.title && (
              <p className="text-sm text-gray-400 mt-1">{opp.marketB.title}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Match confidence: {(opp.matchConfidence * 100).toFixed(0)}%
            </p>
          </div>
          <div className={`text-right shrink-0 ${profitColor(strat.profitPct)}`}>
            <div className="text-2xl font-bold">+{strat.profitPct.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">guaranteed</div>
          </div>
        </div>

        {/* Platform links */}
        <div className="flex gap-2 mb-4">
          <a
            href={polyMarket.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors"
          >
            Polymarket
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
          <a
            href={kalshiMarket.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors"
          >
            Kalshi
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </div>

        {/* Strategy breakdown */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              {platformBadge(strat.buyYesOn)}
              <span className="text-xs text-gray-400">Buy YES</span>
            </div>
            <div className="text-lg font-mono font-bold text-white">
              {(strat.yesPrice * 100).toFixed(1)}&cent;
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              {platformBadge(strat.buyNoOn)}
              <span className="text-xs text-gray-400">Buy NO</span>
            </div>
            <div className="text-lg font-mono font-bold text-white">
              {(strat.noPrice * 100).toFixed(1)}&cent;
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
          <span>
            Cost: <span className="text-white font-mono">${strat.costPer100.toFixed(2)}</span> per $100
          </span>
          <span>
            Profit: <span className="text-green-400 font-mono">${strat.profitPer100.toFixed(2)}</span> per $100
          </span>
        </div>

        {/* Trade button */}
        <button
          onClick={() => setShowTrade(true)}
          className="w-full py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 transition-all text-white"
        >
          One-Click Arb Trade
        </button>
      </div>

      {showTrade && (
        <TradeModal opportunity={opp} onClose={() => setShowTrade(false)} />
      )}
    </>
  );
}

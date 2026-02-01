"use client";

import { useState } from "react";
import { ArbOpportunity, ArbTrade, TradeOrder } from "@/types";
import { useApp } from "@/context/AppContext";
import { hasCredentials } from "@/lib/settings";

interface Props {
  opportunity: ArbOpportunity;
  onClose: () => void;
}

export function TradeModal({ opportunity, onClose }: Props) {
  const { settings, addTrade, useDemo } = useApp();
  const [stake, setStake] = useState(settings.maxStake);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const strat = opportunity.bestStrategy;
  const contracts = Math.floor(stake / strat.costPer100 * 100);
  const expectedProfit = (strat.profitPer100 / 100) * contracts;
  const totalCost = (strat.costPer100 / 100) * contracts;

  const creds = hasCredentials(settings);
  const canTrade = useDemo || (creds.polymarket && creds.kalshi);

  async function executeTrade() {
    setExecuting(true);
    setResult(null);

    const tradeId = `trade-${Date.now()}`;

    const legA: TradeOrder = {
      platform: strat.buyYesOn,
      marketId: strat.buyYesOn === opportunity.marketA.platform ? opportunity.marketA.id : opportunity.marketB.id,
      side: "yes",
      price: strat.yesPrice,
      amount: contracts,
      status: "pending",
    };

    const legB: TradeOrder = {
      platform: strat.buyNoOn,
      marketId: strat.buyNoOn === opportunity.marketA.platform ? opportunity.marketA.id : opportunity.marketB.id,
      side: "no",
      price: strat.noPrice,
      amount: contracts,
      status: "pending",
    };

    if (useDemo) {
      // Simulate trade execution
      await new Promise((r) => setTimeout(r, 1500));

      legA.status = "filled";
      legA.orderId = `demo-${Date.now()}-A`;
      legA.filledAt = new Date().toISOString();
      legB.status = "filled";
      legB.orderId = `demo-${Date.now()}-B`;
      legB.filledAt = new Date().toISOString();

      const trade: ArbTrade = {
        id: tradeId,
        opportunity,
        legA,
        legB,
        stake: totalCost,
        expectedProfit,
        status: "filled",
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      addTrade(trade);
      setResult({ success: true, message: `Demo trade executed! ${contracts} contracts on each side.` });
    } else {
      try {
        const res = await fetch("/api/trade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            opportunityId: opportunity.id,
            legA: { platform: legA.platform, marketId: legA.marketId, side: legA.side, price: legA.price, amount: legA.amount },
            legB: { platform: legB.platform, marketId: legB.marketId, side: legB.side, price: legB.price, amount: legB.amount },
            polymarketCreds: settings.polymarket,
            kalshiCreds: settings.kalshi,
          }),
        });

        const data = await res.json();

        if (data.success) {
          legA.status = data.data.legA.success ? "filled" : "failed";
          legA.orderId = data.data.legA.orderId;
          legA.error = data.data.legA.error;
          legB.status = data.data.legB.success ? "filled" : "failed";
          legB.orderId = data.data.legB.orderId;
          legB.error = data.data.legB.error;

          const trade: ArbTrade = {
            id: tradeId,
            opportunity,
            legA,
            legB,
            stake: totalCost,
            expectedProfit,
            status: legA.status === "filled" && legB.status === "filled" ? "filled" : "partial",
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          };

          addTrade(trade);
          setResult({
            success: data.data.legA.success && data.data.legB.success,
            message: data.data.legA.success && data.data.legB.success
              ? `Trade executed! ${contracts} contracts on each side.`
              : `Partial fill: ${data.data.legA.error || ""} ${data.data.legB.error || ""}`,
          });
        } else {
          setResult({ success: false, message: data.error || "Trade failed" });
        }
      } catch (e: any) {
        setResult({ success: false, message: e.message || "Network error" });
      }
    }

    setExecuting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Execute Arbitrage Trade</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>

        {/* Market info */}
        <p className="text-sm text-gray-400 mb-4 truncate">{opportunity.marketA.title}</p>

        {/* Strategy summary */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Buy YES on {strat.buyYesOn}</span>
            <span className="font-mono">{(strat.yesPrice * 100).toFixed(1)}&cent;</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Buy NO on {strat.buyNoOn}</span>
            <span className="font-mono">{(strat.noPrice * 100).toFixed(1)}&cent;</span>
          </div>
          <div className="border-t border-gray-700 pt-2 flex justify-between font-semibold">
            <span className="text-green-400">Guaranteed profit</span>
            <span className="text-green-400">+{strat.profitPct.toFixed(1)}%</span>
          </div>
        </div>

        {/* Stake input */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Stake amount ($)</label>
          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(Math.max(1, Number(e.target.value)))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
            min={1}
            max={10000}
          />
        </div>

        {/* Calculation */}
        <div className="bg-gray-800/50 rounded-lg p-3 mb-4 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Contracts</span>
            <span className="font-mono">{contracts}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total cost</span>
            <span className="font-mono">${totalCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-green-400 font-semibold">
            <span>Expected profit</span>
            <span className="font-mono">${expectedProfit.toFixed(2)}</span>
          </div>
        </div>

        {/* Warnings */}
        {!canTrade && !useDemo && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 text-sm text-yellow-400">
            Configure API keys in Settings to execute live trades.
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`rounded-lg p-3 mb-4 text-sm ${result.success ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
            {result.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={executeTrade}
            disabled={executing || (!canTrade && !useDemo)}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {executing ? "Executing..." : "Execute Trade"}
          </button>
        </div>
      </div>
    </div>
  );
}

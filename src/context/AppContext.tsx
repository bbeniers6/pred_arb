"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { AppSettings, ArbOpportunity, Market, ArbTrade, Position } from "@/types";
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from "@/lib/settings";
import { getDemoMarkets, getDemoOpportunities } from "@/lib/demo-data";

interface AppState {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  markets: { polymarket: Market[]; kalshi: Market[] };
  opportunities: ArbOpportunity[];
  trades: ArbTrade[];
  addTrade: (t: ArbTrade) => void;
  positions: Position[];
  loading: boolean;
  error: string | null;
  warnings: string[];
  marketCounts: { polymarket: number; kalshi: number };
  refresh: () => Promise<void>;
  useDemo: boolean;
  setUseDemo: (v: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [markets, setMarkets] = useState<{ polymarket: Market[]; kalshi: Market[] }>({ polymarket: [], kalshi: [] });
  const [opportunities, setOpportunities] = useState<ArbOpportunity[]>([]);
  const [trades, setTrades] = useState<ArbTrade[]>([]);
  const [positions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [marketCounts, setMarketCounts] = useState<{ polymarket: number; kalshi: number }>({ polymarket: 0, kalshi: 0 });
  const [useDemo, setUseDemo] = useState(true);

  useEffect(() => {
    setSettingsState(loadSettings());
  }, []);

  const setSettings = useCallback((s: AppSettings) => {
    setSettingsState(s);
    saveSettings(s);
  }, []);

  const addTrade = useCallback((t: ArbTrade) => {
    setTrades((prev) => [t, ...prev]);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setWarnings([]);

    try {
      if (useDemo) {
        const demoMarkets = getDemoMarkets();
        const demoOpps = getDemoOpportunities();
        setMarkets(demoMarkets);
        setOpportunities(demoOpps);
        setMarketCounts({ polymarket: demoMarkets.polymarket.length, kalshi: demoMarkets.kalshi.length });
      } else {
        const params = new URLSearchParams({
          minConfidence: String(settings.matchConfidenceThreshold),
          minProfitPct: String(settings.minProfitPct),
        });
        const res = await fetch(`/api/markets?${params}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to fetch markets");
        setMarkets(data.data.markets);
        setOpportunities(data.data.opportunities);
        setMarketCounts(data.data.marketCounts || { polymarket: 0, kalshi: 0 });
        if (data.data.errors && data.data.errors.length > 0) {
          setWarnings(data.data.errors);
        }
      }
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [useDemo, settings.matchConfidenceThreshold, settings.minProfitPct]);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh
  useEffect(() => {
    if (settings.autoRefreshInterval <= 0) return;
    const interval = setInterval(refresh, settings.autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [settings.autoRefreshInterval, refresh]);

  return (
    <AppContext.Provider
      value={{
        settings, setSettings,
        markets, opportunities,
        trades, addTrade,
        positions,
        loading, error, warnings, marketCounts,
        refresh,
        useDemo, setUseDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

import { AppSettings } from "@/types";

const SETTINGS_KEY = "pred_arb_settings";

export const DEFAULT_SETTINGS: AppSettings = {
  polymarket: { apiKey: "", apiSecret: "" },
  kalshi: { apiKey: "", apiSecret: "" },
  minProfitPct: 0.5,
  maxStake: 100,
  autoRefreshInterval: 30,
  matchConfidenceThreshold: 0.4,
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function hasCredentials(settings: AppSettings): {
  polymarket: boolean;
  kalshi: boolean;
} {
  return {
    polymarket: !!(settings.polymarket.apiKey && settings.polymarket.apiSecret),
    kalshi: !!(settings.kalshi.apiKey && settings.kalshi.apiSecret),
  };
}

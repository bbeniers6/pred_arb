// ─── Platform Types ───

export type Platform = "polymarket" | "kalshi";

export interface Market {
  id: string;
  platform: Platform;
  title: string;
  slug: string;
  category: string;
  endDate: string;
  yesPrice: number; // 0-1 (probability)
  noPrice: number;  // 0-1 (probability)
  volume: number;
  liquidity: number;
  active: boolean;
  url: string;
  rawData?: unknown;
}

// ─── Arbitrage Types ───

export type ArbSide = "yes" | "no";

export interface ArbOpportunity {
  id: string;
  marketA: Market;
  marketB: Market;
  bestStrategy: ArbStrategy;
  alternateStrategy: ArbStrategy | null;
  matchConfidence: number; // 0-1, how confident we are these are the same event
  updatedAt: string;
}

export interface ArbStrategy {
  buyYesOn: Platform;
  buyNoOn: Platform;
  yesPrice: number;
  noPrice: number;
  spread: number;      // raw price difference (should be < 1 for arb)
  profitPct: number;   // guaranteed profit as % of cost
  costPer100: number;  // cost to buy both sides per $100 payout
  profitPer100: number; // guaranteed profit per $100 payout
}

// ─── Trade Types ───

export type TradeStatus = "pending" | "executing" | "partial" | "filled" | "failed" | "cancelled";

export interface TradeOrder {
  platform: Platform;
  marketId: string;
  side: ArbSide;
  price: number;
  amount: number; // number of contracts
  status: TradeStatus;
  orderId?: string;
  filledAt?: string;
  error?: string;
}

export interface ArbTrade {
  id: string;
  opportunity: ArbOpportunity;
  legA: TradeOrder;
  legB: TradeOrder;
  stake: number;
  expectedProfit: number;
  status: TradeStatus;
  createdAt: string;
  completedAt?: string;
}

// ─── Position Types ───

export interface Position {
  id: string;
  trade: ArbTrade;
  currentPnL: number;
  settled: boolean;
  settledAt?: string;
  payout?: number;
}

// ─── Settings Types ───

export interface PlatformCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface AppSettings {
  polymarket: PlatformCredentials;
  kalshi: PlatformCredentials;
  minProfitPct: number;
  maxStake: number;
  autoRefreshInterval: number; // seconds
  matchConfidenceThreshold: number; // 0-1
}

// ─── API Response Types ───

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

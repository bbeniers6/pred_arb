import { NextRequest, NextResponse } from "next/server";
import { fetchPolymarketMarkets } from "@/lib/polymarket";
import { fetchKalshiMarkets } from "@/lib/kalshi";
import { findArbitrageOpportunities } from "@/lib/matcher";
import { ApiResponse, Market, ArbOpportunity } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minConfidence = parseFloat(searchParams.get("minConfidence") || "0.4");
    const minProfitPct = parseFloat(searchParams.get("minProfitPct") || "0");

    const [polymarketMarkets, kalshiMarkets] = await Promise.allSettled([
      fetchPolymarketMarkets(),
      fetchKalshiMarkets(),
    ]);

    const pmMarkets: Market[] =
      polymarketMarkets.status === "fulfilled" ? polymarketMarkets.value : [];
    const klMarkets: Market[] =
      kalshiMarkets.status === "fulfilled" ? kalshiMarkets.value : [];

    const errors: string[] = [];
    if (polymarketMarkets.status === "rejected") {
      errors.push(`Polymarket: ${polymarketMarkets.reason?.message || "unknown error"}`);
    }
    if (kalshiMarkets.status === "rejected") {
      errors.push(`Kalshi: ${kalshiMarkets.reason?.message || "unknown error"}`);
    }

    if (pmMarkets.length === 0 && polymarketMarkets.status === "fulfilled") {
      errors.push("Polymarket: API returned 0 markets (check filters or API availability)");
    }
    if (klMarkets.length === 0 && kalshiMarkets.status === "fulfilled") {
      errors.push("Kalshi: API returned 0 markets (check filters or API availability)");
    }

    const opportunities = findArbitrageOpportunities(
      pmMarkets,
      klMarkets,
      minConfidence,
      minProfitPct
    );

    const response: ApiResponse<{
      markets: { polymarket: Market[]; kalshi: Market[] };
      opportunities: ArbOpportunity[];
      errors: string[];
      marketCounts: { polymarket: number; kalshi: number };
    }> = {
      success: true,
      data: {
        markets: { polymarket: pmMarkets, kalshi: klMarkets },
        opportunities,
        errors,
        marketCounts: { polymarket: pmMarkets.length, kalshi: klMarkets.length },
      },
    };

    return NextResponse.json(response);
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || "Internal server error" },
      { status: 500 }
    );
  }
}

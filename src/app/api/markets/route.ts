import { NextResponse } from "next/server";
import { fetchPolymarketMarkets } from "@/lib/polymarket";
import { fetchKalshiMarkets } from "@/lib/kalshi";
import { findArbitrageOpportunities } from "@/lib/matcher";
import { ApiResponse, Market, ArbOpportunity } from "@/types";

export async function GET() {
  try {
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

    const opportunities = findArbitrageOpportunities(pmMarkets, klMarkets);

    const response: ApiResponse<{
      markets: { polymarket: Market[]; kalshi: Market[] };
      opportunities: ArbOpportunity[];
      errors: string[];
    }> = {
      success: true,
      data: {
        markets: { polymarket: pmMarkets, kalshi: klMarkets },
        opportunities,
        errors,
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

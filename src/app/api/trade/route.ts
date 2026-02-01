import { NextRequest, NextResponse } from "next/server";
import { placePolymarketOrder } from "@/lib/polymarket";
import { placeKalshiOrder } from "@/lib/kalshi";
import { ApiResponse, ArbTrade, PlatformCredentials, Platform, ArbSide } from "@/types";

interface TradeRequest {
  opportunityId: string;
  legA: { platform: Platform; marketId: string; side: ArbSide; price: number; amount: number };
  legB: { platform: Platform; marketId: string; side: ArbSide; price: number; amount: number };
  polymarketCreds: PlatformCredentials;
  kalshiCreds: PlatformCredentials;
}

async function placeOrder(
  platform: Platform,
  marketId: string,
  side: ArbSide,
  price: number,
  amount: number,
  creds: PlatformCredentials
) {
  if (platform === "polymarket") {
    return placePolymarketOrder(creds, marketId, side, price, amount);
  } else {
    return placeKalshiOrder(creds, marketId, side, price, amount);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TradeRequest = await request.json();
    const { legA, legB, polymarketCreds, kalshiCreds } = body;

    // Execute both legs simultaneously
    const [resultA, resultB] = await Promise.allSettled([
      placeOrder(
        legA.platform,
        legA.marketId,
        legA.side,
        legA.price,
        legA.amount,
        legA.platform === "polymarket" ? polymarketCreds : kalshiCreds
      ),
      placeOrder(
        legB.platform,
        legB.marketId,
        legB.side,
        legB.price,
        legB.amount,
        legB.platform === "polymarket" ? polymarketCreds : kalshiCreds
      ),
    ]);

    const response: ApiResponse<{
      legA: { success: boolean; orderId?: string; error?: string };
      legB: { success: boolean; orderId?: string; error?: string };
    }> = {
      success: resultA.status === "fulfilled" && resultB.status === "fulfilled",
      data: {
        legA:
          resultA.status === "fulfilled"
            ? { success: true, orderId: resultA.value.orderId }
            : { success: false, error: resultA.reason?.message },
        legB:
          resultB.status === "fulfilled"
            ? { success: true, orderId: resultB.value.orderId }
            : { success: false, error: resultB.reason?.message },
      },
    };

    return NextResponse.json(response);
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || "Trade execution failed" },
      { status: 500 }
    );
  }
}

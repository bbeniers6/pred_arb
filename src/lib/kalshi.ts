import { Market, PlatformCredentials, ArbSide } from "@/types";

const KALSHI_API = "https://api.elections.kalshi.com/trade-api/v2";

export async function fetchKalshiMarkets(): Promise<Market[]> {
  const res = await fetch(`${KALSHI_API}/markets?limit=100&status=open`, {
    headers: { "Accept": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Kalshi API error: ${res.status}`);
  }

  const data = await res.json();
  const markets = data.markets || [];

  return markets
    .filter((m: any) => m.status === "open" || m.status === "active")
    .map((m: any): Market => {
      const yesPrice = (m.yes_ask ?? m.last_price ?? 50) / 100;
      const noPrice = (m.no_ask ?? (100 - (m.last_price ?? 50))) / 100;

      return {
        id: m.ticker,
        platform: "kalshi",
        title: m.title || m.subtitle || m.ticker,
        slug: m.ticker,
        category: m.category || m.series_ticker || "uncategorized",
        endDate: m.close_time || m.expiration_time || "",
        yesPrice,
        noPrice,
        volume: m.volume || 0,
        liquidity: m.open_interest || 0,
        active: true,
        url: `https://kalshi.com/markets/${m.ticker}`,
        rawData: m,
      };
    });
}

export async function placeKalshiOrder(
  credentials: PlatformCredentials,
  marketId: string,
  side: ArbSide,
  price: number,
  amount: number
): Promise<{ orderId: string }> {
  const res = await fetch(`${KALSHI_API}/portfolio/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${credentials.apiKey}`,
    },
    body: JSON.stringify({
      ticker: marketId,
      action: "buy",
      side: side,
      type: "limit",
      yes_price: side === "yes" ? Math.round(price * 100) : undefined,
      no_price: side === "no" ? Math.round(price * 100) : undefined,
      count: amount,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Kalshi order failed: ${err}`);
  }

  const result = await res.json();
  return { orderId: result.order?.order_id || result.order_id };
}

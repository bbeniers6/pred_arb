import { Market, PlatformCredentials, ArbSide } from "@/types";

const KALSHI_API = "https://api.elections.kalshi.com/trade-api/v2";

export async function fetchKalshiMarkets(): Promise<Market[]> {
  const allMarkets: Market[] = [];
  let cursor: string | undefined;

  // Paginate through all open markets with rate limit handling
  let page = 0;
  while (true) {
    const params = new URLSearchParams({
      limit: "200",
      status: "open",
    });
    if (cursor) {
      params.set("cursor", cursor);
    }

    const res = await fetch(`${KALSHI_API}/markets?${params}`, {
      headers: { Accept: "application/json" },
    });

    if (res.status === 429) {
      // Rate limited — wait and retry
      const retryAfter = parseInt(res.headers.get("retry-after") || "2", 10);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }

    if (!res.ok) {
      throw new Error(`Kalshi API error: ${res.status}`);
    }

    const data = await res.json();
    const markets = data.markets || [];

    if (markets.length === 0) break;

    for (const m of markets) {
      if (m.status !== "open" && m.status !== "active") continue;

      // Prefer *_dollars fields (string like "0.56"), fall back to cent integers
      const yesPrice = parsePrice(m.yes_ask_dollars, m.yes_ask, m.last_price_dollars, m.last_price);
      const noPrice = parsePrice(m.no_ask_dollars, m.no_ask, null, null) || (1 - yesPrice);

      allMarkets.push({
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
      });
    }

    cursor = data.cursor;
    if (!cursor) break;

    // Delay between pages to avoid 429s
    page++;
    await new Promise((r) => setTimeout(r, 500));
  }

  return allMarkets;
}

/**
 * Parse a price from Kalshi API fields. Tries dollar string first, then cents integer.
 * Returns a 0-1 decimal value or 0 if nothing is usable.
 */
function parsePrice(
  dollarsStr: string | null | undefined,
  cents: number | null | undefined,
  fallbackDollarsStr: string | null | undefined,
  fallbackCents: number | null | undefined
): number {
  if (dollarsStr) {
    const v = parseFloat(dollarsStr);
    if (v > 0) return v;
  }
  if (cents && cents > 0) {
    return cents / 100;
  }
  if (fallbackDollarsStr) {
    const v = parseFloat(fallbackDollarsStr);
    if (v > 0) return v;
  }
  if (fallbackCents && fallbackCents > 0) {
    return fallbackCents / 100;
  }
  return 0;
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
      Authorization: `Bearer ${credentials.apiKey}`,
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

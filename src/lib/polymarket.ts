import { Market, PlatformCredentials, ArbSide } from "@/types";

const POLYMARKET_API = "https://clob.polymarket.com";
const POLYMARKET_GAMMA_API = "https://gamma-api.polymarket.com";

export async function fetchPolymarketMarkets(): Promise<Market[]> {
  const allMarkets: Market[] = [];
  const PAGE_SIZE = 100;
  let offset = 0;

  // Paginate through all active markets using offset
  while (true) {
    const params = new URLSearchParams({
      closed: "false",
      active: "true",
      limit: String(PAGE_SIZE),
      offset: String(offset),
      order: "volume",
      ascending: "false",
    });

    const res = await fetch(`${POLYMARKET_GAMMA_API}/markets?${params}`);

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("retry-after") || "2", 10);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }

    if (!res.ok) {
      throw new Error(`Polymarket API error: ${res.status}`);
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) break;

    for (const m of data) {
      if (!m.active || m.closed || !m.enableOrderBook) continue;

      let yesPrice = 0.5;
      let noPrice = 0.5;
      try {
        const outcomePrices = JSON.parse(m.outcomePrices || "[]");
        yesPrice = parseFloat(outcomePrices[0]) || 0.5;
        noPrice = parseFloat(outcomePrices[1]) || 1 - yesPrice;
      } catch {
        // keep defaults
      }

      allMarkets.push({
        id: m.conditionId || m.id,
        platform: "polymarket",
        title: m.question || m.title,
        slug: m.slug || "",
        category: m.category || "uncategorized",
        endDate: m.endDateIso || m.endDate || "",
        yesPrice,
        noPrice,
        volume: parseFloat(m.volume) || 0,
        liquidity: parseFloat(m.liquidity) || 0,
        active: true,
        url: `https://polymarket.com/event/${m.slug}`,
        rawData: m,
      });
    }

    // If we got fewer than PAGE_SIZE, we've reached the end
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;

    // Delay between pages to avoid rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  return allMarkets;
}

export async function placePolymarketOrder(
  credentials: PlatformCredentials,
  marketId: string,
  side: ArbSide,
  price: number,
  amount: number
): Promise<{ orderId: string }> {
  const res = await fetch(`${POLYMARKET_API}/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      POLY_API_KEY: credentials.apiKey,
      POLY_API_SECRET: credentials.apiSecret,
    },
    body: JSON.stringify({
      tokenID: marketId,
      side: side === "yes" ? "BUY" : "SELL",
      price,
      size: amount,
      type: "GTC",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Polymarket order failed: ${err}`);
  }

  const result = await res.json();
  return { orderId: result.orderID || result.id };
}

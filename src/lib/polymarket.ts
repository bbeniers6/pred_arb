import { Market, PlatformCredentials, ArbSide } from "@/types";

const POLYMARKET_API = "https://clob.polymarket.com";
const POLYMARKET_GAMMA_API = "https://gamma-api.polymarket.com";

export async function fetchPolymarketMarkets(): Promise<Market[]> {
  const res = await fetch(`${POLYMARKET_GAMMA_API}/markets?closed=false&limit=100&active=true&order=volume&ascending=false`);

  if (!res.ok) {
    throw new Error(`Polymarket API error: ${res.status}`);
  }

  const data = await res.json();

  return data
    .filter((m: any) => m.active && !m.closed && m.enableOrderBook)
    .map((m: any): Market => {
      const outcomePrices = JSON.parse(m.outcomePrices || "[]");
      const yesPrice = parseFloat(outcomePrices[0]) || 0.5;
      const noPrice = parseFloat(outcomePrices[1]) || 1 - yesPrice;

      return {
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
      };
    });
}

export async function placePolymarketOrder(
  credentials: PlatformCredentials,
  marketId: string,
  side: ArbSide,
  price: number,
  amount: number
): Promise<{ orderId: string }> {
  // In production, this would use the CLOB API with proper authentication
  // Polymarket uses a signature-based auth with their CLOB client
  const res = await fetch(`${POLYMARKET_API}/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "POLY_API_KEY": credentials.apiKey,
      "POLY_API_SECRET": credentials.apiSecret,
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

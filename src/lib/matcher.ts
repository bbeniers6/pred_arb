import { Market, ArbOpportunity, ArbStrategy, Platform } from "@/types";

/**
 * Normalize a market title for fuzzy matching.
 * Strips common noise words, punctuation, and lowercases everything.
 */
function normalize(title: string): string {
  return title
    .toLowerCase()
    .replace(/[''""?!.,;:\-—–()[\]{}\/\\]/g, " ")
    .replace(/\b(will|the|a|an|in|on|at|to|of|for|by|be|is|are|was|were|has|have|had|do|does|did|this|that|it)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compute token overlap similarity between two strings (Jaccard-like).
 */
function tokenSimilarity(a: string, b: string): number {
  const tokensA = new Set(normalize(a).split(" ").filter(Boolean));
  const tokensB = new Set(normalize(b).split(" ").filter(Boolean));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union;
}

/**
 * Calculate arbitrage strategy for two markets.
 * The strategy is: buy YES on one platform, buy NO on the other.
 * If the combined cost < $1 per contract, there's guaranteed profit.
 */
function calculateStrategy(
  marketA: Market,
  marketB: Market,
  buyYesOn: Platform,
  buyNoOn: Platform
): ArbStrategy {
  const yesPrice = buyYesOn === marketA.platform ? marketA.yesPrice : marketB.yesPrice;
  const noPrice = buyNoOn === marketA.platform ? marketA.noPrice : marketB.noPrice;

  const totalCost = yesPrice + noPrice;
  const spread = 1 - totalCost; // positive = profit opportunity
  const profitPct = spread > 0 ? (spread / totalCost) * 100 : 0;
  const costPer100 = totalCost * 100;
  const profitPer100 = spread * 100;

  return {
    buyYesOn,
    buyNoOn,
    yesPrice,
    noPrice,
    spread,
    profitPct,
    costPer100,
    profitPer100,
  };
}

/**
 * Match markets across platforms and find arbitrage opportunities.
 */
export function findArbitrageOpportunities(
  marketsA: Market[],
  marketsB: Market[],
  minConfidence: number = 0.4,
  minProfitPct: number = 0
): ArbOpportunity[] {
  const opportunities: ArbOpportunity[] = [];

  for (const mA of marketsA) {
    for (const mB of marketsB) {
      // Skip same-platform comparisons
      if (mA.platform === mB.platform) continue;

      const confidence = tokenSimilarity(mA.title, mB.title);
      if (confidence < minConfidence) continue;

      // Calculate both possible strategies
      const strat1 = calculateStrategy(mA, mB, mA.platform, mB.platform);
      const strat2 = calculateStrategy(mA, mB, mB.platform, mA.platform);

      // Pick the better strategy
      const [best, alt] =
        strat1.profitPct >= strat2.profitPct ? [strat1, strat2] : [strat2, strat1];

      // Only include if there's at least some profit potential
      if (best.profitPct <= minProfitPct) continue;

      opportunities.push({
        id: `${mA.id}__${mB.id}`,
        marketA: mA,
        marketB: mB,
        bestStrategy: best,
        alternateStrategy: alt.profitPct > 0 ? alt : null,
        matchConfidence: confidence,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // Sort by profit % descending
  opportunities.sort((a, b) => b.bestStrategy.profitPct - a.bestStrategy.profitPct);

  return opportunities;
}

/**
 * CoinGecko Market Data Fetcher
 * Fetches and caches crypto market data from CoinGecko API
 */

import {
  createDatabase,
  CryptoMarketService,
  type CoinGeckoMarketData,
} from "@neptu/drizzle-orm";
import { TOP_CRYPTO_COINS, type CryptoCoin } from "./crypto-birthdays";

// CoinGecko ID mapping for our tracked coins
// These IDs are used in CoinGecko API URLs
const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  BNB: "binancecoin",
  XRP: "ripple",
  USDC: "usd-coin",
  SOL: "solana",
  TRX: "tron",
  DOGE: "dogecoin",
  BCH: "bitcoin-cash",
  ADA: "cardano",
  LINK: "chainlink",
  AVAX: "avalanche-2",
};

// Get all CoinGecko IDs for our tracked coins
export function getCoinGeckoIds(): string[] {
  return TOP_CRYPTO_COINS.map((coin) => COINGECKO_IDS[coin.symbol]).filter(
    Boolean,
  );
}

// Get CoinGecko ID for a symbol
export function getCoinGeckoId(symbol: string): string | undefined {
  return COINGECKO_IDS[symbol.toUpperCase()];
}

// Get symbol from CoinGecko ID
export function getSymbolFromCoinGeckoId(
  coinGeckoId: string,
): string | undefined {
  const entry = Object.entries(COINGECKO_IDS).find(
    ([_, id]) => id === coinGeckoId,
  );
  return entry?.[0];
}

/**
 * Fetch market data from CoinGecko API
 * Returns data for all our tracked coins
 */
export async function fetchCoinGeckoMarketData(): Promise<
  CoinGeckoMarketData[]
> {
  const coinIds = getCoinGeckoIds().join(",");

  const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("ids", coinIds);
  url.searchParams.set("order", "market_cap_desc");
  url.searchParams.set("per_page", "20");
  url.searchParams.set("page", "1");
  url.searchParams.set("sparkline", "false");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `CoinGecko API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as CoinGeckoMarketData[];
  return data;
}

/**
 * Fetch and store market data in database
 */
export async function fetchAndStoreCryptoMarketData(
  db: D1Database,
): Promise<{ success: boolean; coinsUpdated: number; error?: string }> {
  try {
    const database = createDatabase(db);
    const cryptoService = new CryptoMarketService(database);

    // Fetch from CoinGecko
    const marketData = await fetchCoinGeckoMarketData();

    // Store in database
    await cryptoService.bulkUpsertFromCoinGecko(marketData);

    // Cleanup old history (keep 7 days)
    await cryptoService.cleanupOldHistory();

    return {
      success: true,
      coinsUpdated: marketData.length,
    };
  } catch (error) {
    console.error("Failed to fetch crypto market data:", error);
    return {
      success: false,
      coinsUpdated: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get combined crypto data with birthdays and market info
 */
export interface CryptoWithMarketData extends CryptoCoin {
  coingeckoId: string;
  currentPrice: number | null;
  marketCap: number | null;
  marketCapRank: number | null;
  priceChange24h: number | null;
  priceChangePercentage24h: number | null;
  high24h: number | null;
  low24h: number | null;
  totalVolume: number | null;
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  ath: number | null;
  athChangePercentage: number | null;
  athDate: string | null;
  atl: number | null;
  atlChangePercentage: number | null;
  atlDate: string | null;
  image: string | null;
  lastUpdated: string | null;
}

export async function getCryptoWithMarketData(
  db: D1Database,
): Promise<CryptoWithMarketData[]> {
  const database = createDatabase(db);
  const cryptoService = new CryptoMarketService(database);

  const symbols = TOP_CRYPTO_COINS.map((c) => c.symbol);
  const marketData = await cryptoService.getMarketDataBySymbols(symbols);

  // Create a map for quick lookup
  const marketMap = new Map(marketData.map((m) => [m.symbol, m]));

  // Combine birthday data with market data
  return TOP_CRYPTO_COINS.map((coin) => {
    const market = marketMap.get(coin.symbol);
    return {
      ...coin,
      coingeckoId: COINGECKO_IDS[coin.symbol] || "",
      currentPrice: market?.currentPrice ?? null,
      marketCap: market?.marketCap ?? null,
      marketCapRank: market?.marketCapRank ?? null,
      priceChange24h: market?.priceChange24h ?? null,
      priceChangePercentage24h: market?.priceChangePercentage24h ?? null,
      high24h: market?.high24h ?? null,
      low24h: market?.low24h ?? null,
      totalVolume: market?.totalVolume ?? null,
      circulatingSupply: market?.circulatingSupply ?? null,
      totalSupply: market?.totalSupply ?? null,
      maxSupply: market?.maxSupply ?? null,
      ath: market?.ath ?? null,
      athChangePercentage: market?.athChangePercentage ?? null,
      athDate: market?.athDate ?? null,
      atl: market?.atl ?? null,
      atlChangePercentage: market?.atlChangePercentage ?? null,
      atlDate: market?.atlDate ?? null,
      image: market?.image ?? null,
      lastUpdated: market?.lastUpdated ?? null,
    };
  });
}

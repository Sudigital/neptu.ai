import {
  createDatabase,
  CryptoMarketService,
  type CoinGeckoMarketData,
  type Database,
} from "@neptu/drizzle-orm";
import { createLogger } from "@neptu/logger";
import { COINGECKO_API } from "@neptu/shared";

import { TOP_CRYPTO_COINS, type CryptoCoin } from "./crypto-birthdays";

const log = createLogger({ name: "crypto-fetcher" });

export function getCoinGeckoIds(): string[] {
  return TOP_CRYPTO_COINS.map((coin) => coin.coingeckoId).filter(Boolean);
}

export function getCoinGeckoId(symbol: string): string | undefined {
  return TOP_CRYPTO_COINS.find(
    (c) => c.symbol.toUpperCase() === symbol.toUpperCase()
  )?.coingeckoId;
}

/**
 * Fetch market data from CoinGecko API
 */
export async function fetchCoinGeckoMarketData(): Promise<
  CoinGeckoMarketData[]
> {
  const coinIds = getCoinGeckoIds().join(",");

  const url = new URL(
    `${COINGECKO_API.BASE_URL}${COINGECKO_API.MARKETS_ENDPOINT}`
  );
  url.searchParams.set("vs_currency", COINGECKO_API.VS_CURRENCY);
  url.searchParams.set("ids", coinIds);
  url.searchParams.set("order", "market_cap_desc");
  url.searchParams.set("per_page", String(COINGECKO_API.PER_PAGE));
  url.searchParams.set("page", "1");
  url.searchParams.set("sparkline", "false");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(
      `CoinGecko API error: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as CoinGeckoMarketData[];
}

/**
 * Fetch and store market data in database
 */
export async function fetchAndStoreCryptoMarketData(
  db?: Database
): Promise<{ success: boolean; coinsUpdated: number; error?: string }> {
  try {
    const database = db ?? createDatabase();
    const cryptoService = new CryptoMarketService(database);

    const marketData = await fetchCoinGeckoMarketData();

    await cryptoService.bulkUpsertFromCoinGecko(marketData);
    await cryptoService.cleanupOldHistory();

    return { success: true, coinsUpdated: marketData.length };
  } catch (error) {
    log.error({ err: error }, "Failed to fetch crypto market data");
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
  lastUpdated: string | null;
}

export async function getCryptoWithMarketData(
  db?: Database
): Promise<CryptoWithMarketData[]> {
  const database = db ?? createDatabase();
  const cryptoService = new CryptoMarketService(database);

  const symbols = TOP_CRYPTO_COINS.map((c) => c.symbol);
  const marketData = await cryptoService.getMarketDataBySymbols(symbols);

  const marketMap = new Map(marketData.map((m) => [m.symbol, m]));

  return TOP_CRYPTO_COINS.map((coin) => {
    const market = marketMap.get(coin.symbol);
    return {
      ...coin,
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
      image: market?.image || coin.image,
      lastUpdated: market?.lastUpdated ?? null,
    };
  });
}

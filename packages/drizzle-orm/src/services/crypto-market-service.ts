import { eq, desc, sql } from "drizzle-orm";

import type { Database } from "../client";

import {
  cryptoMarket,
  cryptoMarketHistory,
  type CryptoMarket,
  type NewCryptoMarket,
  type NewCryptoMarketHistory,
} from "../schemas/crypto-market";

/**
 * CoinGecko API response type for /coins/markets endpoint
 */
export interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number | null;
  high_24h: number | null;
  low_24h: number | null;
  price_change_24h: number | null;
  price_change_percentage_24h: number | null;
  market_cap_change_24h: number | null;
  market_cap_change_percentage_24h: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  ath_date: string | null;
  atl: number | null;
  atl_change_percentage: number | null;
  atl_date: string | null;
  last_updated: string | null;
}

export class CryptoMarketService {
  constructor(private db: Database) {}

  /**
   * Upsert market data for a coin (insert or update)
   */
  async upsertMarketData(data: NewCryptoMarket): Promise<CryptoMarket> {
    // Use INSERT OR REPLACE for SQLite
    await this.db
      .insert(cryptoMarket)
      .values(data)
      .onConflictDoUpdate({
        target: cryptoMarket.id,
        set: {
          symbol: data.symbol,
          name: data.name,
          image: data.image,
          currentPrice: data.currentPrice,
          marketCap: data.marketCap,
          marketCapRank: data.marketCapRank,
          totalVolume: data.totalVolume,
          high24h: data.high24h,
          low24h: data.low24h,
          priceChange24h: data.priceChange24h,
          priceChangePercentage24h: data.priceChangePercentage24h,
          circulatingSupply: data.circulatingSupply,
          totalSupply: data.totalSupply,
          maxSupply: data.maxSupply,
          ath: data.ath,
          athChangePercentage: data.athChangePercentage,
          athDate: data.athDate,
          atl: data.atl,
          atlChangePercentage: data.atlChangePercentage,
          atlDate: data.atlDate,
          lastUpdated: data.lastUpdated,
          fetchedAt: sql`now()`,
        },
      });

    const result = await this.getByCoingeckoId(data.id);
    if (!result) throw new Error("Failed to upsert market data");
    return result;
  }

  /**
   * Bulk upsert market data from CoinGecko API response
   */
  async bulkUpsertFromCoinGecko(
    marketData: CoinGeckoMarketData[]
  ): Promise<void> {
    for (const coin of marketData) {
      await this.upsertMarketData({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        currentPrice: coin.current_price,
        marketCap: coin.market_cap,
        marketCapRank: coin.market_cap_rank,
        totalVolume: coin.total_volume,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        priceChange24h: coin.price_change_24h,
        priceChangePercentage24h: coin.price_change_percentage_24h,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        maxSupply: coin.max_supply,
        ath: coin.ath,
        athChangePercentage: coin.ath_change_percentage,
        athDate: coin.ath_date,
        atl: coin.atl,
        atlChangePercentage: coin.atl_change_percentage,
        atlDate: coin.atl_date,
        lastUpdated: coin.last_updated,
      });

      // Also save to history for analysis
      await this.saveToHistory({
        coinId: coin.id,
        symbol: coin.symbol.toUpperCase(),
        currentPrice: coin.current_price,
        marketCap: coin.market_cap,
        marketCapRank: coin.market_cap_rank,
        totalVolume: coin.total_volume,
        priceChange24h: coin.price_change_24h,
        priceChangePercentage24h: coin.price_change_percentage_24h,
      });
    }
  }

  /**
   * Get market data by CoinGecko ID
   */
  async getByCoingeckoId(id: string): Promise<CryptoMarket | null> {
    const result = await this.db
      .select()
      .from(cryptoMarket)
      .where(eq(cryptoMarket.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  /**
   * Get market data by symbol (e.g., BTC, ETH)
   */
  async getBySymbol(symbol: string): Promise<CryptoMarket | null> {
    const result = await this.db
      .select()
      .from(cryptoMarket)
      .where(eq(cryptoMarket.symbol, symbol.toUpperCase()))
      .limit(1);
    return result[0] ?? null;
  }

  /**
   * Get all market data, ordered by market cap rank
   */
  async getAllMarketData(): Promise<CryptoMarket[]> {
    return this.db
      .select()
      .from(cryptoMarket)
      .orderBy(cryptoMarket.marketCapRank);
  }

  /**
   * Get market data for specific symbols
   */
  async getMarketDataBySymbols(symbols: string[]): Promise<CryptoMarket[]> {
    const upperSymbols = symbols.map((s) => s.toUpperCase());
    const results = await this.db.select().from(cryptoMarket);
    return results
      .filter((r) => upperSymbols.includes(r.symbol))
      .sort((a, b) => (a.marketCapRank ?? 999) - (b.marketCapRank ?? 999));
  }

  /**
   * Save snapshot to history table
   */
  async saveToHistory(data: NewCryptoMarketHistory): Promise<void> {
    await this.db.insert(cryptoMarketHistory).values(data);
  }

  /**
   * Get historical data for a coin
   */
  async getHistory(
    coinId: string,
    limit: number = 24
  ): Promise<
    {
      coinId: string;
      symbol: string;
      currentPrice: number | null;
      recordedAt: Date;
    }[]
  > {
    return this.db
      .select({
        coinId: cryptoMarketHistory.coinId,
        symbol: cryptoMarketHistory.symbol,
        currentPrice: cryptoMarketHistory.currentPrice,
        recordedAt: cryptoMarketHistory.recordedAt,
      })
      .from(cryptoMarketHistory)
      .where(eq(cryptoMarketHistory.coinId, coinId))
      .orderBy(desc(cryptoMarketHistory.recordedAt))
      .limit(limit);
  }

  /**
   * Clean up old history (keep last 7 days)
   */
  async cleanupOldHistory(): Promise<void> {
    await this.db
      .delete(cryptoMarketHistory)
      .where(
        sql`${cryptoMarketHistory.recordedAt} < now() - interval '7 days'`
      );
  }

  /**
   * Get last fetch time
   */
  async getLastFetchTime(): Promise<Date | null> {
    const result = await this.db
      .select({ fetchedAt: cryptoMarket.fetchedAt })
      .from(cryptoMarket)
      .orderBy(desc(cryptoMarket.fetchedAt))
      .limit(1);
    return result[0]?.fetchedAt ?? null;
  }
}

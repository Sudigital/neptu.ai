import {
  text,
  pgTable,
  index,
  integer,
  doublePrecision,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Crypto Market Data - Cached from CoinGecko API
 * Updated hourly to avoid rate limits
 */
export const cryptoMarket = pgTable(
  "crypto_market",
  {
    id: text("id").primaryKey(), // CoinGecko ID (e.g., "bitcoin", "ethereum")
    symbol: text("symbol").notNull(), // BTC, ETH, etc.
    name: text("name").notNull(),
    image: text("image"), // URL to coin logo
    currentPrice: doublePrecision("current_price"), // USD price
    marketCap: doublePrecision("market_cap"),
    marketCapRank: integer("market_cap_rank"),
    totalVolume: doublePrecision("total_volume"),
    high24h: doublePrecision("high_24h"),
    low24h: doublePrecision("low_24h"),
    priceChange24h: doublePrecision("price_change_24h"),
    priceChangePercentage24h: doublePrecision("price_change_percentage_24h"),
    circulatingSupply: doublePrecision("circulating_supply"),
    totalSupply: doublePrecision("total_supply"),
    maxSupply: doublePrecision("max_supply"),
    ath: doublePrecision("ath"), // All-time high
    athChangePercentage: doublePrecision("ath_change_percentage"),
    athDate: text("ath_date"),
    atl: doublePrecision("atl"), // All-time low
    atlChangePercentage: doublePrecision("atl_change_percentage"),
    atlDate: text("atl_date"),
    lastUpdated: text("last_updated"), // CoinGecko's last update
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("crypto_market_symbol_idx").on(table.symbol),
    index("crypto_market_rank_idx").on(table.marketCapRank),
  ]
);

export type CryptoMarket = typeof cryptoMarket.$inferSelect;
export type NewCryptoMarket = typeof cryptoMarket.$inferInsert;

/**
 * Crypto Market History - For historical analysis
 * Stores snapshots of market data over time
 */
export const cryptoMarketHistory = pgTable(
  "crypto_market_history",
  {
    id: serial("id").primaryKey(),
    coinId: text("coin_id").notNull(), // CoinGecko ID
    symbol: text("symbol").notNull(),
    currentPrice: doublePrecision("current_price"),
    marketCap: doublePrecision("market_cap"),
    marketCapRank: integer("market_cap_rank"),
    totalVolume: doublePrecision("total_volume"),
    priceChange24h: doublePrecision("price_change_24h"),
    priceChangePercentage24h: doublePrecision("price_change_percentage_24h"),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("crypto_history_coin_idx").on(table.coinId),
    index("crypto_history_recorded_idx").on(table.recordedAt),
    index("crypto_history_symbol_idx").on(table.symbol),
  ]
);

export type CryptoMarketHistory = typeof cryptoMarketHistory.$inferSelect;
export type NewCryptoMarketHistory = typeof cryptoMarketHistory.$inferInsert;

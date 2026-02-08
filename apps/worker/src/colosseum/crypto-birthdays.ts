/**
 * Crypto Coin Birthdays - Genesis/Launch dates for top coins
 * Used for generating daily cosmic readings based on Balinese astrology
 * Logos are fetched from CoinGecko API (image field)
 */

export interface CryptoCoin {
  symbol: string;
  name: string;
  birthday: string; // YYYY-MM-DD format
  description: string;
}

// Top Crypto Coins by market cap (CoinGecko, Jan 2025)
// Birthdays verified from CoinGecko genesis_date API or Wikipedia
export const TOP_CRYPTO_COINS: CryptoCoin[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    birthday: "2009-01-03", // CoinGecko genesis_date
    description: "The original cryptocurrency, digital gold",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    birthday: "2015-07-30", // CoinGecko genesis_date
    description: "Smart contract platform, DeFi backbone",
  },
  {
    symbol: "USDT",
    name: "Tether",
    birthday: "2014-10-06", // Wikipedia: First tokens issued on Bitcoin blockchain
    description: "Largest stablecoin, USD-pegged",
  },
  {
    symbol: "BNB",
    name: "BNB",
    birthday: "2017-07-08", // CoinGecko genesis_date
    description: "Binance ecosystem token",
  },
  {
    symbol: "XRP",
    name: "XRP",
    birthday: "2012-06-02", // Wikipedia: XRPL Initial release June 2012
    description: "Cross-border payments, banking bridge",
  },
  {
    symbol: "USDC",
    name: "USDC",
    birthday: "2018-09-26", // Wikipedia: Launched September 2018
    description: "Circle stablecoin, regulated USD-pegged",
  },
  {
    symbol: "SOL",
    name: "Solana",
    birthday: "2020-03-16", // Wikipedia: First block created
    description: "High-speed blockchain, meme coin hub",
  },
  {
    symbol: "TRX",
    name: "TRON",
    birthday: "2018-07-25", // Wikipedia: Initial release (mainnet)
    description: "Entertainment-focused blockchain",
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    birthday: "2013-12-08", // CoinGecko genesis_date
    description: "The people's crypto, meme legend",
  },
  {
    symbol: "BCH",
    name: "Bitcoin Cash",
    birthday: "2017-08-01", // Wikipedia: Fork at block 478,559
    description: "Bitcoin fork, peer-to-peer cash",
  },
  {
    symbol: "ADA",
    name: "Cardano",
    birthday: "2017-09-27", // Wikipedia: Initial release
    description: "Research-driven blockchain",
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    birthday: "2017-09-16", // CoinGecko genesis_date
    description: "Oracle network, real-world data",
  },
  {
    symbol: "AVAX",
    name: "Avalanche",
    birthday: "2020-09-23", // Wikipedia: Initial release
    description: "Fast finality, subnet architecture",
  },
];

/**
 * Get coin by symbol
 */
export function getCoinBySymbol(symbol: string): CryptoCoin | undefined {
  return TOP_CRYPTO_COINS.find(
    (c) => c.symbol.toLowerCase() === symbol.toLowerCase(),
  );
}

/**
 * Get all coins sorted by a specific criteria
 */
export function getAllCoins(): CryptoCoin[] {
  return [...TOP_CRYPTO_COINS];
}

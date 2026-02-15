/**
 * Crypto Coin Birthdays - Re-exports from shared package
 * Used for generating daily cosmic readings based on Balinese astrology
 */

import {
  TOP_CRYPTO_COINS as SHARED_COINS,
  type CryptoCoinConfig,
} from "@neptu/shared";

export type CryptoCoin = CryptoCoinConfig;

export const TOP_CRYPTO_COINS: CryptoCoin[] = [...SHARED_COINS];

export function getCoinBySymbol(symbol: string): CryptoCoin | undefined {
  return TOP_CRYPTO_COINS.find(
    (c) => c.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

export function getAllCoins(): CryptoCoin[] {
  return [...TOP_CRYPTO_COINS];
}

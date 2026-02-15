export interface CryptoWithMarketData {
  symbol: string;
  name: string;
  birthday: string;
  description?: string;
  coingeckoId?: string;
  image?: string;
  currentPrice?: number;
  marketCap?: number;
  marketCapRank?: number;
  priceChange24h?: number;
  priceChangePercentage24h?: number;
  totalVolume?: number;
  high24h?: number;
  low24h?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  maxSupply?: number;
  ath?: number;
  athChangePercentage?: number;
  athDate?: string;
  atl?: number;
  atlChangePercentage?: number;
  atlDate?: string;
  lastUpdated?: string;
  cosmicAlignment?: {
    dayName: string;
    pancaWara: string;
    saptaWara: string;
    wuku: string;
    alignmentScore: number;
    cosmicMessage: string;
  };
  athCosmic?: {
    score: number;
    pancaWara: string;
    saptaWara: string;
  };
  atlCosmic?: {
    score: number;
    pancaWara: string;
    saptaWara: string;
  };
}

export function formatCurrency(value: number | undefined): string {
  if (!value) return "-";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1000) {
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
  return `$${value.toFixed(value < 1 ? 6 : 2)}`;
}

export function formatPercentage(value: number | undefined | null): string {
  if (value === undefined || value === null) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function getAge(birthday: string): number {
  const now = new Date();
  const birthDate = new Date(birthday);
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

export function getAgeInDays(birthday: string): number {
  const now = new Date();
  const birthDate = new Date(birthday);
  return Math.floor(
    (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function isBirthdayToday(birthday: string): boolean {
  const now = new Date();
  const birthDate = new Date(birthday);
  return (
    now.getMonth() === birthDate.getMonth() &&
    now.getDate() === birthDate.getDate()
  );
}

export function isBirthdayThisMonth(birthday: string): boolean {
  const now = new Date();
  const birthDate = new Date(birthday);
  return now.getMonth() === birthDate.getMonth();
}

export function formatFullDate(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatNumber(value: number | undefined): string {
  if (!value) return "-";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function getDaysUntilBirthday(birthday: string): number {
  const now = new Date();
  const birthDate = new Date(birthday);
  const thisYearBirthday = new Date(
    now.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  );
  if (thisYearBirthday < now) {
    thisYearBirthday.setFullYear(now.getFullYear() + 1);
  }
  const diffTime = thisYearBirthday.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

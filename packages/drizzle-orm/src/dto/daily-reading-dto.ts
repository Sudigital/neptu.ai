import type { DailyReading } from "../schemas/daily-readings";

export interface DailyReadingDTO {
  date: string;
  type: "peluang";
  readingData: Record<string, unknown>;
  createdAt: string;
}

export function toDailyReadingDTO(reading: DailyReading): DailyReadingDTO {
  return {
    date: reading.date,
    type: reading.type,
    readingData: (reading.readingData ?? {}) as Record<string, unknown>,
    createdAt: reading.createdAt.toISOString(),
  };
}

export function toDailyReadingDTOList(
  readings: DailyReading[]
): DailyReadingDTO[] {
  return readings.map(toDailyReadingDTO);
}

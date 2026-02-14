import type { Reading } from "../schemas/readings";

export interface ReadingDTO {
  id: string;
  userId: string;
  type: "potensi" | "peluang" | "compatibility";
  targetDate: string;
  birthDate: string | null;
  birthDate2: string | null;
  readingData: Record<string, unknown>;
  txSignature: string | null;
  createdAt: string;
}

export function toReadingDTO(reading: Reading): ReadingDTO {
  return {
    id: reading.id,
    userId: reading.userId,
    type: reading.type,
    targetDate: reading.targetDate,
    birthDate: reading.birthDate,
    birthDate2: reading.birthDate2,
    readingData: (reading.readingData ?? {}) as Record<string, unknown>,
    txSignature: reading.txSignature,
    createdAt: reading.createdAt.toISOString(),
  };
}

export function toReadingDTOList(readings: Reading[]): ReadingDTO[] {
  return readings.map(toReadingDTO);
}

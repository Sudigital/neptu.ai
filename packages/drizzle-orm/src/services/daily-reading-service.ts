import type { Database } from "../client";
import { DailyReadingRepository } from "../repositories/daily-reading-repository";
import {
  toDailyReadingDTO,
  toDailyReadingDTOList,
  type DailyReadingDTO,
} from "../dto/daily-reading-dto";
import {
  createDailyReadingSchema,
  getDailyReadingSchema,
  type CreateDailyReadingInput,
  type GetDailyReadingInput,
} from "../validators/daily-reading-validator";

export class DailyReadingService {
  private repository: DailyReadingRepository;

  constructor(db: Database) {
    this.repository = new DailyReadingRepository(db);
  }

  async createOrUpdateDailyReading(
    input: CreateDailyReadingInput,
  ): Promise<DailyReadingDTO> {
    const validated = createDailyReadingSchema.parse(input);

    const reading = await this.repository.upsert({
      date: validated.date,
      type: validated.type,
      readingData: validated.readingData,
    });

    return toDailyReadingDTO(reading);
  }

  async getDailyReading(
    input: GetDailyReadingInput,
  ): Promise<DailyReadingDTO | null> {
    const validated = getDailyReadingSchema.parse(input);

    const reading = await this.repository.findByDateAndType(
      validated.date,
      validated.type,
    );
    return reading ? toDailyReadingDTO(reading) : null;
  }

  async getReadingsInRange(
    startDate: string,
    endDate: string,
    type: "peluang",
  ): Promise<DailyReadingDTO[]> {
    const readings = await this.repository.findByDateRange(
      startDate,
      endDate,
      type,
    );
    return toDailyReadingDTOList(readings);
  }

  async cleanupOldReadings(olderThanDate: string): Promise<number> {
    return this.repository.deleteOlderThan(olderThanDate);
  }
}

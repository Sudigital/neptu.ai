import type { Database } from "../client";

import {
  toReadingDTO,
  toReadingDTOList,
  type ReadingDTO,
} from "../dto/reading-dto";
import {
  ReadingRepository,
  type ListReadingsOptions,
  type PaginatedResult,
} from "../repositories/reading-repository";
import {
  createReadingSchema,
  getReadingsByUserSchema,
  type CreateReadingInput,
  type GetReadingsByUserInput,
} from "../validators/reading-validator";

export class ReadingService {
  private repository: ReadingRepository;

  constructor(db: Database) {
    this.repository = new ReadingRepository(db);
  }

  async createReading(input: CreateReadingInput): Promise<ReadingDTO> {
    const validated = createReadingSchema.parse(input);

    const reading = await this.repository.create({
      userId: validated.userId,
      type: validated.type,
      targetDate: validated.targetDate,
      birthDate: validated.birthDate,
      birthDate2: validated.birthDate2,
      readingData: validated.readingData,
      txSignature: validated.txSignature,
    });

    return toReadingDTO(reading);
  }

  async getReadingById(id: string): Promise<ReadingDTO | null> {
    const reading = await this.repository.findById(id);
    return reading ? toReadingDTO(reading) : null;
  }

  async getReadingsByUser(
    input: GetReadingsByUserInput
  ): Promise<ReadingDTO[]> {
    const validated = getReadingsByUserSchema.parse(input);

    const readings = await this.repository.findByUser({
      userId: validated.userId,
      type: validated.type,
      limit: validated.limit,
      offset: validated.offset,
    });

    return toReadingDTOList(readings);
  }

  async checkExistingReading(
    userId: string,
    type: "potensi" | "peluang" | "compatibility",
    targetDate: string
  ): Promise<ReadingDTO | null> {
    const reading = await this.repository.findByUserAndDate(
      userId,
      type,
      targetDate
    );
    return reading ? toReadingDTO(reading) : null;
  }

  // Admin methods
  async listReadings(
    options: ListReadingsOptions
  ): Promise<PaginatedResult<ReadingDTO>> {
    const result = await this.repository.list(options);
    return {
      ...result,
      data: result.data.map(toReadingDTO),
    };
  }

  async getStats(): Promise<{
    total: number;
    potensi: number;
    peluang: number;
    compatibility: number;
    todayNew: number;
  }> {
    return this.repository.getStats();
  }
}

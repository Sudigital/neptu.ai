import type { Database } from "../client";

import {
  toApiUsageDTO,
  type ApiUsageDTO,
  type ApiUsageSummaryDTO,
} from "../dto/api-usage-dto";
import {
  ApiUsageRepository,
  type UsageAnalyticsOptions,
  type UsageAnalyticsPoint,
  type TopEndpoint,
} from "../repositories/api-usage-repository";
import {
  createApiUsageSchema,
  type CreateApiUsageInput,
} from "../validators/api-usage-validator";

export class ApiUsageService {
  private repository: ApiUsageRepository;

  constructor(db: Database) {
    this.repository = new ApiUsageRepository(db);
  }

  async recordUsage(input: CreateApiUsageInput): Promise<ApiUsageDTO> {
    const validated = createApiUsageSchema.parse(input);
    const id = crypto.randomUUID();

    const usage = await this.repository.create({
      id,
      apiKeyId: validated.apiKeyId,
      endpoint: validated.endpoint,
      method: validated.method,
      creditsUsed: validated.creditsUsed,
      isAiEndpoint: validated.isAiEndpoint ? "true" : "false",
      responseStatus: validated.responseStatus ?? null,
      responseTimeMs: validated.responseTimeMs ?? null,
      ipAddress: validated.ipAddress ?? null,
      userAgent: validated.userAgent ?? null,
    });

    return toApiUsageDTO(usage);
  }

  async getUsageByApiKeyId(
    apiKeyId: string,
    limit = 100
  ): Promise<ApiUsageDTO[]> {
    const usage = await this.repository.findByApiKeyId(apiKeyId, limit);
    return usage.map(toApiUsageDTO);
  }

  async getUsageInRange(
    apiKeyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ApiUsageDTO[]> {
    const usage = await this.repository.findByApiKeyIdInRange(
      apiKeyId,
      startDate,
      endDate
    );
    return usage.map(toApiUsageDTO);
  }

  async getUsageSummary(
    apiKeyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ApiUsageSummaryDTO> {
    const counts = await this.repository.countByApiKeyIdInRange(
      apiKeyId,
      startDate,
      endDate
    );
    const creditsUsed = await this.repository.sumCreditsUsedInRange(
      apiKeyId,
      startDate,
      endDate
    );
    const avgResponseTime = await this.repository.getAverageResponseTime(
      apiKeyId,
      startDate,
      endDate
    );

    return {
      totalCalls: counts.total,
      basicCalls: counts.basic,
      aiCalls: counts.ai,
      totalCreditsUsed: creditsUsed,
      averageResponseTimeMs: avgResponseTime,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
    };
  }

  async getCurrentMonthSummary(apiKeyId: string): Promise<ApiUsageSummaryDTO> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return this.getUsageSummary(apiKeyId, startDate, endDate);
  }

  // Admin methods
  async getStats(): Promise<{
    totalCalls: number;
    todayCalls: number;
    totalCreditsUsed: number;
    avgResponseTime: number;
  }> {
    return this.repository.getStats();
  }

  async getAnalytics(
    options: UsageAnalyticsOptions
  ): Promise<UsageAnalyticsPoint[]> {
    return this.repository.getAnalytics(options);
  }

  async getTopEndpoints(limit: number): Promise<TopEndpoint[]> {
    return this.repository.getTopEndpoints(limit);
  }
}

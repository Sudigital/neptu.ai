import type { ApiUsage } from "../schemas/api-usage";

export interface ApiUsageDTO {
  id: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  creditsUsed: number;
  isAiEndpoint: boolean;
  responseStatus: number | null;
  responseTimeMs: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ApiUsageSummaryDTO {
  totalCalls: number;
  basicCalls: number;
  aiCalls: number;
  totalCreditsUsed: number;
  averageResponseTimeMs: number;
  periodStart: string;
  periodEnd: string;
}

export function toApiUsageDTO(usage: ApiUsage): ApiUsageDTO {
  return {
    id: usage.id,
    apiKeyId: usage.apiKeyId,
    endpoint: usage.endpoint,
    method: usage.method,
    creditsUsed: usage.creditsUsed,
    isAiEndpoint: usage.isAiEndpoint === "true",
    responseStatus: usage.responseStatus,
    responseTimeMs: usage.responseTimeMs,
    ipAddress: usage.ipAddress,
    userAgent: usage.userAgent,
    metadata: usage.metadata as Record<string, unknown> | null,
    createdAt: usage.createdAt.toISOString(),
  };
}

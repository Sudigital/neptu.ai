import { z } from "zod";

export const createApiUsageSchema = z.object({
  apiKeyId: z.string().uuid(),
  endpoint: z.string().min(1).max(255),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  creditsUsed: z.number().int().min(1).default(1),
  isAiEndpoint: z.boolean().default(false),
  responseStatus: z.number().int().min(100).max(599).optional(),
  responseTimeMs: z.number().int().min(0).optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
});

export type CreateApiUsageInput = z.infer<typeof createApiUsageSchema>;

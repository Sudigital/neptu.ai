import { z } from "zod";

export const apiScopesSchema = z.array(
  z.enum(["neptu:read", "neptu:write", "neptu:ai", "neptu:admin"])
);

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: apiScopesSchema,
  allowedOrigins: z.array(z.string().url()).optional(),
  allowedIps: z.array(z.string().ip()).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  scopes: apiScopesSchema.optional(),
  allowedOrigins: z.array(z.string().url()).optional().nullable(),
  allowedIps: z.array(z.string().ip()).optional().nullable(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>;
export type ApiScope = z.infer<typeof apiScopesSchema>[number];

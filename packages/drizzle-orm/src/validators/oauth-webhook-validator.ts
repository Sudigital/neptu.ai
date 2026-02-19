import { OAUTH_WEBHOOK_EVENTS } from "@neptu/shared";
import { z } from "zod";

export const createWebhookSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  events: z
    .array(z.enum(OAUTH_WEBHOOK_EVENTS))
    .min(1, "At least one event required")
    .max(OAUTH_WEBHOOK_EVENTS.length),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;

export const updateWebhookSchema = z.object({
  url: z.string().url("Must be a valid URL").optional(),
  events: z
    .array(z.enum(OAUTH_WEBHOOK_EVENTS))
    .min(1, "At least one event required")
    .max(OAUTH_WEBHOOK_EVENTS.length)
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;

CREATE TABLE "oauth_webhook_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"webhook_id" text NOT NULL,
	"event" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"http_status" integer,
	"response_body" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_webhooks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"client_id" text NOT NULL,
	"url" text NOT NULL,
	"secret" text NOT NULL,
	"events" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "oauth_webhook_deliveries" ADD CONSTRAINT "oauth_webhook_deliveries_webhook_id_oauth_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."oauth_webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_webhooks" ADD CONSTRAINT "oauth_webhooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_webhooks" ADD CONSTRAINT "oauth_webhooks_client_id_oauth_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "oauth_webhook_deliveries_webhook_id_idx" ON "oauth_webhook_deliveries" USING btree ("webhook_id");--> statement-breakpoint
CREATE INDEX "oauth_webhook_deliveries_status_idx" ON "oauth_webhook_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "oauth_webhook_deliveries_event_idx" ON "oauth_webhook_deliveries" USING btree ("event");--> statement-breakpoint
CREATE INDEX "oauth_webhooks_user_id_idx" ON "oauth_webhooks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "oauth_webhooks_client_id_idx" ON "oauth_webhooks" USING btree ("client_id");
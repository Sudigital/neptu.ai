-- API Pricing Plans table
CREATE TABLE IF NOT EXISTS "api_pricing_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"description" text,
	"tier" text NOT NULL,
	"price_usd" numeric DEFAULT '0' NOT NULL,
	"price_sol" numeric,
	"price_neptu" numeric,
	"billing_period" text DEFAULT 'monthly' NOT NULL,
	"features" jsonb NOT NULL,
	"limits" jsonb NOT NULL,
	"overage_rates" jsonb NOT NULL,
	"discount_percent" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_popular" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- API Keys table
CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "users"("id"),
	"name" text NOT NULL,
	"key_hash" text NOT NULL UNIQUE,
	"key_prefix" text NOT NULL,
	"plan_id" text REFERENCES "api_pricing_plans"("id"),
	"scopes" jsonb NOT NULL,
	"allowed_origins" jsonb,
	"allowed_ips" jsonb,
	"is_active" boolean DEFAULT true,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "api_keys_user_idx" ON "api_keys" ("user_id");
CREATE INDEX IF NOT EXISTS "api_keys_hash_idx" ON "api_keys" ("key_hash");
CREATE INDEX IF NOT EXISTS "api_keys_prefix_idx" ON "api_keys" ("key_prefix");

-- API Subscriptions table
CREATE TABLE IF NOT EXISTS "api_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "users"("id"),
	"plan_id" text NOT NULL REFERENCES "api_pricing_plans"("id"),
	"status" text DEFAULT 'active' NOT NULL,
	"credits_remaining" integer DEFAULT 0 NOT NULL,
	"ai_credits_remaining" integer DEFAULT 0 NOT NULL,
	"billing_cycle_start" timestamp with time zone NOT NULL,
	"billing_cycle_end" timestamp with time zone NOT NULL,
	"payment_method" text,
	"payment_tx_signature" text,
	"metadata" jsonb,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "api_subscriptions_user_idx" ON "api_subscriptions" ("user_id");
CREATE INDEX IF NOT EXISTS "api_subscriptions_plan_idx" ON "api_subscriptions" ("plan_id");
CREATE INDEX IF NOT EXISTS "api_subscriptions_status_idx" ON "api_subscriptions" ("status");

-- API Usage table
CREATE TABLE IF NOT EXISTS "api_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"api_key_id" text NOT NULL REFERENCES "api_keys"("id"),
	"endpoint" text NOT NULL,
	"method" text NOT NULL,
	"credits_used" integer DEFAULT 1 NOT NULL,
	"is_ai_endpoint" text DEFAULT 'false' NOT NULL,
	"response_status" integer,
	"response_time_ms" integer,
	"ip_address" text,
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "api_usage_key_idx" ON "api_usage" ("api_key_id");
CREATE INDEX IF NOT EXISTS "api_usage_endpoint_idx" ON "api_usage" ("endpoint");
CREATE INDEX IF NOT EXISTS "api_usage_created_idx" ON "api_usage" ("created_at");

-- API Credit Packs table
CREATE TABLE IF NOT EXISTS "api_credit_packs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"description" text,
	"credits" integer NOT NULL,
	"ai_credits" integer DEFAULT 0 NOT NULL,
	"price_usd" numeric NOT NULL,
	"price_sol" numeric,
	"price_neptu" numeric,
	"bonus_percent" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

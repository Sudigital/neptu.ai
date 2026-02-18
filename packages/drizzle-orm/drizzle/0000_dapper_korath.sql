CREATE TABLE "api_credit_packs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_credit_packs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"plan_id" text,
	"scopes" jsonb NOT NULL,
	"allowed_origins" jsonb,
	"allowed_ips" jsonb,
	"is_active" boolean DEFAULT true,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "api_pricing_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_pricing_plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "api_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" text NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "api_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"api_key_id" text NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "crypto_market" (
	"id" text PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"current_price" double precision,
	"market_cap" double precision,
	"market_cap_rank" integer,
	"total_volume" double precision,
	"high_24h" double precision,
	"low_24h" double precision,
	"price_change_24h" double precision,
	"price_change_percentage_24h" double precision,
	"circulating_supply" double precision,
	"total_supply" double precision,
	"max_supply" double precision,
	"ath" double precision,
	"ath_change_percentage" double precision,
	"ath_date" text,
	"atl" double precision,
	"atl_change_percentage" double precision,
	"atl_date" text,
	"last_updated" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crypto_market_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"coin_id" text NOT NULL,
	"symbol" text NOT NULL,
	"current_price" double precision,
	"market_cap" double precision,
	"market_cap_rank" integer,
	"total_volume" double precision,
	"price_change_24h" double precision,
	"price_change_percentage_24h" double precision,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_readings" (
	"date" text NOT NULL,
	"type" text NOT NULL,
	"reading_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_readings_date_type_pk" PRIMARY KEY("date","type")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"reading_id" text,
	"payment_type" text NOT NULL,
	"amount" numeric NOT NULL,
	"neptu_reward" numeric,
	"neptu_burned" numeric,
	"tx_signature" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" text,
	CONSTRAINT "payments_tx_signature_unique" UNIQUE("tx_signature")
);
--> statement-breakpoint
CREATE TABLE "pricing_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"price_usd" numeric DEFAULT '0' NOT NULL,
	"price_sol" numeric,
	"price_neptu" numeric,
	"price_sudigital" numeric,
	"features" jsonb NOT NULL,
	"limits" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_popular" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pricing_plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "readings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"target_date" text NOT NULL,
	"birth_date" text,
	"birth_date_2" text,
	"reading_data" jsonb NOT NULL,
	"tx_signature" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" text PRIMARY KEY NOT NULL,
	"referrer_id" text NOT NULL,
	"referee_id" text NOT NULL,
	"referrer_reward_amount" numeric,
	"referee_reward_amount" numeric,
	"referrer_reward_paid" text DEFAULT 'pending' NOT NULL,
	"referee_reward_paid" text DEFAULT 'pending' NOT NULL,
	"referrer_reward_tx_signature" text,
	"referee_reward_tx_signature" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" text,
	CONSTRAINT "referrals_referee_id_unique" UNIQUE("referee_id")
);
--> statement-breakpoint
CREATE TABLE "token_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tx_signature" text NOT NULL,
	"transaction_type" text NOT NULL,
	"reading_type" text,
	"sol_amount" numeric,
	"neptu_amount" numeric,
	"sudigital_amount" numeric,
	"neptu_burned" numeric,
	"neptu_rewarded" numeric,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" text,
	CONSTRAINT "token_transactions_tx_signature_unique" UNIQUE("tx_signature")
);
--> statement-breakpoint
CREATE TABLE "user_rewards" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"reward_type" text NOT NULL,
	"neptu_amount" numeric NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"description" text,
	"claim_tx_signature" text,
	"expires_at" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"claimed_at" text
);
--> statement-breakpoint
CREATE TABLE "user_streaks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_check_in" text,
	"total_check_ins" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_streaks_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"email" text,
	"display_name" text,
	"birth_date" text,
	"interests" jsonb,
	"onboarded" boolean DEFAULT false,
	"is_admin" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_plan_id_api_pricing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."api_pricing_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_subscriptions" ADD CONSTRAINT "api_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_subscriptions" ADD CONSTRAINT "api_subscriptions_plan_id_api_pricing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."api_pricing_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage" ADD CONSTRAINT "api_usage_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readings" ADD CONSTRAINT "readings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_transactions" ADD CONSTRAINT "token_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_rewards" ADD CONSTRAINT "user_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_user_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_keys_hash_idx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "api_keys_prefix_idx" ON "api_keys" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "api_subscriptions_user_idx" ON "api_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_subscriptions_plan_idx" ON "api_subscriptions" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "api_subscriptions_status_idx" ON "api_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "api_usage_key_idx" ON "api_usage" USING btree ("api_key_id");--> statement-breakpoint
CREATE INDEX "api_usage_endpoint_idx" ON "api_usage" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "api_usage_created_idx" ON "api_usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "crypto_market_symbol_idx" ON "crypto_market" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "crypto_market_rank_idx" ON "crypto_market" USING btree ("market_cap_rank");--> statement-breakpoint
CREATE INDEX "crypto_history_coin_idx" ON "crypto_market_history" USING btree ("coin_id");--> statement-breakpoint
CREATE INDEX "crypto_history_recorded_idx" ON "crypto_market_history" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "crypto_history_symbol_idx" ON "crypto_market_history" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "daily_readings_date_idx" ON "daily_readings" USING btree ("date");--> statement-breakpoint
CREATE INDEX "payments_user_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_tx_idx" ON "payments" USING btree ("tx_signature");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "readings_user_idx" ON "readings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "readings_type_idx" ON "readings" USING btree ("type");--> statement-breakpoint
CREATE INDEX "readings_date_idx" ON "readings" USING btree ("target_date");--> statement-breakpoint
CREATE INDEX "referrals_referrer_idx" ON "referrals" USING btree ("referrer_id");--> statement-breakpoint
CREATE INDEX "referrals_referee_idx" ON "referrals" USING btree ("referee_id");--> statement-breakpoint
CREATE INDEX "token_tx_user_idx" ON "token_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "token_tx_signature_idx" ON "token_transactions" USING btree ("tx_signature");--> statement-breakpoint
CREATE INDEX "token_tx_status_idx" ON "token_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "token_tx_type_idx" ON "token_transactions" USING btree ("transaction_type");--> statement-breakpoint
CREATE INDEX "user_rewards_user_idx" ON "user_rewards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_rewards_status_idx" ON "user_rewards" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_rewards_type_idx" ON "user_rewards" USING btree ("reward_type");--> statement-breakpoint
CREATE INDEX "user_streaks_user_idx" ON "user_streaks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_wallet_idx" ON "users" USING btree ("wallet_address");
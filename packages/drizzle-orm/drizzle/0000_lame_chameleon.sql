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
CREATE TABLE "billionaire_daily_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"summary_date" date NOT NULL,
	"billionaire_count" integer NOT NULL,
	"total_net_worth_billions" double precision NOT NULL,
	"total_daily_change_billions" double precision,
	"avg_net_worth_billions" double precision,
	"avg_prosperity_score" double precision,
	"avg_daily_energy_score" double precision,
	"avg_urip_peluang_score" double precision,
	"avg_compatibility_score" double precision,
	"neptu_sentiment_score" double precision,
	"top_gainer_id" text,
	"top_gainer_change" double precision,
	"top_loser_id" text,
	"top_loser_change" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billionaire_daily_summary_date_uniq" UNIQUE("summary_date")
);
--> statement-breakpoint
CREATE TABLE "billionaire_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"figure_id" text NOT NULL,
	"snapshot_date" date NOT NULL,
	"forbes_rank" integer,
	"net_worth_billions" double precision NOT NULL,
	"daily_change_billions" double precision,
	"private_assets_worth" double precision,
	"country" text,
	"industry" text,
	"wealth_source" text,
	"financial_assets" jsonb DEFAULT '[]'::jsonb,
	"prosperity_score" double precision,
	"daily_energy_score" double precision,
	"urip_peluang_score" double precision,
	"compatibility_score" double precision,
	"neptu_alpha_score" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billionaire_snapshot_figure_date_uniq" UNIQUE("figure_id","snapshot_date")
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
CREATE TABLE "habit_completions" (
	"id" text PRIMARY KEY NOT NULL,
	"habit_id" text NOT NULL,
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "habit_completions_habit_date_uniq" UNIQUE("habit_id","date")
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '',
	"category" text DEFAULT 'health' NOT NULL,
	"frequency" text DEFAULT 'daily' NOT NULL,
	"target_count" integer DEFAULT 1 NOT NULL,
	"scheduled_time" text,
	"days_of_week" jsonb DEFAULT '[0,1,2,3,4,5,6]'::jsonb,
	"token_reward" numeric DEFAULT '0.1' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_access_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text,
	"scopes" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_access_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "oauth_authorization_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"code_hash" text NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text NOT NULL,
	"redirect_uri" text NOT NULL,
	"scopes" jsonb NOT NULL,
	"code_challenge" text NOT NULL,
	"code_challenge_method" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_authorization_codes_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
CREATE TABLE "oauth_clients" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"client_id" text NOT NULL,
	"client_secret_hash" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"logo_url" text,
	"redirect_uris" jsonb NOT NULL,
	"scopes" jsonb NOT NULL,
	"grant_types" jsonb NOT NULL,
	"is_confidential" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_clients_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "oauth_refresh_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"access_token_id" text NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
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
CREATE TABLE "persons" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"last_name" text,
	"slug" text,
	"birthday" text NOT NULL,
	"gender" text,
	"categories" jsonb DEFAULT '["world_leader"]'::jsonb NOT NULL,
	"nationality" text,
	"title" text,
	"description" text,
	"image_url" text,
	"thumbnail_url" text,
	"wikidata_id" text,
	"wikipedia_url" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"popularity" integer,
	"source" text DEFAULT 'manual' NOT NULL,
	"source_url" text,
	"wuku_data" jsonb,
	"city" text,
	"state" text,
	"bios" jsonb,
	"abouts" jsonb,
	"industries" jsonb,
	"net_worth_billions" double precision,
	"forbes_rank" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"crawled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "persons_wikidata_uniq" UNIQUE("wikidata_id"),
	CONSTRAINT "persons_name_uniq" UNIQUE("name"),
	CONSTRAINT "persons_slug_uniq" UNIQUE("slug")
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
	"preferred_language" text DEFAULT 'en',
	"interests" jsonb,
	"onboarded" boolean DEFAULT false,
	"role" text DEFAULT 'user' NOT NULL,
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
ALTER TABLE "billionaire_snapshots" ADD CONSTRAINT "billionaire_snapshots_figure_id_persons_id_fk" FOREIGN KEY ("figure_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_completions" ADD CONSTRAINT "habit_completions_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_completions" ADD CONSTRAINT "habit_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_client_id_oauth_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_client_id_oauth_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_clients" ADD CONSTRAINT "oauth_clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "oauth_refresh_tokens_access_token_id_oauth_access_tokens_id_fk" FOREIGN KEY ("access_token_id") REFERENCES "public"."oauth_access_tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "oauth_refresh_tokens_client_id_oauth_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "oauth_refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_webhook_deliveries" ADD CONSTRAINT "oauth_webhook_deliveries_webhook_id_oauth_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."oauth_webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_webhooks" ADD CONSTRAINT "oauth_webhooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_webhooks" ADD CONSTRAINT "oauth_webhooks_client_id_oauth_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "billionaire_daily_summary_date_idx" ON "billionaire_daily_summaries" USING btree ("summary_date");--> statement-breakpoint
CREATE INDEX "billionaire_snapshot_date_idx" ON "billionaire_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "billionaire_snapshot_figure_idx" ON "billionaire_snapshots" USING btree ("figure_id");--> statement-breakpoint
CREATE INDEX "billionaire_snapshot_rank_idx" ON "billionaire_snapshots" USING btree ("forbes_rank");--> statement-breakpoint
CREATE INDEX "crypto_market_symbol_idx" ON "crypto_market" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "crypto_market_rank_idx" ON "crypto_market" USING btree ("market_cap_rank");--> statement-breakpoint
CREATE INDEX "crypto_history_coin_idx" ON "crypto_market_history" USING btree ("coin_id");--> statement-breakpoint
CREATE INDEX "crypto_history_recorded_idx" ON "crypto_market_history" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "crypto_history_symbol_idx" ON "crypto_market_history" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "daily_readings_date_idx" ON "daily_readings" USING btree ("date");--> statement-breakpoint
CREATE INDEX "habit_completions_habit_idx" ON "habit_completions" USING btree ("habit_id");--> statement-breakpoint
CREATE INDEX "habit_completions_user_idx" ON "habit_completions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "habit_completions_date_idx" ON "habit_completions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "habit_completions_user_date_idx" ON "habit_completions" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "habits_user_idx" ON "habits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "habits_user_status_idx" ON "habits" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "habits_category_idx" ON "habits" USING btree ("category");--> statement-breakpoint
CREATE INDEX "oauth_access_tokens_hash_idx" ON "oauth_access_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "oauth_access_tokens_client_idx" ON "oauth_access_tokens" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "oauth_access_tokens_user_idx" ON "oauth_access_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "oauth_auth_codes_hash_idx" ON "oauth_authorization_codes" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX "oauth_auth_codes_client_idx" ON "oauth_authorization_codes" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "oauth_auth_codes_user_idx" ON "oauth_authorization_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "oauth_clients_user_idx" ON "oauth_clients" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "oauth_clients_client_id_idx" ON "oauth_clients" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "oauth_refresh_tokens_hash_idx" ON "oauth_refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "oauth_refresh_tokens_access_idx" ON "oauth_refresh_tokens" USING btree ("access_token_id");--> statement-breakpoint
CREATE INDEX "oauth_refresh_tokens_client_idx" ON "oauth_refresh_tokens" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "oauth_refresh_tokens_user_idx" ON "oauth_refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "oauth_webhook_deliveries_webhook_id_idx" ON "oauth_webhook_deliveries" USING btree ("webhook_id");--> statement-breakpoint
CREATE INDEX "oauth_webhook_deliveries_status_idx" ON "oauth_webhook_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "oauth_webhook_deliveries_event_idx" ON "oauth_webhook_deliveries" USING btree ("event");--> statement-breakpoint
CREATE INDEX "oauth_webhooks_user_id_idx" ON "oauth_webhooks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "oauth_webhooks_client_id_idx" ON "oauth_webhooks" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "payments_user_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_tx_idx" ON "payments" USING btree ("tx_signature");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "persons_birthday_idx" ON "persons" USING btree ("birthday");--> statement-breakpoint
CREATE INDEX "persons_status_idx" ON "persons" USING btree ("status");--> statement-breakpoint
CREATE INDEX "persons_source_idx" ON "persons" USING btree ("source");--> statement-breakpoint
CREATE INDEX "persons_wikidata_idx" ON "persons" USING btree ("wikidata_id");--> statement-breakpoint
CREATE INDEX "persons_slug_idx" ON "persons" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "persons_forbes_rank_idx" ON "persons" USING btree ("forbes_rank");--> statement-breakpoint
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
CREATE INDEX "users_wallet_idx" ON "users" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");
CREATE TABLE `daily_readings` (
	`date` text NOT NULL,
	`type` text NOT NULL,
	`reading_data` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	PRIMARY KEY(`date`, `type`)
);
--> statement-breakpoint
CREATE INDEX `daily_readings_date_idx` ON `daily_readings` (`date`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`reading_id` text,
	`payment_type` text NOT NULL,
	`amount` real NOT NULL,
	`neptu_reward` real,
	`neptu_burned` real,
	`tx_signature` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`confirmed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_tx_signature_unique` ON `payments` (`tx_signature`);--> statement-breakpoint
CREATE INDEX `payments_user_idx` ON `payments` (`user_id`);--> statement-breakpoint
CREATE INDEX `payments_tx_idx` ON `payments` (`tx_signature`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE TABLE `pricing_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`price_usd` real DEFAULT 0 NOT NULL,
	`price_sol` real,
	`price_neptu` real,
	`features` text NOT NULL,
	`limits` text NOT NULL,
	`is_active` integer DEFAULT true,
	`is_popular` integer DEFAULT false,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pricing_plans_slug_unique` ON `pricing_plans` (`slug`);--> statement-breakpoint
CREATE TABLE `readings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`target_date` text NOT NULL,
	`birth_date` text,
	`birth_date_2` text,
	`reading_data` text NOT NULL,
	`tx_signature` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `readings_user_idx` ON `readings` (`user_id`);--> statement-breakpoint
CREATE INDEX `readings_type_idx` ON `readings` (`type`);--> statement-breakpoint
CREATE INDEX `readings_date_idx` ON `readings` (`target_date`);--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` text PRIMARY KEY NOT NULL,
	`referrer_id` text NOT NULL,
	`referee_id` text NOT NULL,
	`referrer_reward_amount` real,
	`referee_reward_amount` real,
	`referrer_reward_paid` text DEFAULT 'pending' NOT NULL,
	`referee_reward_paid` text DEFAULT 'pending' NOT NULL,
	`referrer_reward_tx_signature` text,
	`referee_reward_tx_signature` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`referrer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`referee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `referrals_referee_id_unique` ON `referrals` (`referee_id`);--> statement-breakpoint
CREATE INDEX `referrals_referrer_idx` ON `referrals` (`referrer_id`);--> statement-breakpoint
CREATE INDEX `referrals_referee_idx` ON `referrals` (`referee_id`);--> statement-breakpoint
CREATE TABLE `token_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tx_signature` text NOT NULL,
	`transaction_type` text NOT NULL,
	`reading_type` text,
	`sol_amount` real,
	`neptu_amount` real,
	`neptu_burned` real,
	`neptu_rewarded` real,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`confirmed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `token_transactions_tx_signature_unique` ON `token_transactions` (`tx_signature`);--> statement-breakpoint
CREATE INDEX `token_tx_user_idx` ON `token_transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `token_tx_signature_idx` ON `token_transactions` (`tx_signature`);--> statement-breakpoint
CREATE INDEX `token_tx_status_idx` ON `token_transactions` (`status`);--> statement-breakpoint
CREATE INDEX `token_tx_type_idx` ON `token_transactions` (`transaction_type`);--> statement-breakpoint
CREATE TABLE `user_rewards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`reward_type` text NOT NULL,
	`neptu_amount` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`description` text,
	`claim_tx_signature` text,
	`expires_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`claimed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_rewards_user_idx` ON `user_rewards` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_rewards_status_idx` ON `user_rewards` (`status`);--> statement-breakpoint
CREATE INDEX `user_rewards_type_idx` ON `user_rewards` (`reward_type`);--> statement-breakpoint
CREATE TABLE `user_streaks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`last_check_in` text,
	`total_check_ins` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_streaks_user_id_unique` ON `user_streaks` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_streaks_user_idx` ON `user_streaks` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`wallet_address` text NOT NULL,
	`email` text,
	`display_name` text,
	`birth_date` text,
	`interests` text,
	`onboarded` integer DEFAULT false,
	`is_admin` integer DEFAULT false,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_wallet_address_unique` ON `users` (`wallet_address`);--> statement-breakpoint
CREATE INDEX `users_wallet_idx` ON `users` (`wallet_address`);
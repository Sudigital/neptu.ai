CREATE TABLE `crypto_market` (
	`id` text PRIMARY KEY NOT NULL,
	`symbol` text NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`current_price` real,
	`market_cap` real,
	`market_cap_rank` integer,
	`total_volume` real,
	`high_24h` real,
	`low_24h` real,
	`price_change_24h` real,
	`price_change_percentage_24h` real,
	`circulating_supply` real,
	`total_supply` real,
	`max_supply` real,
	`ath` real,
	`ath_change_percentage` real,
	`ath_date` text,
	`atl` real,
	`atl_change_percentage` real,
	`atl_date` text,
	`last_updated` text,
	`fetched_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `crypto_market_symbol_idx` ON `crypto_market` (`symbol`);--> statement-breakpoint
CREATE INDEX `crypto_market_rank_idx` ON `crypto_market` (`market_cap_rank`);--> statement-breakpoint
CREATE TABLE `crypto_market_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`coin_id` text NOT NULL,
	`symbol` text NOT NULL,
	`current_price` real,
	`market_cap` real,
	`market_cap_rank` integer,
	`total_volume` real,
	`price_change_24h` real,
	`price_change_percentage_24h` real,
	`recorded_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `crypto_history_coin_idx` ON `crypto_market_history` (`coin_id`);--> statement-breakpoint
CREATE INDEX `crypto_history_recorded_idx` ON `crypto_market_history` (`recorded_at`);--> statement-breakpoint
CREATE INDEX `crypto_history_symbol_idx` ON `crypto_market_history` (`symbol`);
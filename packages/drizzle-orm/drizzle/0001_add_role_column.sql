-- Migration: Replace is_admin boolean with role text column
-- Converts existing admin status: is_admin=true → role='admin', is_admin=false → role='user'

ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
UPDATE "users" SET "role" = 'admin' WHERE "is_admin" = true;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "is_admin";

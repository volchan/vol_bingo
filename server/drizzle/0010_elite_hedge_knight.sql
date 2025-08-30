ALTER TABLE "games" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
DROP TYPE "public"."game_status";--> statement-breakpoint
CREATE TYPE "public"."game_status" AS ENUM('draft', 'ready', 'playing', 'completed');--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."game_status";--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "status" SET DATA TYPE "public"."game_status" USING "status"::"public"."game_status";
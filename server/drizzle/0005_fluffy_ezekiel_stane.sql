CREATE TYPE "public"."game_status" AS ENUM('draft', 'active', 'completed');--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "status" "game_status" DEFAULT 'draft';
ALTER TABLE "games" DROP CONSTRAINT "games_winner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "player_boards" ADD COLUMN "has_bingo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "winner_id";
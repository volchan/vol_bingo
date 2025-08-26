CREATE TYPE "public"."player_board_status" AS ENUM('pending', 'ready', 'playing');--> statement-breakpoint
CREATE TABLE "player_board_cells" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"player_board_id" uuid,
	"game_cell_id" uuid,
	"position" integer NOT NULL,
	"marked" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "player_boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"player_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"status" "player_board_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_cells" ADD COLUMN "marked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "winner_id" uuid;--> statement-breakpoint
ALTER TABLE "player_board_cells" ADD CONSTRAINT "player_board_cells_player_board_id_player_boards_id_fk" FOREIGN KEY ("player_board_id") REFERENCES "public"."player_boards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_board_cells" ADD CONSTRAINT "player_board_cells_game_cell_id_game_cells_id_fk" FOREIGN KEY ("game_cell_id") REFERENCES "public"."game_cells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_board_cells" ADD CONSTRAINT "player_board_cells_player_board_id_fkey" FOREIGN KEY ("player_board_id") REFERENCES "public"."player_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_board_cells" ADD CONSTRAINT "player_board_cells_game_cell_id_fkey" FOREIGN KEY ("game_cell_id") REFERENCES "public"."game_cells"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_boards" ADD CONSTRAINT "player_boards_player_id_users_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_boards" ADD CONSTRAINT "player_boards_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_boards" ADD CONSTRAINT "player_boards_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_boards" ADD CONSTRAINT "player_boards_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "player_board_cells_playerBoardId_gameCellId_idx" ON "player_board_cells" USING btree ("player_board_id","game_cell_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_board_cells_position_idx" ON "player_board_cells" USING btree ("player_board_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "player_boards_playerId_gameId_idx" ON "player_boards" USING btree ("player_id","game_id");--> statement-breakpoint
ALTER TABLE "cells" ADD CONSTRAINT "cells_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_cells" ADD CONSTRAINT "game_cells_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_cells" ADD CONSTRAINT "game_cells_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "public"."cells"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
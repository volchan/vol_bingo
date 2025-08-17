CREATE TABLE "cells" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"value" varchar NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_cells" (
	"game_id" uuid NOT NULL,
	"cell_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cells" ADD CONSTRAINT "cells_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cells_userId_value_idx" ON "cells" USING btree ("user_id",lower("value"));--> statement-breakpoint
CREATE UNIQUE INDEX "game_cells_gameId_cellId_idx" ON "game_cells" USING btree ("game_id","cell_id");
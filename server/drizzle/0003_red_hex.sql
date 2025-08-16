ALTER TABLE "games" ADD COLUMN "friendly_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_friendlyId_unique" UNIQUE("friendly_id");

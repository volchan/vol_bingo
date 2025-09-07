ALTER TABLE "games" ADD COLUMN "display_on_stream" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stream_integration_token" varchar;--> statement-breakpoint

-- Generate unique tokens for existing users
UPDATE "users" 
SET "stream_integration_token" = substr(md5(random()::text || id::text || extract(epoch from now())), 1, 32)
WHERE "stream_integration_token" IS NULL;--> statement-breakpoint

-- Make the column NOT NULL after populating it
ALTER TABLE "users" ALTER COLUMN "stream_integration_token" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_streamIntegrationToken_unique" UNIQUE("stream_integration_token");
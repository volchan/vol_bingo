CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"login" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"type" varchar NOT NULL,
	"broadcaster_type" varchar NOT NULL,
	"description" varchar NOT NULL,
	"profile_image_url" varchar NOT NULL,
	"offline_image_url" varchar NOT NULL,
	"view_count" varchar NOT NULL,
	"twitch_id" varchar NOT NULL,
	"twitch_created_at" timestamp NOT NULL,
	CONSTRAINT "users_login_unique" UNIQUE("login"),
	CONSTRAINT "users_twitchId_unique" UNIQUE("twitch_id")
);

CREATE TABLE "template_cells" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"template_id" uuid NOT NULL,
	"cell_id" uuid NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"name" varchar NOT NULL,
	"description" varchar,
	"creator_id" uuid NOT NULL,
	CONSTRAINT "templates_name_creator_unique" UNIQUE("name","creator_id")
);
--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "current_template_id" uuid;--> statement-breakpoint
ALTER TABLE "template_cells" ADD CONSTRAINT "template_cells_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_cells" ADD CONSTRAINT "template_cells_cell_id_cells_id_fk" FOREIGN KEY ("cell_id") REFERENCES "public"."cells"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_cells" ADD CONSTRAINT "template_cells_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_cells" ADD CONSTRAINT "template_cells_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "public"."cells"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_current_template_id_templates_id_fk" FOREIGN KEY ("current_template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_current_template_id_fkey" FOREIGN KEY ("current_template_id") REFERENCES "public"."templates"("id") ON DELETE set null ON UPDATE no action;
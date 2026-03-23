CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`webhook_defaults` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clients_slug_unique` ON `clients` (`slug`);--> statement-breakpoint
CREATE TABLE `forms` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`definition` text,
	`confirmation_redirect_url` text,
	`webhooks` text,
	`embed_key` text NOT NULL,
	`style_config` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `forms_embed_key_unique` ON `forms` (`embed_key`);--> statement-breakpoint
CREATE TABLE `submission_log` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`submitted_at` integer NOT NULL,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `webhook_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`submission_log_id` text NOT NULL,
	`webhook_url` text NOT NULL,
	`response_status_code` integer,
	`success` integer DEFAULT false NOT NULL,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`delivered_at` integer,
	FOREIGN KEY (`submission_log_id`) REFERENCES `submission_log`(`id`) ON UPDATE no action ON DELETE no action
);

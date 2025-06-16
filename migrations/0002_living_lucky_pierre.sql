PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`competition_id` text NOT NULL,
	`category_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`date_taken` integer,
	`location` text NOT NULL,
	`file_path` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer NOT NULL,
	`mime_type` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`camera_make` text,
	`camera_model` text,
	`lens` text,
	`focal_length` text,
	`aperture` text,
	`shutter_speed` text,
	`iso` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`moderated_by` text,
	`moderated_at` integer,
	`rejection_reason` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`competition_id`) REFERENCES `competitions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`moderated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_photos`("id", "user_id", "competition_id", "category_id", "title", "description", "date_taken", "location", "file_path", "file_name", "file_size", "mime_type", "width", "height", "camera_make", "camera_model", "lens", "focal_length", "aperture", "shutter_speed", "iso", "status", "moderated_by", "moderated_at", "rejection_reason", "created_at", "updated_at") SELECT "id", "user_id", "competition_id", "category_id", "title", "description", "date_taken", "location", "file_path", "file_name", "file_size", "mime_type", "width", "height", "camera_make", "camera_model", "lens", "focal_length", "aperture", "shutter_speed", "iso", "status", "moderated_by", "moderated_at", "rejection_reason", "created_at", "updated_at" FROM `photos`;--> statement-breakpoint
DROP TABLE `photos`;--> statement-breakpoint
ALTER TABLE `__new_photos` RENAME TO `photos`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_photos_user_id` ON `photos` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_photos_competition_id` ON `photos` (`competition_id`);--> statement-breakpoint
CREATE INDEX `idx_photos_category_id` ON `photos` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_photos_status` ON `photos` (`status`);--> statement-breakpoint
CREATE INDEX `idx_photos_created_at` ON `photos` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_photo_submission` ON `photos` (`user_id`,`competition_id`,`category_id`,`title`);
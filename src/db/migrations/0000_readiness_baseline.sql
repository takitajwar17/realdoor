CREATE TABLE IF NOT EXISTS `user` (
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`updateCounter` integer DEFAULT 0,
	`id` text PRIMARY KEY NOT NULL,
	`firstName` text(255),
	`lastName` text(255),
	`email` text(255),
	`passwordHash` text,
	`role` text DEFAULT 'user' NOT NULL,
	`emailVerified` integer,
	`signUpIpAddress` text(100),
	`googleAccountId` text(255),
	`avatar` text(600)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `email_idx` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `google_account_id_idx` ON `user` (`googleAccountId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `role_idx` ON `user` (`role`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `readiness_audit` (
	`createdAt` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`sessionId` text NOT NULL,
	`action` text NOT NULL,
	`subjectType` text NOT NULL,
	`subjectId` text,
	FOREIGN KEY (`sessionId`) REFERENCES `readiness_session`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `readiness_audit_session_idx` ON `readiness_audit` (`sessionId`,`createdAt`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `readiness_document` (
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`updateCounter` integer DEFAULT 0,
	`id` text PRIMARY KEY NOT NULL,
	`sessionId` text NOT NULL,
	`r2Key` text NOT NULL,
	`mimeType` text NOT NULL,
	`sizeBytes` integer NOT NULL,
	`sha256` text NOT NULL,
	`kind` text DEFAULT 'other' NOT NULL,
	`extractionStatus` text DEFAULT 'uploaded' NOT NULL,
	`metadataConfirmed` integer DEFAULT false NOT NULL,
	`included` integer DEFAULT true NOT NULL,
	`encryptedPayload` text NOT NULL,
	`processedAt` integer,
	FOREIGN KEY (`sessionId`) REFERENCES `readiness_session`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `readiness_document_session_idx` ON `readiness_document` (`sessionId`,`createdAt`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `readiness_document_r2_key_idx` ON `readiness_document` (`r2Key`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `readiness_document_status_idx` ON `readiness_document` (`sessionId`,`extractionStatus`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `readiness_fact` (
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`updateCounter` integer DEFAULT 0,
	`id` text PRIMARY KEY NOT NULL,
	`sessionId` text NOT NULL,
	`documentId` text,
	`key` text NOT NULL,
	`status` text DEFAULT 'extracted' NOT NULL,
	`confidence` integer,
	`encryptedPayload` text NOT NULL,
	`confirmedAt` integer,
	`rejectedAt` integer,
	FOREIGN KEY (`sessionId`) REFERENCES `readiness_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`documentId`) REFERENCES `readiness_document`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `readiness_fact_session_key_idx` ON `readiness_fact` (`sessionId`,`key`,`status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `readiness_fact_document_idx` ON `readiness_fact` (`documentId`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `readiness_question` (
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`updateCounter` integer DEFAULT 0,
	`id` text PRIMARY KEY NOT NULL,
	`sessionId` text NOT NULL,
	`sourceIds` text NOT NULL,
	`encryptedPayload` text NOT NULL,
	FOREIGN KEY (`sessionId`) REFERENCES `readiness_session`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `readiness_question_session_idx` ON `readiness_question` (`sessionId`,`createdAt`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `readiness_session` (
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`updateCounter` integer DEFAULT 0,
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`encryptedName` text,
	`consentVersion` text NOT NULL,
	`consentedAt` integer NOT NULL,
	`targetYear` integer DEFAULT 2026 NOT NULL,
	`metro` text NOT NULL,
	`program` text NOT NULL,
	`rulePackId` text NOT NULL,
	`ruleAuthority` text NOT NULL,
	`ruleEffectiveDate` text NOT NULL,
	`asOfDate` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`lastAccessedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `readiness_session_user_updated_idx` ON `readiness_session` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `readiness_session_user_accessed_idx` ON `readiness_session` (`userId`,`lastAccessedAt`);

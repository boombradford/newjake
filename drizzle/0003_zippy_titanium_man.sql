CREATE TABLE `sentimentAggregates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analysisId` int NOT NULL,
	`competitorId` int NOT NULL,
	`platform` enum('twitter','facebook','instagram','linkedin','youtube','tiktok','all') NOT NULL,
	`totalPosts` int DEFAULT 0,
	`positiveCount` int DEFAULT 0,
	`negativeCount` int DEFAULT 0,
	`neutralCount` int DEFAULT 0,
	`mixedCount` int DEFAULT 0,
	`avgSentimentScore` decimal(4,3),
	`sentimentTrend` enum('improving','declining','stable'),
	`joyPercent` int,
	`angerPercent` int,
	`sadnessPercent` int,
	`fearPercent` int,
	`surprisePercent` int,
	`positiveTopics` json,
	`negativeTopics` json,
	`periodStart` timestamp,
	`periodEnd` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sentimentAggregates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `socialMediaPosts` ADD `sentiment` enum('positive','negative','neutral','mixed');--> statement-breakpoint
ALTER TABLE `socialMediaPosts` ADD `sentimentScore` decimal(4,3);--> statement-breakpoint
ALTER TABLE `socialMediaPosts` ADD `sentimentConfidence` decimal(4,3);--> statement-breakpoint
ALTER TABLE `socialMediaPosts` ADD `emotionalTone` json;
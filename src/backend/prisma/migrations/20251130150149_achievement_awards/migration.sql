-- AlterTable
ALTER TABLE "Achievement" ADD COLUMN "award" INTEGER DEFAULT 0;

/**
 * Add awards to existing achievements.
 *
 * @todo: remove after beta
 */
UPDATE "Achievement" SET "award" = 100000 WHERE "id" = 'FLAWLESS';
UPDATE "Achievement" SET "award" = 10000 WHERE "id" = 'KENSHI';
UPDATE "Achievement" SET "award" = 250000 WHERE "id" = 'KING_OF_THE_WORLD';
UPDATE "Achievement" SET "award" = 2000 WHERE "id" = 'LET_IT_GO';
UPDATE "Achievement" SET "award" = 100000 WHERE "id" = 'MARK_IN_HISTORY';
UPDATE "Achievement" SET "award" = 250000 WHERE "id" = 'MOUNT_EVEREST';
UPDATE "Achievement" SET "award" = 250000 WHERE "id" = 'POKER';
UPDATE "Achievement" SET "award" = 25000 WHERE "id" = 'SMOOTH_OPERATOR';
UPDATE "Achievement" SET "award" = 500000 WHERE "id" = 'UNDERDOG';

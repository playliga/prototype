-- AlterTable
ALTER TABLE "Team" ADD COLUMN "elo" INTEGER DEFAULT 1000;

/**
 * Improves sorting performance of elo rankings
 *
 * @todo: remove after beta
 */
CREATE INDEX IF NOT EXISTS "Team_elo_id_idx" ON "Team" ("elo", "id");

/**
 * Updates the elo existing teams.
 *
 * @todo: remove after beta
 */
UPDATE "Team" SET elo = 1000 WHERE tier = 0;
UPDATE "Team" SET elo = 1250 WHERE tier = 1;
UPDATE "Team" SET elo = 1500 WHERE tier = 2;
UPDATE "Team" SET elo = 1750 WHERE tier = 3;
UPDATE "Team" SET elo = 2000 WHERE tier = 4;

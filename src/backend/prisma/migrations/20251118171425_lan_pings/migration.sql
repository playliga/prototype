-- AlterTable
ALTER TABLE "Tier" ADD COLUMN "lan" BOOLEAN DEFAULT false;

/**
 * Mark existing tiers as being on lan.
 *
 * @todo: remove after beta.
 */
UPDATE "Tier"
SET "lan" = true
WHERE "slug" IN (
  'league:open:playoffs',
  'league:intermediate:playoffs',
  'league:main:playoffs',
  'league:advanced:playoffs',
  'league:premier:playoffs',
  'eswc:challengers',
  'eswc:legends',
  'eswc:champions',
  'eswc:playoffs'
);

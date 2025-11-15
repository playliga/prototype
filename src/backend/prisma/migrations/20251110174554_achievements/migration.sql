-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unlocked" BOOLEAN DEFAULT false
);

/**
 * Adds achievements.
 *
 * Leverages `UNION ALL` to create virtual
 * tables to insert data dynamically.
 *
 * @todo: remove after beta
 */
INSERT OR IGNORE INTO "Achievement" ("id")
SELECT data.id
FROM (
  SELECT 'FLAWLESS' as id
  UNION ALL
  SELECT 'KENSHI'
  UNION ALL
  SELECT 'KING_OF_THE_WORLD'
  UNION ALL
  SELECT 'LET_IT_GO'
  UNION ALL
  SELECT 'MARK_IN_HISTORY'
  UNION ALL
  SELECT 'MOUNT_EVEREST'
  UNION ALL
  SELECT 'POKER'
  UNION ALL
  SELECT 'SMOOTH_OPERATOR'
  UNION ALL
  SELECT 'UNDERDOG'
) as data;

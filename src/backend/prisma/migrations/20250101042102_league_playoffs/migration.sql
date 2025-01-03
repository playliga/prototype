/**
 * Adds league playoffs to existing databases.
 *
 * Leverages `UNION ALL` to create virtual
 * tables to insert data dynamically.
 *
 * @todo: remove after beta when db is reset
 */
INSERT OR IGNORE INTO "Tier" (
  "name",
  "slug",
  "size",
  "triggerOffsetDays",
  "leagueId"
) SELECT
  data.name,
  data.slug,
  4,
  7,
  (SELECT id FROM "League" WHERE slug = "esl") AS leagueId
FROM (
  SELECT 'League Open Playoffs' AS name, 'league:open:playoffs' AS slug
  UNION ALL
  SELECT 'League Intermediate Playoffs', 'league:intermediate:playoffs'
  UNION ALL
  SELECT 'League Main Playoffs', 'league:main:playoffs'
  UNION ALL
  SELECT 'League Advanced Playoffs', 'league:advanced:playoffs'
  UNION ALL
  SELECT 'League Premier Playoffs', 'league:premier:playoffs'
) AS data;

UPDATE "Tier" SET
  triggerTierSlug = (
    SELECT data.triggerTierSlug
    FROM (
      SELECT 'league:open:playoffs' AS triggerTierSlug, 'league:open' AS slug
      UNION ALL
      SELECT 'league:intermediate:playoffs', 'league:intermediate'
      UNION ALL
      SELECT 'league:main:playoffs', 'league:main'
      UNION ALL
      SELECT 'league:advanced:playoffs', 'league:advanced'
      UNION ALL
      SELECT 'league:premier:playoffs', 'league:premier'
    ) AS data
    WHERE data.slug = "Tier".slug
  )
WHERE slug IN (
  'league:open',
  'league:intermediate',
  'league:main',
  'league:advanced',
  'league:premier'
);

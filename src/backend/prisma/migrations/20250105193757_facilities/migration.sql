/**
 * Adds facilities that can be purchased
 * as training bonuses.
 *
 * Leverages `UNION ALL` to create virtual
 * tables to insert data dynamically.
 *
 * @todo: remove after beta
 */
INSERT OR IGNORE INTO "Bonus" (
  "type",
  "name",
  "stats",
  "cost"
) SELECT
  2,
  data.name,
  data.stats,
  data.cost
FROM (
  SELECT
    'Small Training Facility' AS name,
    '{"skill":1,"aggression":1,"reactionTime":1,"attackDelay":1}' AS stats,
    250000 AS cost
  UNION ALL
  SELECT
    'Esports Arena',
    '{"skill":4,"aggression":4,"reactionTime":4,"attackDelay":4}',
    750000
) AS data;

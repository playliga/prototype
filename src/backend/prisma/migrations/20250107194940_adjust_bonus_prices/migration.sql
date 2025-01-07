/**
 * Adjusts training bonus prices.
 *
 * @todo: remove after beta
 */
UPDATE "Bonus" SET
  cost = (
    SELECT data.cost
    FROM (
      SELECT 12000 AS cost, 'Private 1' AS name
      UNION ALL
      SELECT 12000, 'Private 2'
      UNION ALL
      SELECT 24000, 'Premium 1'
      UNION ALL
      SELECT 24000, 'Premium 2'
    ) as data
    WHERE data.name = "Bonus".name
  )
WHERE name IN (
  'Private 1',
  'Private 2',
  'Premium 1',
  'Premium 2'
);

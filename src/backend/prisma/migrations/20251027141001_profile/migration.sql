/**
 * Adds default profile to root save.
 *
 * @todo: remove after beta
 */
INSERT OR IGNORE INTO "Profile" (
  "name",
  "date",
  "settings"
)
SELECT
  "Default",
  1817352000000,
  '{"general":{"game":"csgo","logLevel":"debug","simulationMode":"default","steamPath":null,"gamePath":null,"botChatter":"radio","gameLaunchOptions":null,"theme":"system","botDifficulty":null,"locale":null},"calendar":{"ignoreExits":false,"maxIterations":"8","unit":"days"},"matchRules":{"freezeTime":7,"mapOverride":null,"maxRounds":6,"overtime":true,"startMoney":10000}}'
WHERE NOT EXISTS(
  SELECT 1 FROM "Profile"
);

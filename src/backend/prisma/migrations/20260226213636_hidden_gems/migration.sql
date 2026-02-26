/**
 * Adds some hidden gem free agents with `Main`
 * division stats and a high potential.
 *
 * Leverages `UNION ALL` to create virtual
 * tables to insert data dynamically.
 *
 * @todo: remove after beta
 */
PRAGMA foreign_keys = OFF;

INSERT OR IGNORE INTO
  "Player" (
    "name",
    "stats",
    "cost",
    "wages",
    "countryId",
    "weapon",
    "avatar",
    "prestige",
    "dob"
  )
SELECT
  data.name,
  data.stats,
  data.cost,
  data.wages,
  data.countryId,
  data.weapon,
  data.avatar,
  data.prestige,
  data.dob
FROM
  (
    SELECT
      'Crash' AS name,
      '{"skill": 75,"aggression": 75,"reactionTime": 0.25,"attackDelay": 0}' as stats,
      0 AS cost,
      0 AS wages,
      233 AS countryId,
      'Rifle' AS weapon,
      'resources://avatars/crash.png' AS avatar,
      3 AS prestige,
      1084579200000 AS dob
    UNION ALL
    SELECT
      'Phobos',
      '{"skill": 77,"aggression": 77,"reactionTime": 0.25,"attackDelay": 0}',
      0,
      0,
      38,
      'Rifle',
      'resources://avatars/phobos.png',
      3,
      1014758621000
    UNION ALL
    SELECT
      'Ranger',
      '{"skill": 75,"aggression": 75,"reactionTime": 0.25,"attackDelay": 0}',
      0,
      0,
      77,
      'Rifle',
      'resources://avatars/ranger.png',
      3,
      1014758621000
    UNION ALL
    SELECT
      'Sarge',
      '{"skill": 77,"aggression": 77,"reactionTime": 0.25,"attackDelay": 0}',
      0,
      0,
      197,
      'Rifle',
      'resources://avatars/sarge.png',
      3,
      1084579200000
  ) AS data;

PRAGMA foreign_key_check;

PRAGMA foreign_keys = ON;

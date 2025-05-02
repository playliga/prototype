/**
 * Adds sponsor tournaments.
 *
 * Leverages `UNION ALL` to create virtual
 * tables to insert data dynamically.
 *
 * @todo: remove after beta
 */

/** create the league record */
INSERT OR IGNORE INTO "League" (
  "name",
  "slug",
  "startOffsetDays"
) VALUES (
  "Sponsor Tournaments",
  "sponsors",
  180
);

/** tie the league to its federation */
INSERT OR IGNORE INTO "_FederationToLeague" (
  "A",
  "B"
) SELECT
  federation.id,
  league.id
FROM
  Federation AS federation,
  League AS league
WHERE
  federation.slug = 'world'
  AND league.slug = 'sponsors';

/** add the tiers */
INSERT OR IGNORE INTO "Tier" (
  "name",
  "slug",
  "size",
  "triggerOffsetDays",
  "triggerTierSlug",
  "leagueId"
) SELECT
  data.name,
  data.slug,
  data.size,
  data.triggerOffsetDays,
  data.triggerTierSlug,
  (SELECT id FROM League WHERE slug = 'sponsors') as leagueId
FROM (
  SELECT
    'BlueQuil Invitational' as name,
    'sponsors:bluequil' as slug,
    8 as size,
    NULL as triggerOffsetDays,
    'sponsors:heavencase' as triggerTierSlug
  UNION ALL
  SELECT
    'HeavenCase Challenge',
    'sponsors:heavencase',
    8,
    1,
    'sponsors:9kbet'
  UNION ALL
  SELECT
    '9kBet Cup',
    'sponsors:9kbet',
    8,
    1,
    'sponsors:skinarch'
  UNION ALL
  SELECT
    'SkinArch Showdown',
    'sponsors:skinarch',
    8,
    1,
    'sponsors:white-wolf'
  UNION ALL
  SELECT
    'WhiteWolf Invitational',
    'sponsors:white-wolf',
    8,
    1,
    NULL
) as data;

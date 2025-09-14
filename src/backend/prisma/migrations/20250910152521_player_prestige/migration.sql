/**
 * Syncs player's prestige to their current team's tier.
 */
ALTER TABLE Player ADD COLUMN prestige INTEGER;

UPDATE Player
SET prestige =
  COALESCE(
    (SELECT tier FROM Team WHERE Team.id = Player.teamId),
    0
  );

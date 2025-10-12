/**
 * Fixes a defect where cache was added to the cs2 map pool.
 *
 * @todo: remove after beta
 */

DELETE FROM MapPool
WHERE
  gameMapId = (
    SELECT id
    FROM GameMap
    WHERE name = "de_cache"
  )
  AND gameVersionId = (
    SELECT id
    FROM GameVersion
    WHERE slug = "cs2"
  );

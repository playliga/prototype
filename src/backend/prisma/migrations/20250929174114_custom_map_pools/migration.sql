-- CreateTable
CREATE TABLE "GameMap" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "GameVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "MapPool" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "position" INTEGER,
    "gameMapId" INTEGER NOT NULL,
    "gameVersionId" INTEGER NOT NULL,
    CONSTRAINT "MapPool_gameMapId_fkey" FOREIGN KEY ("gameMapId") REFERENCES "GameMap" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapPool_gameVersionId_fkey" FOREIGN KEY ("gameVersionId") REFERENCES "GameVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GameMap_name_key" ON "GameMap"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GameVersion_slug_key" ON "GameVersion"("slug");

/**
 * Adds seed data to existing databases.
 *
 * @todo: remove after beta
 */
INSERT OR IGNORE INTO "GameMap" (
  "name"
) SELECT
  data.name
FROM (
  SELECT 'de_ancient' AS name
  UNION ALL
  SELECT 'de_anubis'
  UNION ALL
  SELECT 'de_cache'
  UNION ALL
  SELECT 'de_cbble'
  UNION ALL
  SELECT 'de_cbble_cz'
  UNION ALL
  SELECT 'de_cpl_fire'
  UNION ALL
  SELECT 'de_cpl_mill'
  UNION ALL
  SELECT 'de_cpl_strike'
  UNION ALL
  SELECT 'de_czl_freight'
  UNION ALL
  SELECT 'de_czl_karnak'
  UNION ALL
  SELECT 'de_czl_silo'
  UNION ALL
  SELECT 'de_dust2'
  UNION ALL
  SELECT 'de_dust2_cz'
  UNION ALL
  SELECT 'de_inferno'
  UNION ALL
  SELECT 'de_inferno_cz'
  UNION ALL
  SELECT 'de_mirage'
  UNION ALL
  SELECT 'de_nuke'
  UNION ALL
  SELECT 'de_overpass'
  UNION ALL
  SELECT 'de_russka'
  UNION ALL
  SELECT 'de_russka_cz'
  UNION ALL
  SELECT 'de_train'
  UNION ALL
  SELECT 'de_tuscan'
  UNION ALL
  SELECT 'de_vertigo'
) AS data;

INSERT OR IGNORE INTO "GameVersion" (
  "slug"
) SELECT
  data.slug
FROM (
  SELECT 'cs16' AS slug
  UNION ALL
  SELECT 'cs2'
  UNION ALL
  SELECT 'csgo'
  UNION ALL
  SELECT 'cssource'
  UNION ALL
  SELECT 'czero'
) AS data;

INSERT OR IGNORE INTO "MapPool" (
  "gameMapId",
  "gameVersionId",
  "position"
) SELECT
  (SELECT id FROM "GameMap" WHERE name = data.name) as gameMapId,
  (SELECT id FROM "GameVersion" WHERE slug = data.slug) AS gameVersionId,
  data.position
FROM (
  SELECT 'de_cpl_mill' AS name, 'cs16' AS slug, 0 AS position
  UNION ALL
  SELECT 'de_dust2', 'cs16', 1
  UNION ALL
  SELECT 'de_inferno', 'cs16', 2
  UNION ALL
  SELECT 'de_cpl_strike', 'cs16', 3
  UNION ALL
  SELECT 'de_nuke', 'cs16', 4
  UNION ALL
  SELECT 'de_train', 'cs16', 5
  UNION ALL
  SELECT 'de_cbble', 'cs16', 6
  UNION ALL
  SELECT 'de_cache', 'cs16', NULL
  UNION ALL
  SELECT 'de_cpl_fire', 'cs16', NULL
  UNION ALL
  SELECT 'de_overpass', 'cs16', NULL
  UNION ALL
  SELECT 'de_tuscan', 'cs16', NULL
  UNION ALL
  SELECT 'de_vertigo', 'cs16', NULL
  UNION ALL
  SELECT 'de_russka', 'cs16', NULL

  UNION ALL
  SELECT 'de_ancient', 'cs2', 0
  UNION ALL
  SELECT 'de_dust2', 'cs2', 1
  UNION ALL
  SELECT 'de_inferno', 'cs2', 2
  UNION ALL
  SELECT 'de_mirage', 'cs2', 3
  UNION ALL
  SELECT 'de_nuke', 'cs2', 4
  UNION ALL
  SELECT 'de_overpass', 'cs2', 5
  UNION ALL
  SELECT 'de_train', 'cs2', 6
  UNION ALL
  SELECT 'de_cache', 'cs2', NULL
  UNION ALL
  SELECT 'de_vertigo', 'cs2', NULL

  UNION ALL
  SELECT 'de_ancient', 'csgo', 0
  UNION ALL
  SELECT 'de_dust2', 'csgo', 1
  UNION ALL
  SELECT 'de_inferno', 'csgo', 2
  UNION ALL
  SELECT 'de_mirage', 'csgo', 3
  UNION ALL
  SELECT 'de_nuke', 'csgo', 4
  UNION ALL
  SELECT 'de_overpass', 'csgo', 5
  UNION ALL
  SELECT 'de_anubis', 'csgo', 6
  UNION ALL
  SELECT 'de_cache', 'csgo', NULL
  UNION ALL
  SELECT 'de_train', 'csgo', NULL

  UNION ALL
  SELECT 'de_cbble', 'cssource', 0
  UNION ALL
  SELECT 'de_cpl_strike', 'cssource', 1
  UNION ALL
  SELECT 'de_dust2', 'cssource', 2
  UNION ALL
  SELECT 'de_inferno', 'cssource', 3
  UNION ALL
  SELECT 'de_nuke', 'cssource', 4
  UNION ALL
  SELECT 'de_russka', 'cssource', 5
  UNION ALL
  SELECT 'de_train', 'cssource', 6

  UNION ALL
  SELECT 'de_cbble_cz', 'czero', 0
  UNION ALL
  SELECT 'de_czl_freight', 'czero', 1
  UNION ALL
  SELECT 'de_czl_karnak', 'czero', 2
  UNION ALL
  SELECT 'de_czl_silo', 'czero', 3
  UNION ALL
  SELECT 'de_dust2_cz', 'czero', 4
  UNION ALL
  SELECT 'de_inferno_cz', 'czero', 5
  UNION ALL
  SELECT 'de_russka_cz', 'czero', 6
) AS data;

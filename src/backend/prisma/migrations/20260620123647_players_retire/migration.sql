-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "gains" TEXT,
    "stats" TEXT,
    "cost" INTEGER DEFAULT 0,
    "wages" INTEGER DEFAULT 0,
    "wagesDue" INTEGER DEFAULT 0,
    "weapon" TEXT,
    "starter" BOOLEAN NOT NULL DEFAULT false,
    "transferListed" BOOLEAN NOT NULL DEFAULT false,
    "avatar" TEXT,
    "prestige" INTEGER,
    "dob" DATETIME,
    "retired" BOOLEAN NOT NULL DEFAULT false,
    "countryId" INTEGER NOT NULL,
    "teamId" INTEGER,
    CONSTRAINT "Player_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("avatar", "cost", "countryId", "dob", "gains", "id", "name", "prestige", "retired", "starter", "stats", "teamId", "transferListed", "wages", "wagesDue", "weapon") SELECT "avatar", "cost", "countryId", "dob", "gains", "id", "name", "prestige", coalesce("retired", false) AS "retired", "starter", "stats", "teamId", "transferListed", "wages", "wagesDue", "weapon" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

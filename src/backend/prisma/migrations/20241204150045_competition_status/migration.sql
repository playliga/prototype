/*
  Warnings:

  - You are about to drop the column `started` on the `Competition` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Competition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "season" INTEGER DEFAULT 1,
    "status" INTEGER DEFAULT 0,
    "tournament" TEXT,
    "federationId" INTEGER NOT NULL,
    "tierId" INTEGER NOT NULL,
    CONSTRAINT "Competition_federationId_fkey" FOREIGN KEY ("federationId") REFERENCES "Federation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Competition_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Competition" ("federationId", "id", "season", "tierId", "tournament") SELECT "federationId", "id", "season", "tierId", "tournament" FROM "Competition";
DROP TABLE "Competition";
ALTER TABLE "new_Competition" RENAME TO "Competition";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

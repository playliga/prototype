-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MatchEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "half" INTEGER NOT NULL,
    "headshot" BOOLEAN NOT NULL DEFAULT false,
    "payload" TEXT NOT NULL,
    "result" TEXT,
    "timestamp" DATETIME NOT NULL,
    "weapon" TEXT,
    "matchId" INTEGER NOT NULL,
    "attackerId" INTEGER,
    "assistId" INTEGER,
    "victimId" INTEGER,
    "winnerId" INTEGER,
    CONSTRAINT "MatchEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MatchEvent_attackerId_fkey" FOREIGN KEY ("attackerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MatchEvent_assistId_fkey" FOREIGN KEY ("assistId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MatchEvent_victimId_fkey" FOREIGN KEY ("victimId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MatchEvent_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "MatchToTeam" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MatchEvent" ("attackerId", "half", "id", "matchId", "payload", "result", "timestamp", "victimId", "weapon", "winnerId") SELECT "attackerId", "half", "id", "matchId", "payload", "result", "timestamp", "victimId", "weapon", "winnerId" FROM "MatchEvent";
DROP TABLE "MatchEvent";
ALTER TABLE "new_MatchEvent" RENAME TO "MatchEvent";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

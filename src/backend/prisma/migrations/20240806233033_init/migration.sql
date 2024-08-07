-- CreateTable
CREATE TABLE "Autofill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "on" TEXT NOT NULL,
    "federationId" INTEGER NOT NULL,
    "tierId" INTEGER NOT NULL,
    CONSTRAINT "Autofill_federationId_fkey" FOREIGN KEY ("federationId") REFERENCES "Federation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Autofill_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutofillEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "action" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "federationSlug" TEXT,
    "start" INTEGER DEFAULT 0,
    "end" INTEGER,
    "season" INTEGER DEFAULT 0,
    "autofillId" INTEGER NOT NULL,
    CONSTRAINT "AutofillEntry_autofillId_fkey" FOREIGN KEY ("autofillId") REFERENCES "Autofill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bonus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "stats" TEXT,
    "cost" INTEGER,
    "profileId" INTEGER,
    CONSTRAINT "Bonus_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Calendar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "completed" BOOLEAN DEFAULT false,
    "payload" TEXT
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "season" INTEGER DEFAULT 1,
    "started" BOOLEAN DEFAULT false,
    "tournament" TEXT,
    "federationId" INTEGER NOT NULL,
    "tierId" INTEGER NOT NULL,
    CONSTRAINT "Competition_federationId_fkey" FOREIGN KEY ("federationId") REFERENCES "Federation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Competition_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompetitionToTeam" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "position" INTEGER DEFAULT 1,
    "win" INTEGER DEFAULT 0,
    "loss" INTEGER DEFAULT 0,
    "draw" INTEGER DEFAULT 0,
    "group" INTEGER,
    "seed" INTEGER,
    "competitionId" INTEGER NOT NULL,
    "teamId" INTEGER,
    CONSTRAINT "CompetitionToTeam_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CompetitionToTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Continent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "federationId" INTEGER NOT NULL,
    CONSTRAINT "Continent_federationId_fkey" FOREIGN KEY ("federationId") REFERENCES "Federation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Country" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "continentId" INTEGER NOT NULL,
    CONSTRAINT "Country_continentId_fkey" FOREIGN KEY ("continentId") REFERENCES "Continent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dialogue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "completed" BOOLEAN DEFAULT false,
    "content" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL,
    "emailId" INTEGER NOT NULL,
    "fromId" INTEGER NOT NULL,
    CONSTRAINT "Dialogue_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Dialogue_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Email" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "read" BOOLEAN DEFAULT false,
    "sentAt" DATETIME NOT NULL,
    "subject" TEXT NOT NULL,
    "fromId" INTEGER NOT NULL,
    CONSTRAINT "Email_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Federation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "map" TEXT NOT NULL,
    "num" INTEGER NOT NULL,
    "status" INTEGER NOT NULL,
    "matchId" INTEGER NOT NULL,
    CONSTRAINT "Game_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameToTeam" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "result" INTEGER,
    "score" INTEGER,
    "seed" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "teamId" INTEGER,
    CONSTRAINT "GameToTeam_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GameToTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "League" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "startOffsetDays" INTEGER DEFAULT 1
);

-- CreateTable
CREATE TABLE "Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "payload" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "status" INTEGER NOT NULL,
    "competitionId" INTEGER NOT NULL,
    CONSTRAINT "Match_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchToTeam" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "result" INTEGER,
    "score" INTEGER,
    "seed" INTEGER NOT NULL,
    "matchId" INTEGER NOT NULL,
    "teamId" INTEGER,
    CONSTRAINT "MatchToTeam_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MatchToTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "teamId" INTEGER,
    CONSTRAINT "Persona_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "gains" TEXT,
    "stats" TEXT,
    "cost" INTEGER DEFAULT 0,
    "wages" INTEGER DEFAULT 0,
    "starter" BOOLEAN NOT NULL DEFAULT false,
    "transferListed" BOOLEAN NOT NULL DEFAULT false,
    "countryId" INTEGER NOT NULL,
    "teamId" INTEGER,
    CONSTRAINT "Player_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "earnings" INTEGER DEFAULT 0,
    "season" INTEGER DEFAULT 0,
    "settings" TEXT,
    "trainedAt" DATETIME,
    "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "teamId" INTEGER,
    "playerId" INTEGER,
    CONSTRAINT "Profile_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Profile_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "prestige" INTEGER,
    "blazon" TEXT,
    "tier" INTEGER,
    "countryId" INTEGER NOT NULL,
    CONSTRAINT "Team_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tier" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "groupSize" INTEGER,
    "triggerTierSlug" TEXT,
    "triggerOffsetDays" INTEGER,
    "leagueId" INTEGER NOT NULL,
    CONSTRAINT "Tier_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" INTEGER NOT NULL,
    "teamIdFrom" INTEGER NOT NULL,
    "teamIdTo" INTEGER,
    "playerId" INTEGER NOT NULL,
    CONSTRAINT "Transfer_teamIdFrom_fkey" FOREIGN KEY ("teamIdFrom") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_teamIdTo_fkey" FOREIGN KEY ("teamIdTo") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transfer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" INTEGER NOT NULL,
    "cost" INTEGER DEFAULT 0,
    "wages" INTEGER DEFAULT 0,
    "transferId" INTEGER NOT NULL,
    CONSTRAINT "Offer_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_FederationToLeague" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_FederationToLeague_A_fkey" FOREIGN KEY ("A") REFERENCES "Federation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FederationToLeague_B_fkey" FOREIGN KEY ("B") REFERENCES "League" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Autofill_on_federationId_tierId_key" ON "Autofill"("on", "federationId", "tierId");

-- CreateIndex
CREATE UNIQUE INDEX "Bonus_name_key" ON "Bonus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Calendar_date_type_payload_key" ON "Calendar"("date", "type", "payload");

-- CreateIndex
CREATE UNIQUE INDEX "Continent_name_key" ON "Continent"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Continent_code_key" ON "Continent"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Email_subject_key" ON "Email"("subject");

-- CreateIndex
CREATE UNIQUE INDEX "Federation_name_key" ON "Federation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Federation_slug_key" ON "Federation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "League_slug_key" ON "League"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Persona_name_key" ON "Persona"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_name_key" ON "Profile"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_teamId_key" ON "Profile"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_playerId_key" ON "Profile"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tier_name_key" ON "Tier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tier_slug_key" ON "Tier"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "_FederationToLeague_AB_unique" ON "_FederationToLeague"("A", "B");

-- CreateIndex
CREATE INDEX "_FederationToLeague_B_index" ON "_FederationToLeague"("B");

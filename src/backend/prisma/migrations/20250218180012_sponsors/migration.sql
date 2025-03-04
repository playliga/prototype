-- CreateTable
CREATE TABLE "Sponsor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logo" TEXT
);

-- CreateTable
CREATE TABLE "Sponsorship" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "sponsorId" INTEGER NOT NULL,
    CONSTRAINT "Sponsorship_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sponsorship_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SponsorshipOffer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" INTEGER NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "amount" INTEGER DEFAULT 0,
    "frequency" INTEGER DEFAULT 0,
    "sponsorshipId" INTEGER NOT NULL,
    CONSTRAINT "SponsorshipOffer_sponsorshipId_fkey" FOREIGN KEY ("sponsorshipId") REFERENCES "Sponsorship" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_SponsorToTeam" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_SponsorToTeam_A_fkey" FOREIGN KEY ("A") REFERENCES "Sponsor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SponsorToTeam_B_fkey" FOREIGN KEY ("B") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Sponsor_name_key" ON "Sponsor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Sponsor_slug_key" ON "Sponsor"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "_SponsorToTeam_AB_unique" ON "_SponsorToTeam"("A", "B");

-- CreateIndex
CREATE INDEX "_SponsorToTeam_B_index" ON "_SponsorToTeam"("B");

/**
 * Seed existing databases.
 *
 * Leverages `UNION ALL` to create virtual
 * tables to insert data dynamically.
 *
 * @todo: remove after beta
 */
INSERT OR IGNORE INTO "Sponsor" (
  "name",
  "slug",
  "description",
  "logo"
) SELECT
  data.name,
  data.slug,
  data.description,
  'resources://sponsors/' || data.slug || '.svg'
FROM (
  SELECT
    'Aloha Energy' AS name,
    'aloha-energy' AS slug,
    'Energy drink company.' AS description
  UNION ALL
  SELECT
    'BlueQuil',
    'bluequil',
    'Energy drink company.' AS description
  UNION ALL
  SELECT
    'GogTech',
    'gogtech',
    'Premier gaming gear supplier.' AS description
  UNION ALL
  SELECT
    'HeavenCase',
    'heavencase',
    'Esports case website.' AS description
  UNION ALL
  SELECT
    '9kBet',
    '9kbet',
    'Esports betting website.' AS description
  UNION ALL
  SELECT
    'OwnerCard',
    'ownercard',
    'Payment company.' AS description
  UNION ALL
  SELECT
    'Prey',
    'prey',
    'Monitor, computer, and GPU producers.' AS description
  UNION ALL
  SELECT
    'SkinArch',
    'skinarch',
    'CS skins website.' AS description
  UNION ALL
  SELECT
    'White Wolf',
    'white-wolf',
    'Energy drink company.' AS description
  UNION ALL
  SELECT
    'Ynfo',
    'ynfo',
    'CPU processor brand.' AS description
  UNION ALL
  SELECT
    'YTL',
    'ytl',
    'Delivery company.' AS description
) AS data;

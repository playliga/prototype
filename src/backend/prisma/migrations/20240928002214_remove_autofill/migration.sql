/*
  Warnings:

  - You are about to drop the `Autofill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AutofillEntry` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Autofill";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AutofillEntry";
PRAGMA foreign_keys=on;

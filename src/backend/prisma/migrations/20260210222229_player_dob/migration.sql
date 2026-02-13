-- AlterTable
ALTER TABLE "Player"
ADD COLUMN "dob" DATETIME;

/**
 * Set a random dob for each player.
 *
 * @todo: remove after beta
 */
UPDATE "Player"
SET
  "dob" = (
    strftime(
      '%s',
      date(
        '2001-01-01',
        '+' || (
          ABS(random()) % (
            CAST(
              julianday('2009-12-31') - julianday('2001-01-01') + 1 AS INTEGER
            )
          )
        ) || ' days'
      )
    ) * 1000
  );

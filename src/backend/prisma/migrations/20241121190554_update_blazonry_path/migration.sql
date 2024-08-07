/**
 * Updates team blazon file extensions and prepends
 * their full path in the resources folder.
 */
UPDATE Team
SET blazon =
    CASE
        WHEN blazon LIKE 'resources://blazonry/%' THEN REPLACE(blazon, '.png', '.svg')
        ELSE 'resources://blazonry/' || REPLACE(blazon, '.png', '.svg')
    END;

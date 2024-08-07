-- Turn on WAL mode for improved SQLite performance
--
-- @see: https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/performance.md
PRAGMA journal_mode=WAL;

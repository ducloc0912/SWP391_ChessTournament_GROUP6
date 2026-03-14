-- Migration: drop column categories from Tournaments (no longer used).
-- Run this only if your database already has the Tournaments.categories column.
-- New installs use ctms_full_schema_and_seed.sql which no longer has this column.

USE SWP391;
GO

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Tournaments') AND name = 'categories'
)
BEGIN
    ALTER TABLE Tournaments DROP COLUMN categories;
    PRINT 'Dropped column Tournaments.categories.';
END
ELSE
    PRINT 'Column Tournaments.categories does not exist (already migrated or fresh schema).';
GO

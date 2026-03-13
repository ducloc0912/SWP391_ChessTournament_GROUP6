-- Migration: Group Stage for Hybrid Round Robin
-- Run this on existing CTMS database

-- 1. Create Tournament_Group table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tournament_Group')
BEGIN
    CREATE TABLE Tournament_Group (
        group_id INT IDENTITY(1,1) PRIMARY KEY,
        tournament_id INT NOT NULL,
        bracket_id INT NULL,
        name NVARCHAR(20) NOT NULL,
        sort_order INT DEFAULT 0,
        max_players INT NULL,
        FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
        FOREIGN KEY (bracket_id) REFERENCES Bracket(bracket_id)
    );
    PRINT N'Tournament_Group table created.';
END
GO

-- 2. Add group_id to Participants
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Participants') AND name = 'group_id')
BEGIN
    ALTER TABLE Participants ADD group_id INT NULL;
    PRINT N'Participants.group_id added.';
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Participants') AND name = 'group_id')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Participants_Group')
    BEGIN
        ALTER TABLE Participants ADD CONSTRAINT FK_Participants_Group
            FOREIGN KEY (group_id) REFERENCES Tournament_Group(group_id);
        PRINT N'FK_Participants_Group added.';
    END
END
GO

-- 3. Add group_id to Round
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Round') AND name = 'group_id')
BEGIN
    ALTER TABLE Round ADD group_id INT NULL;
    PRINT N'Round.group_id added.';
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Round') AND name = 'group_id')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Round_Group')
    BEGIN
        ALTER TABLE Round ADD CONSTRAINT FK_Round_Group
            FOREIGN KEY (group_id) REFERENCES Tournament_Group(group_id);
        PRINT N'FK_Round_Group added.';
    END
END
GO

-- 4. Add group_id to Matches
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Matches') AND name = 'group_id')
BEGIN
    ALTER TABLE Matches ADD group_id INT NULL;
    PRINT N'Matches.group_id added.';
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Matches') AND name = 'group_id')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Matches_Group')
    BEGIN
        ALTER TABLE Matches ADD CONSTRAINT FK_Matches_Group
            FOREIGN KEY (group_id) REFERENCES Tournament_Group(group_id);
        PRINT N'FK_Matches_Group added.';
    END
END
GO

PRINT N'Group Stage migration completed.';

/* ============================================================================
   Setup flow test data (idempotent)
   - Purpose: Test swim-lane flow Structure -> Add Players -> Schedule
   - Safe to re-run: uses IF NOT EXISTS / MERGE patterns where possible
   ============================================================================ */

/* 1) Ensure swim-lane state table exists */
IF OBJECT_ID('dbo.Tournament_Setup_State', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tournament_Setup_State (
        tournament_id INT PRIMARY KEY,
        current_step NVARCHAR(20) NOT NULL
            CHECK (current_step IN ('STRUCTURE','PLAYERS','SCHEDULE','COMPLETED')),
        updated_at DATETIME NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (tournament_id) REFERENCES dbo.Tournaments(tournament_id) ON DELETE CASCADE
    );
END
GO

/* 2) Ensure seed table exists */
IF OBJECT_ID('dbo.Tournament_Seed', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tournament_Seed (
        seed_id INT IDENTITY(1,1) PRIMARY KEY,
        tournament_id INT NOT NULL,
        user_id INT NOT NULL,
        seed_number INT NOT NULL,
        source NVARCHAR(20) NOT NULL DEFAULT 'AUTO'
            CHECK (source IN ('AUTO','MANUAL','IMPORTED')),
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (tournament_id) REFERENCES dbo.Tournaments(tournament_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id),
        CONSTRAINT UQ_Tournament_Seed_User UNIQUE (tournament_id, user_id),
        CONSTRAINT UQ_Tournament_Seed_Number UNIQUE (tournament_id, seed_number),
        CONSTRAINT CK_Tournament_Seed_Number CHECK (seed_number > 0)
    );
END
GO

/* 3) Create one dedicated tournament for setup-flow testing */
DECLARE @FlowTournamentName NVARCHAR(120) = N'Flow Test KnockOut 2026';
DECLARE @LeaderId INT = 5; -- leader_hoang in SWP391_v2 sample

IF NOT EXISTS (
    SELECT 1
    FROM dbo.Tournaments
    WHERE tournament_name = @FlowTournamentName
)
BEGIN
    INSERT INTO dbo.Tournaments (
        tournament_name,
        description,
        tournament_image,
        rules,
        location,
        format,
        categories,
        max_player,
        min_player,
        entry_fee,
        prize_pool,
        status,
        registration_deadline,
        start_date,
        end_date,
        create_by,
        create_at,
        notes
    )
    VALUES (
        @FlowTournamentName,
        N'Tournament dùng riêng để test swim-lane setup flow.',
        '/tournaments/flow-test-ko-2026.jpg',
        N'KnockOut test flow: Structure -> Add Players -> Schedule',
        N'Test Arena - TP.HCM',
        'KnockOut',
        'Open',
        8,
        8,
        0,
        1000000,
        'Pending',
        DATEADD(DAY, 7, GETDATE()),
        DATEADD(DAY, 10, GETDATE()),
        DATEADD(DAY, 12, GETDATE()),
        @LeaderId,
        GETDATE(),
        N'Dữ liệu test tự động cho setup flow'
    );
END

DECLARE @TournamentId INT;
SELECT TOP 1 @TournamentId = tournament_id
FROM dbo.Tournaments
WHERE tournament_name = @FlowTournamentName
ORDER BY tournament_id DESC;

/* 4) Prepare 8 participant users (sample players from SWP391_v2) */
DECLARE @Players TABLE (user_id INT PRIMARY KEY, seed_no INT);
INSERT INTO @Players (user_id, seed_no)
VALUES
    (11, 1), -- FM
    (15, 2), -- CM
    (13, 3), -- NM
    (9,  4), -- CM
    (10, 5), -- WIM
    (14, 6), -- WFM
    (12, 7), -- WCM
    (20, 8); -- Unrated

/* 5) Upsert participants */
MERGE dbo.Participants AS target
USING (
    SELECT @TournamentId AS tournament_id, p.user_id, p.seed_no
    FROM @Players p
) AS src
ON (target.tournament_id = src.tournament_id AND target.user_id = src.user_id)
WHEN MATCHED THEN
    UPDATE SET
        target.seed = src.seed_no,
        target.status = 'Active',
        target.is_paid = 1,
        target.registration_date = ISNULL(target.registration_date, GETDATE())
WHEN NOT MATCHED THEN
    INSERT (tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date, notes)
    VALUES (src.tournament_id, src.user_id, NULL, src.seed_no, 'Active', 1, GETDATE(), GETDATE(), N'Auto test participant');

/* 6) Upsert Tournament_Seed */
MERGE dbo.Tournament_Seed AS target
USING (
    SELECT @TournamentId AS tournament_id, p.user_id, p.seed_no
    FROM @Players p
) AS src
ON (target.tournament_id = src.tournament_id AND target.user_id = src.user_id)
WHEN MATCHED THEN
    UPDATE SET
        target.seed_number = src.seed_no,
        target.source = 'AUTO',
        target.updated_at = GETDATE()
WHEN NOT MATCHED THEN
    INSERT (tournament_id, user_id, seed_number, source, created_at, updated_at)
    VALUES (src.tournament_id, src.user_id, src.seed_no, 'AUTO', GETDATE(), GETDATE());

/* Remove stale seeds that are not in the current test set */
DELETE ts
FROM dbo.Tournament_Seed ts
LEFT JOIN @Players p ON p.user_id = ts.user_id
WHERE ts.tournament_id = @TournamentId
  AND p.user_id IS NULL;

/* 7) Reset setup state to STRUCTURE (start of flow) */
MERGE dbo.Tournament_Setup_State AS target
USING (SELECT @TournamentId AS tournament_id, 'STRUCTURE' AS current_step) AS src
ON target.tournament_id = src.tournament_id
WHEN MATCHED THEN
    UPDATE SET current_step = src.current_step, updated_at = GETDATE()
WHEN NOT MATCHED THEN
    INSERT (tournament_id, current_step, updated_at)
    VALUES (src.tournament_id, src.current_step, GETDATE());

/* 8) Build bracket structure only (no players assigned yet) */
DELETE FROM dbo.Matches WHERE tournament_id = @TournamentId;
DELETE FROM dbo.Round WHERE tournament_id = @TournamentId;
DELETE FROM dbo.Bracket WHERE tournament_id = @TournamentId;

DECLARE @BracketId INT;
INSERT INTO dbo.Bracket (bracket_name, tournament_id, type, status)
VALUES (N'Flow Test KO Bracket', @TournamentId, 'KnockOut', 'Pending');
SET @BracketId = SCOPE_IDENTITY();

DECLARE @Round1Id INT, @Round2Id INT, @Round3Id INT;
INSERT INTO dbo.Round (bracket_id, tournament_id, name, round_index, is_completed)
VALUES (@BracketId, @TournamentId, N'Quarterfinal', 1, 0);
SET @Round1Id = SCOPE_IDENTITY();

INSERT INTO dbo.Round (bracket_id, tournament_id, name, round_index, is_completed)
VALUES (@BracketId, @TournamentId, N'Semifinal', 2, 0);
SET @Round2Id = SCOPE_IDENTITY();

INSERT INTO dbo.Round (bracket_id, tournament_id, name, round_index, is_completed)
VALUES (@BracketId, @TournamentId, N'Final', 3, 0);
SET @Round3Id = SCOPE_IDENTITY();

/* Quarterfinal: 4 matches */
INSERT INTO dbo.Matches (tournament_id, round_id, board_number, white_player_id, black_player_id, status)
VALUES
    (@TournamentId, @Round1Id, 1, NULL, NULL, 'Scheduled'),
    (@TournamentId, @Round1Id, 2, NULL, NULL, 'Scheduled'),
    (@TournamentId, @Round1Id, 3, NULL, NULL, 'Scheduled'),
    (@TournamentId, @Round1Id, 4, NULL, NULL, 'Scheduled');

/* Semifinal: 2 matches */
INSERT INTO dbo.Matches (tournament_id, round_id, board_number, white_player_id, black_player_id, status)
VALUES
    (@TournamentId, @Round2Id, 1, NULL, NULL, 'Scheduled'),
    (@TournamentId, @Round2Id, 2, NULL, NULL, 'Scheduled');

/* Final: 1 match */
INSERT INTO dbo.Matches (tournament_id, round_id, board_number, white_player_id, black_player_id, status)
VALUES
    (@TournamentId, @Round3Id, 1, NULL, NULL, 'Scheduled');

SELECT
    @TournamentId AS flow_test_tournament_id,
    @FlowTournamentName AS flow_test_tournament_name,
    (SELECT current_step FROM dbo.Tournament_Setup_State WHERE tournament_id = @TournamentId) AS current_step,
    (SELECT COUNT(*) FROM dbo.Participants WHERE tournament_id = @TournamentId) AS participant_count,
    (SELECT COUNT(*) FROM dbo.Tournament_Seed WHERE tournament_id = @TournamentId) AS seed_count,
    (SELECT COUNT(*) FROM dbo.Matches WHERE tournament_id = @TournamentId) AS structure_match_count;

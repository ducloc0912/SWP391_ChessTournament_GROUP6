-- Tournament Setup Wizard: step status (DRAFT/FINALIZED) per step + audit log
-- Run on SWP391

USE SWP391;
GO

-- 1) Extend Tournament_Setup_State with per-step status and updated_by
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Tournament_Setup_State') AND name = 'bracket_status')
BEGIN
    ALTER TABLE Tournament_Setup_State ADD bracket_status   NVARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (bracket_status   IN ('DRAFT','FINALIZED'));
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Tournament_Setup_State') AND name = 'players_status')
BEGIN
    ALTER TABLE Tournament_Setup_State ADD players_status   NVARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (players_status   IN ('DRAFT','FINALIZED'));
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Tournament_Setup_State') AND name = 'schedule_status')
BEGIN
    ALTER TABLE Tournament_Setup_State ADD schedule_status  NVARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (schedule_status  IN ('DRAFT','FINALIZED'));
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Tournament_Setup_State') AND name = 'referees_status')
BEGIN
    ALTER TABLE Tournament_Setup_State ADD referees_status  NVARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (referees_status  IN ('DRAFT','FINALIZED'));
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Tournament_Setup_State') AND name = 'updated_by')
BEGIN
    ALTER TABLE Tournament_Setup_State ADD updated_by INT NULL
        REFERENCES Users(user_id);
END
GO

-- 2) Setup audit log for finalize/unlock and step changes
IF OBJECT_ID('dbo.Setup_Audit_Log', 'U') IS NULL
BEGIN
    CREATE TABLE Setup_Audit_Log (
        id INT IDENTITY(1,1) PRIMARY KEY,
        tournament_id INT NOT NULL,
        step NVARCHAR(20) NOT NULL,
        action NVARCHAR(30) NOT NULL,
        before_json NVARCHAR(MAX) NULL,
        after_json NVARCHAR(MAX) NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        created_by INT NULL,
        FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES Users(user_id)
    );
    CREATE INDEX idx_setup_audit_tournament ON Setup_Audit_Log(tournament_id);
    CREATE INDEX idx_setup_audit_created ON Setup_Audit_Log(created_at);
END
GO

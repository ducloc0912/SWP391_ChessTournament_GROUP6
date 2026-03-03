-- Referee Invitation: Leader mời referee bằng email, Pending -> Reminder (24h/48h) -> Expired (X ngày)
-- Chạy script này trên database SWP391

USE SWP391;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Referee_Invitation')
BEGIN
CREATE TABLE Referee_Invitation (
    invitation_id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    invited_email NVARCHAR(100) NOT NULL,
    referee_role NVARCHAR(30) NOT NULL DEFAULT 'Assistant'
        CHECK (referee_role IN ('Chief','Assistant')),
    invited_by INT NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending','Accepted','Expired','Rejected')),
    invited_at DATETIME DEFAULT GETDATE(),
    expires_at DATETIME NOT NULL,
    token NVARCHAR(100),
    accepted_at DATETIME,
    referee_id INT NULL,
    last_reminder_at DATETIME,
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES Users(user_id),
    FOREIGN KEY (referee_id) REFERENCES Users(user_id)
);
CREATE INDEX idx_referee_inv_tournament ON Referee_Invitation(tournament_id);
CREATE INDEX idx_referee_inv_email ON Referee_Invitation(invited_email);
CREATE INDEX idx_referee_inv_status ON Referee_Invitation(status);
CREATE INDEX idx_referee_inv_expires ON Referee_Invitation(expires_at);
END
GO

-- Waiting_List: Danh sách chờ đăng ký giải đấu (trước khi được duyệt thành Participant)
-- Chạy script này trên database SWP391

USE SWP391;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Waiting_List')
BEGIN
CREATE TABLE Waiting_List (
    waiting_id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    user_id INT NOT NULL,
    rank_at_registration INT,
    status NVARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending','Approved','Rejected')),
    note NVARCHAR(MAX),
    approved_by INT,
    approved_at DATETIME,
    registration_date DATETIME DEFAULT GETDATE(),
    registration_full_name NVARCHAR(100),
    registration_username NVARCHAR(50),
    registration_email NVARCHAR(100),
    registration_phone NVARCHAR(20),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (approved_by) REFERENCES Users(user_id),
    CONSTRAINT UQ_WaitingList_TournamentUser UNIQUE (tournament_id, user_id)
);
CREATE INDEX idx_waiting_list_tournament ON Waiting_List(tournament_id);
CREATE INDEX idx_waiting_list_user ON Waiting_List(user_id);
CREATE INDEX idx_waiting_list_status ON Waiting_List(status);
END
GO

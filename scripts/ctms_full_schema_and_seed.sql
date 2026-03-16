/* =====================================================================
   CTMS - CHESS TOURNAMENT MANAGEMENT SYSTEM
   FULL SCHEMA + SEED - Chốt database để code và test

   Nội dung:
   0. Tạo database SWP391 (reset nếu đã tồn tại – DEV only)
   1. Tạo toàn bộ bảng (schema đầy đủ, đáp ứng code hiện tại)
   2. Seed: Roles, Permission, User_Role
   3. Seed: Accounts theo role (Admin, Staff, Leader, Referee, Player)
   4. Seed: 3 giải Upcoming (RoundRobin, KnockOut, Hybrid) – full người chơi
   5. Seed: 2 giải khác (1 thể thức RoundRobin: Completed + Ongoing) – full người chơi

   Password mặc định: 123456 (hash SHA256)
   ===================================================================== */

/* ========================= 0. RESET & CREATE DATABASE ========================= */
IF DB_ID('SWP391') IS NOT NULL
BEGIN
    ALTER DATABASE SWP391 SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE SWP391;
END;
GO
CREATE DATABASE SWP391;
GO
USE SWP391;
GO

/* ========================= 1. TABLES ========================= */

CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50),
    first_name NVARCHAR(50) NOT NULL,
    last_name NVARCHAR(50) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    phone_number NVARCHAR(20) UNIQUE NOT NULL,
    address NVARCHAR(255),
    gender NVARCHAR(10) CHECK (gender IN ('Male','Female','Other')),
    birthday DATE,
    password NVARCHAR(MAX) NOT NULL,
    avatar NVARCHAR(500),
    balance DECIMAL(18,2) DEFAULT 0,
    rank INT DEFAULT 0,
    last_login DATETIME,
    create_at DATETIME DEFAULT GETDATE(),
    is_active BIT DEFAULT 1
);
GO

CREATE TABLE Roles (
    role_id INT IDENTITY(1,1) PRIMARY KEY,
    role_name NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(200),
    is_active BIT DEFAULT 1,
    create_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE Permission (
    permission_id INT IDENTITY(1,1) PRIMARY KEY,
    permission_name NVARCHAR(100) NOT NULL,
    permission_code NVARCHAR(50) NOT NULL UNIQUE,
    module NVARCHAR(50) NOT NULL,
    description NVARCHAR(200)
);

CREATE TABLE Role_Permission (
    role_id INT,
    permission_id INT,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES Roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES Permission(permission_id) ON DELETE CASCADE
);

CREATE TABLE User_Role (
    user_id INT,
    role_id INT,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES Roles(role_id) ON DELETE CASCADE
);
GO

CREATE TABLE Tournaments (
    tournament_id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_name NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    tournament_image NVARCHAR(500),
    rules NVARCHAR(MAX),
    location NVARCHAR(200),
    format NVARCHAR(20) NOT NULL CHECK (format IN ('RoundRobin','KnockOut','Hybrid')),
    max_player INT,
    min_player INT,
    entry_fee DECIMAL(18,2) DEFAULT 0,
    prize_pool DECIMAL(18,2) DEFAULT 0,
    status NVARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending','Rejected','Delayed','Ongoing','Completed','Cancelled','Upcoming')),
    registration_deadline DATETIME,
    start_date DATETIME,
    end_date DATETIME,
    create_by INT NOT NULL,
    create_at DATETIME DEFAULT GETDATE(),
    notes NVARCHAR(MAX),
    FOREIGN KEY (create_by) REFERENCES Users(user_id)
);
GO

CREATE TABLE Tournament_Images (
    image_id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    image_url NVARCHAR(500) NOT NULL,
    display_order INT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE
);
GO

CREATE TABLE Tournament_Follow (
    follow_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    tournament_id INT NOT NULL,
    create_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT uq_tournament_follow UNIQUE (user_id, tournament_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE
);
GO

CREATE TABLE Tournament_Staff (
    tournament_id INT,
    staff_id INT,
    staff_role NVARCHAR(30) CHECK (staff_role IN ('Manager','Approver','Support')),
    assigned_by INT,
    assigned_at DATETIME DEFAULT GETDATE(),
    note NVARCHAR(200),
    PRIMARY KEY (tournament_id, staff_id),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES Users(user_id),
    FOREIGN KEY (assigned_by) REFERENCES Users(user_id)
);

CREATE TABLE Tournament_Referee (
    tournament_id INT,
    referee_id INT,
    referee_role NVARCHAR(30) CHECK (referee_role IN ('Chief','Assistant')),
    assigned_by INT,
    assigned_at DATETIME DEFAULT GETDATE(),
    note NVARCHAR(200),
    PRIMARY KEY (tournament_id, referee_id),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (referee_id) REFERENCES Users(user_id),
    FOREIGN KEY (assigned_by) REFERENCES Users(user_id)
);

CREATE TABLE Tournament_Approval_Log (
    approval_id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    staff_id INT NOT NULL,
    action NVARCHAR(30) CHECK (action IN ('Approve','Reject','Delay','Start','Complete','Cancel')),
    from_status NVARCHAR(20),
    to_status NVARCHAR(20) CHECK (to_status IN ('Pending','Rejected','Delayed','Ongoing','Completed','Cancelled','Upcoming')),
    note NVARCHAR(500),
    create_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES Users(user_id)
);
GO

CREATE TABLE Referee_Invitation (
    invitation_id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    invited_email NVARCHAR(100) NOT NULL,
    referee_role NVARCHAR(30) NOT NULL DEFAULT 'Assistant' CHECK (referee_role IN ('Chief','Assistant')),
    invited_by INT NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Accepted','Expired','Rejected')),
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
GO

CREATE TABLE Participants (
    participant_id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    user_id INT NOT NULL,
    title_at_registration NVARCHAR(20),
    seed INT,
    status NVARCHAR(20) DEFAULT 'Active'
        CHECK (status IN ('Active','PendingPayment','Withdrawn','Disqualified')),
    is_paid BIT DEFAULT 0,
    payment_date DATETIME,
    payment_expires_at DATETIME NULL,
    removed_at DATETIME NULL,
    registration_date DATETIME DEFAULT GETDATE(),
    notes NVARCHAR(MAX),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    CONSTRAINT UQ_Participant UNIQUE (tournament_id, user_id)
);
GO

CREATE TABLE Bracket (
    bracket_id INT IDENTITY(1,1) PRIMARY KEY,
    bracket_name NVARCHAR(50),
    tournament_id INT,
    type NVARCHAR(20) NOT NULL CHECK (type IN ('RoundRobin','KnockOut','Swiss')),
    status NVARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending','Ongoing','Completed','Published')),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE
);
GO

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
GO

ALTER TABLE Participants ADD group_id INT NULL;
ALTER TABLE Participants ADD CONSTRAINT FK_Participants_Group FOREIGN KEY (group_id) REFERENCES Tournament_Group(group_id);
GO

CREATE TABLE Round (
    round_id INT IDENTITY(1,1) PRIMARY KEY,
    bracket_id INT,
    tournament_id INT,
    group_id INT NULL,
    name NVARCHAR(50) NOT NULL,
    round_index INT NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    is_completed BIT DEFAULT 0,
    FOREIGN KEY (bracket_id) REFERENCES Bracket(bracket_id),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES Tournament_Group(group_id)
);

CREATE TABLE Matches (
    match_id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    round_id INT,
    group_id INT NULL,
    board_number INT,
    player1_id INT,
    player2_id INT,
    player1_score DECIMAL(3,1) DEFAULT 0,
    player2_score DECIMAL(3,1) DEFAULT 0,
    winner_id INT NULL,
    result NVARCHAR(20) CHECK (result IN ('player1','player2','draw','pending','none')),
    status NVARCHAR(20) DEFAULT 'Scheduled'
        CHECK (status IN ('Scheduled','Ongoing','Completed','Published')),
    start_time DATETIME,
    end_time DATETIME,
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (round_id) REFERENCES Round(round_id),
    FOREIGN KEY (group_id) REFERENCES Tournament_Group(group_id),
    FOREIGN KEY (player1_id) REFERENCES Users(user_id),
    FOREIGN KEY (player2_id) REFERENCES Users(user_id),
    FOREIGN KEY (winner_id) REFERENCES Users(user_id),
    CHECK (player1_id <> player2_id)
);
GO

/* Các ván đấu trong một trận: 2 ván (mỗi bên trắng/đen 1 lần) hoặc thêm ván 3 cờ chớp khi hòa. */
CREATE TABLE Mini_matches (
    mini_match_id INT IDENTITY(1,1) PRIMARY KEY,
    match_id INT NOT NULL,
    game_number INT NOT NULL,
    is_tiebreak BIT DEFAULT 0,
    white_player_id INT,
    black_player_id INT,
    result NVARCHAR(10)
        CHECK (result IN ('1-0','0-1','1/2-1/2','*')),
    termination NVARCHAR(50)
        CHECK (termination IN (
            'Checkmate',
            'Resignation',
            'Timeout',
            'Stalemate',
            'Draw',
            'Forfeit'
        )),
    status NVARCHAR(20) DEFAULT 'Scheduled'
        CHECK (status IN ('Scheduled','Ongoing','Completed')),
    start_time DATETIME,
    end_time DATETIME,
    FOREIGN KEY (match_id) REFERENCES Matches(match_id) ON DELETE CASCADE,
    FOREIGN KEY (white_player_id) REFERENCES Users(user_id),
    FOREIGN KEY (black_player_id) REFERENCES Users(user_id),
    CHECK (white_player_id <> black_player_id)
);
GO

CREATE TABLE Match_Referee (
    match_id INT,
    referee_id INT,
    role NVARCHAR(30) DEFAULT 'Main' CHECK (role IN ('Main','Assistant')),
    assigned_at DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (match_id, referee_id),
    FOREIGN KEY (match_id) REFERENCES Matches(match_id) ON DELETE CASCADE,
    FOREIGN KEY (referee_id) REFERENCES Users(user_id)
);
GO

/* Điểm danh theo từng ván (mini_match). Mỗi ván có 2 bản ghi: trắng + đen. */
CREATE TABLE Match_Attendance (
    mini_match_id INT NOT NULL,
    user_id INT NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending','Present','Absent')),
    recorded_at DATETIME DEFAULT GETDATE(),
    recorded_by INT NULL,
    PRIMARY KEY (mini_match_id, user_id),
    FOREIGN KEY (mini_match_id) REFERENCES Mini_matches(mini_match_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (recorded_by) REFERENCES Users(user_id)
);
GO

/* Tournament_Setup_State - đầy đủ cột status (đáp ứng code hiện tại) */
CREATE TABLE Tournament_Setup_State (
    tournament_id INT PRIMARY KEY,
    current_step NVARCHAR(20) NOT NULL
        CHECK (current_step IN ('STRUCTURE','PLAYERS','SCHEDULE','REFEREE','COMPLETED')),
    updated_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_by INT NULL,
    bracket_status NVARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (bracket_status IN ('DRAFT','FINALIZED')),
    players_status NVARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (players_status IN ('DRAFT','FINALIZED')),
    schedule_status NVARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (schedule_status IN ('DRAFT','FINALIZED')),
    referees_status NVARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (referees_status IN ('DRAFT','FINALIZED')),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES Users(user_id)
);
GO

CREATE TABLE Tournament_Seed (
    seed_id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    user_id INT NOT NULL,
    seed_number INT NOT NULL,
    source NVARCHAR(20) NOT NULL DEFAULT 'AUTO' CHECK (source IN ('AUTO','MANUAL','IMPORTED')),
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    CONSTRAINT UQ_Tournament_Seed_User UNIQUE (tournament_id, user_id),
    CONSTRAINT UQ_Tournament_Seed_Number UNIQUE (tournament_id, seed_number),
    CONSTRAINT CK_Tournament_Seed_Number CHECK (seed_number > 0)
);

CREATE TABLE Match_PGN (
    match_id INT PRIMARY KEY,
    pgn_text NVARCHAR(MAX),
    fen_final NVARCHAR(200),
    total_moves INT,
    duration_seconds INT,
    FOREIGN KEY (match_id) REFERENCES Matches(match_id) ON DELETE CASCADE
);
GO

CREATE TABLE Standing (
    tournament_id INT,
    user_id INT,
    matches_played INT DEFAULT 0,
    won INT DEFAULT 0,
    drawn INT DEFAULT 0,
    lost INT DEFAULT 0,
    point DECIMAL(5,1) DEFAULT 0,
    tie_break DECIMAL(10,2) DEFAULT 0,
    current_rank INT,
    PRIMARY KEY (tournament_id, user_id),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
GO

CREATE TABLE Report (
    report_id INT IDENTITY(1,1) PRIMARY KEY,
    reporter_id INT,
    accused_id INT,
    match_id INT,
    description NVARCHAR(500) NOT NULL,
    evidence_url NVARCHAR(500) NOT NULL,
    type NVARCHAR(100) NOT NULL CHECK (type IN ('Cheating','Misconduct','TechnicalIssue','Other')),
    status NVARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending','Investigating','Resolved','Dismissed')),
    note NVARCHAR(500),
    resolved_by INT,
    create_at DATETIME DEFAULT GETDATE(),
    resolved_at DATETIME,
    FOREIGN KEY (reporter_id) REFERENCES Users(user_id),
    FOREIGN KEY (accused_id) REFERENCES Users(user_id),
    FOREIGN KEY (resolved_by) REFERENCES Users(user_id),
    FOREIGN KEY (match_id) REFERENCES Matches(match_id)
);

CREATE TABLE Feedback (
    feedback_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    tournament_id INT,
    match_id INT,
    star_rating INT CHECK (star_rating BETWEEN 1 AND 5),
    comment NVARCHAR(MAX),
    status NVARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    reply NVARCHAR(500),
    create_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES Matches(match_id)
);
GO

CREATE TABLE Blog_Post (
    blog_post_id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(Max) NOT NULL,
    summary NVARCHAR(Max),
    content NVARCHAR(MAX),
    thumbnail_url NVARCHAR(Max),
    author_id INT NOT NULL,
    categories NVARCHAR(50) CHECK (categories IN ('Strategy','News','Guide')),
    status NVARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft','Public','Private')),
    views INT DEFAULT 0,
    publish_at DATETIME,
    create_at DATETIME DEFAULT GETDATE(),
    update_at DATETIME,
    FOREIGN KEY (author_id) REFERENCES Users(user_id)
);

CREATE TABLE Blog_Image (
    image_id INT IDENTITY(1,1) PRIMARY KEY,
    blog_post_id INT NOT NULL,
    image_url NVARCHAR(Max) NOT NULL,
    caption NVARCHAR(Max),
    sort_order INT DEFAULT 0,
    create_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (blog_post_id) REFERENCES Blog_Post(blog_post_id) ON DELETE CASCADE
);

CREATE TABLE Notification (
    notification_id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(100) NOT NULL,
    message NVARCHAR(MAX),
    type NVARCHAR(30) CHECK (type IN ('System','Tournament','Match','Payment','Report','General')),
    action_url NVARCHAR(500),
    is_read BIT DEFAULT 0,
    create_at DATETIME DEFAULT GETDATE(),
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);
GO

CREATE TABLE Payment_Method (
    method_id INT IDENTITY(1,1) PRIMARY KEY,
    method_name NVARCHAR(50) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    is_active BIT DEFAULT 1,
    description NVARCHAR(200)
);

CREATE TABLE Deposit (
    deposit_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    method_id INT NOT NULL,
    amount DECIMAL(18,2) CHECK (amount > 0),
    external_transaction_code VARCHAR(100) UNIQUE,
    proof_url NVARCHAR(500),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending','Success','Failed','Cancelled')),
    admin_note NVARCHAR(MAX),
    processed_by INT,
    processed_at DATETIME,
    create_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (method_id) REFERENCES Payment_Method(method_id),
    FOREIGN KEY (processed_by) REFERENCES Users(user_id)
);

CREATE TABLE Withdrawal (
    withdrawal_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(18,2) CHECK (amount > 0),
    bank_name NVARCHAR(100) NOT NULL,
    bank_account_number VARCHAR(50) NOT NULL,
    bank_account_name NVARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected','Completed')),
    rejection_reason NVARCHAR(MAX),
    approved_by INT,
    approved_at DATETIME,
    bank_transfer_ref VARCHAR(100),
    create_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (approved_by) REFERENCES Users(user_id)
);

CREATE TABLE Payment_Transaction (
    transaction_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    tournament_id INT NULL,
    type NVARCHAR(30) NOT NULL CHECK (type IN ('EntryFee','Prize','Refund','Deposit','Withdrawal','TournamentCreation')),
    amount DECIMAL(18,2) NOT NULL,
    balance_after DECIMAL(18,2),
    description NVARCHAR(500),
    reference_id INT NULL,
    create_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id)
);
GO

CREATE TABLE Avatar_Frame (
    frame_id INT IDENTITY(1,1) PRIMARY KEY,
    frame_name NVARCHAR(100) NOT NULL,
    frame_url NVARCHAR(500) NOT NULL,
    description NVARCHAR(200),
    rarity NVARCHAR(20) DEFAULT 'Common' CHECK (rarity IN ('Common','Rare','Epic','Legendary')),
    unlock_condition NVARCHAR(200),
    price DECIMAL(18,2) DEFAULT 0,
    is_active BIT DEFAULT 1,
    create_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE User_Avatar_Frame (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    frame_id INT NOT NULL,
    is_equipped BIT DEFAULT 0,
    obtained_at DATETIME DEFAULT GETDATE(),
    obtained_by NVARCHAR(30) DEFAULT 'Reward' CHECK (obtained_by IN ('Reward','Purchase','Event','Default')),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (frame_id) REFERENCES Avatar_Frame(frame_id) ON DELETE CASCADE,
    CONSTRAINT UQ_User_Frame UNIQUE (user_id, frame_id)
);
GO

CREATE TABLE Chess_Title (
    title_id INT IDENTITY(1,1) PRIMARY KEY,
    title_code NVARCHAR(10) NOT NULL UNIQUE,
    title_name NVARCHAR(50) NOT NULL,
    min_elo INT DEFAULT 0,
    icon_url NVARCHAR(500),
    sort_order INT DEFAULT 0
);

CREATE TABLE User_Chess_Profile (
    user_id INT PRIMARY KEY,
    title_id INT NULL,
    elo_rating INT DEFAULT 1200,
    highest_elo INT DEFAULT 1200,
    total_games INT DEFAULT 0,
    total_wins INT DEFAULT 0,
    total_draws INT DEFAULT 0,
    total_losses INT DEFAULT 0,
    last_game_at DATETIME,
    update_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (title_id) REFERENCES Chess_Title(title_id)
);
GO

CREATE TABLE Prize_Template (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    rank_position INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    fixed_amount DECIMAL(18,2) DEFAULT 0,
    label NVARCHAR(50),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    CONSTRAINT UQ_Prize_Template UNIQUE (tournament_id, rank_position),
    CONSTRAINT CK_Percentage CHECK (percentage >= 0 AND percentage <= 100),
    CONSTRAINT CK_Rank CHECK (rank_position >= 1)
);

CREATE TABLE Prize_Distribution (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    user_id INT NOT NULL,
    rank_position INT NOT NULL,
    prize_amount DECIMAL(18,2) NOT NULL,
    is_distributed BIT DEFAULT 0,
    distributed_at DATETIME,
    note NVARCHAR(200),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
GO

CREATE TABLE Password_Reset_OTP (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(100) NOT NULL,
    otp NVARCHAR(10) NOT NULL,
    is_used BIT DEFAULT 0,
    create_at DATETIME DEFAULT GETDATE(),
    expire_at DATETIME NOT NULL
);
GO

/* ========================= 2. SEED: ROLES & PERMISSIONS ========================= */
INSERT INTO Roles (role_name, description) VALUES
    ('Admin', 'Full system access'),
    ('Staff', 'Tournament staff - approve/reject tournaments'),
    ('TournamentLeader', 'Tournament organizer/leader'),
    ('Referee', 'Match referee/arbiter'),
    ('Player', 'Normal chess player');
GO

SET IDENTITY_INSERT Permission ON;
INSERT INTO Permission (permission_id, permission_name, permission_code, module, description) VALUES
(1,  'View Own Profile', 'USER_VIEW_PROFILE', 'USER', 'View own profile'),
(2,  'Edit Own Profile', 'USER_EDIT_PROFILE', 'USER', 'Edit own profile'),
(3,  'Change Password', 'USER_CHANGE_PWD', 'USER', 'Change password'),
(10, 'View All Users', 'ADMIN_USER_LIST', 'ADMIN', 'View all users'),
(11, 'Edit User Status', 'ADMIN_USER_STATUS', 'ADMIN', 'Ban/Unban users'),
(12, 'Manage User Roles', 'ADMIN_USER_ROLE', 'ADMIN', 'Assign roles'),
(20, 'Create Tournament', 'TOUR_CREATE', 'TOURNAMENT', 'Create tournament'),
(21, 'Edit Own Tournament', 'TOUR_EDIT', 'TOURNAMENT', 'Edit tournament'),
(22, 'Cancel Own Tournament', 'TOUR_CANCEL', 'TOURNAMENT', 'Cancel tournament'),
(23, 'View Tournament List', 'TOUR_VIEW_LIST', 'TOURNAMENT', 'View list'),
(24, 'View Tournament Detail', 'TOUR_VIEW_DETAIL', 'TOURNAMENT', 'View detail'),
(25, 'Approve Tournament', 'TOUR_APPROVE', 'TOURNAMENT', 'Approve'),
(26, 'Reject Tournament', 'TOUR_REJECT', 'TOURNAMENT', 'Reject'),
(27, 'Start Tournament', 'TOUR_START', 'TOURNAMENT', 'Start'),
(28, 'Complete Tournament', 'TOUR_COMPLETE', 'TOURNAMENT', 'Complete'),
(29, 'Assign Staff', 'TOUR_ASSIGN_STAFF', 'TOURNAMENT', 'Assign staff'),
(30, 'Assign Referee', 'TOUR_ASSIGN_REFEREE', 'TOURNAMENT', 'Assign referee'),
(40, 'Register Tournament', 'PART_REGISTER', 'PARTICIPANT', 'Register'),
(41, 'Withdraw Tournament', 'PART_WITHDRAW', 'PARTICIPANT', 'Withdraw'),
(42, 'View Participants', 'PART_VIEW_LIST', 'PARTICIPANT', 'View participants'),
(50, 'View Matches', 'MATCH_VIEW', 'MATCH', 'View matches'),
(51, 'Record Match Result', 'MATCH_RECORD_RESULT', 'MATCH', 'Record result'),
(52, 'Generate Bracket', 'MATCH_GEN_BRACKET', 'MATCH', 'Generate bracket'),
(55, 'View Standings', 'STANDING_VIEW', 'STANDING', 'View standings'),
(60, 'Create Report', 'REPORT_CREATE', 'REPORT', 'Create report'),
(61, 'View Reports', 'REPORT_VIEW', 'REPORT', 'View reports'),
(62, 'Resolve Report', 'REPORT_RESOLVE', 'REPORT', 'Resolve report'),
(70, 'Create Feedback', 'FEEDBACK_CREATE', 'FEEDBACK', 'Create feedback'),
(71, 'View Feedbacks', 'FEEDBACK_VIEW', 'FEEDBACK', 'View feedback'),
(80, 'Create Blog Post', 'BLOG_CREATE', 'BLOG', 'Create blog'),
(81, 'Edit Own Blog Post', 'BLOG_EDIT', 'BLOG', 'Edit blog'),
(82, 'Delete Own Blog Post', 'BLOG_DELETE', 'BLOG', 'Delete blog'),
(83, 'Publish Blog Post', 'BLOG_PUBLISH', 'BLOG', 'Publish blog'),
(90, 'View Own Balance', 'PAY_VIEW_BALANCE', 'PAYMENT', 'View balance'),
(91, 'Request Deposit', 'PAY_DEPOSIT', 'PAYMENT', 'Deposit'),
(92, 'Request Withdrawal', 'PAY_WITHDRAW', 'PAYMENT', 'Withdraw'),
(93, 'Process Deposit', 'PAY_PROCESS_DEPOSIT', 'PAYMENT', 'Process deposit'),
(94, 'Process Withdrawal', 'PAY_PROCESS_WITHDRAW', 'PAYMENT', 'Process withdrawal'),
(100, 'Receive Notifications', 'NOTIF_RECEIVE', 'NOTIFICATION', 'Receive notifications');
SET IDENTITY_INSERT Permission OFF;
GO

INSERT INTO Role_Permission (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM Roles r, Permission p WHERE r.role_name = 'Admin';
INSERT INTO Role_Permission (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM Roles r, Permission p WHERE r.role_name = 'Staff'
  AND p.permission_code IN ('USER_VIEW_PROFILE','USER_EDIT_PROFILE','USER_CHANGE_PWD','TOUR_VIEW_LIST','TOUR_VIEW_DETAIL','TOUR_APPROVE','TOUR_REJECT','TOUR_START','TOUR_COMPLETE','TOUR_ASSIGN_STAFF','TOUR_ASSIGN_REFEREE','PART_VIEW_LIST','MATCH_VIEW','MATCH_GEN_BRACKET','STANDING_VIEW','REPORT_VIEW','REPORT_RESOLVE','FEEDBACK_VIEW','BLOG_CREATE','BLOG_EDIT','BLOG_DELETE','BLOG_PUBLISH','PAY_VIEW_BALANCE','NOTIF_RECEIVE');
INSERT INTO Role_Permission (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM Roles r, Permission p WHERE r.role_name = 'TournamentLeader'
  AND p.permission_code IN ('USER_VIEW_PROFILE','USER_EDIT_PROFILE','USER_CHANGE_PWD','TOUR_CREATE','TOUR_EDIT','TOUR_CANCEL','TOUR_VIEW_LIST','TOUR_VIEW_DETAIL','TOUR_ASSIGN_REFEREE','PART_VIEW_LIST','MATCH_VIEW','MATCH_GEN_BRACKET','STANDING_VIEW','REPORT_VIEW','FEEDBACK_VIEW','BLOG_CREATE','BLOG_EDIT','BLOG_DELETE','PAY_VIEW_BALANCE','PAY_DEPOSIT','PAY_WITHDRAW','NOTIF_RECEIVE');
INSERT INTO Role_Permission (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM Roles r, Permission p WHERE r.role_name = 'Referee'
  AND p.permission_code IN ('USER_VIEW_PROFILE','USER_EDIT_PROFILE','USER_CHANGE_PWD','TOUR_VIEW_LIST','TOUR_VIEW_DETAIL','PART_VIEW_LIST','MATCH_VIEW','MATCH_RECORD_RESULT','STANDING_VIEW','REPORT_CREATE','REPORT_VIEW','FEEDBACK_VIEW','PAY_VIEW_BALANCE','PAY_DEPOSIT','PAY_WITHDRAW','NOTIF_RECEIVE');
INSERT INTO Role_Permission (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM Roles r, Permission p WHERE r.role_name = 'Player'
  AND p.permission_code IN ('USER_VIEW_PROFILE','USER_EDIT_PROFILE','USER_CHANGE_PWD','TOUR_VIEW_LIST','TOUR_VIEW_DETAIL','PART_REGISTER','PART_WITHDRAW','PART_VIEW_LIST','MATCH_VIEW','STANDING_VIEW','REPORT_CREATE','FEEDBACK_CREATE','FEEDBACK_VIEW','PAY_VIEW_BALANCE','PAY_DEPOSIT','PAY_WITHDRAW','NOTIF_RECEIVE');
GO

/* ========================= 3. SEED: ACCOUNTS BY ROLE ========================= */
/* Password: 123456 (SHA256) */
DECLARE @pwd NVARCHAR(MAX) = '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5';

SET IDENTITY_INSERT Users ON;
INSERT INTO Users (user_id, username, first_name, last_name, email, phone_number, address, gender, birthday, password, balance, is_active) VALUES
(1,  'admin',      N'Minh',    N'Nguyễn Văn',   'admin@ctms.vn',            '0901000001', N'Hà Nội', 'Male',   '1985-03-15', @pwd, 0, 1),
(2,  'staff1',     N'Hương',   N'Trần Thị',     'staff1@ctms.vn',           '0901000002', N'Hà Nội', 'Female', '1990-07-22', @pwd, 0, 1),
(3,  'staff2',     N'Tuấn',    N'Lê Thanh',     'staff2@ctms.vn',           '0901000003', N'TP.HCM',  'Male',   '1988-11-05', @pwd, 0, 1),
(4,  'leader1',    N'Đức',     N'Phạm Quốc',    'leader1@gmail.com',       '0912000004', N'Đà Nẵng', 'Male',   '1982-01-20', @pwd, 5000000, 1),
(5,  'leader2',    N'Linh',    N'Hoàng Thị',    'leader2@gmail.com',       '0912000005', N'TP.HCM',  'Female', '1991-09-12', @pwd, 3000000, 1),
(6,  'leader3',    N'Hải',     N'Võ Thanh',     'leader3@gmail.com',       '0912000006', N'Đà Nẵng', 'Male',   '1987-04-08', @pwd, 2000000, 1),
(7,  'referee1',   N'Khoa',    N'Đặng Trọng',   'referee1@gmail.com',      '0923000007', N'TP.HCM',  'Male',   '1980-06-30', @pwd, 500000, 1),
(8,  'referee2',   N'Ngọc',    N'Bùi Thị',      'referee2@gmail.com',      '0923000008', N'Hà Nội',  'Female', '1992-12-18', @pwd, 300000, 1),
(9,  'player1',    N'Quang',   N'Lê Trường',    'player1@gmail.com',       '0934000009', N'Hà Nội',  'Male',   '1995-02-14', @pwd, 1500000, 1),
(10, 'player2',    N'Mai',     N'Nguyễn Thị',   'player2@gmail.com',       '0934000010', N'TP.HCM',  'Female', '1998-05-28', @pwd, 800000, 1),
(11, 'player3',    N'Hùng',    N'Trần Quốc',    'player3@gmail.com',       '0934000011', N'TP.HCM',  'Male',   '1993-08-03', @pwd, 2200000, 1),
(12, 'player4',    N'Thảo',    N'Phạm Thanh',   'player4@gmail.com',       '0934000012', N'Hà Nội',  'Female', '2000-11-11', @pwd, 600000, 1),
(13, 'player5',    N'Nam',     N'Võ Hoàng',     'player5@gmail.com',       '0934000013', N'Đà Nẵng', 'Male',   '1997-03-25', @pwd, 1000000, 1),
(14, 'player6',    N'Lan',     N'Đỗ Thị',       'player6@gmail.com',       '0934000014', N'TP.HCM',  'Female', '1996-07-19', @pwd, 450000, 1),
(15, 'player7',    N'Sơn',     N'Nguyễn Hữu',   'player7@gmail.com',       '0934000015', N'Đà Nẵng', 'Male',   '1994-10-02', @pwd, 1800000, 1),
(16, 'player8',    N'Trang',   N'Lê Thị',       'player8@gmail.com',       '0934000016', N'TP.HCM',  'Female', '2001-01-30', @pwd, 200000, 1),
(17, 'player9',    N'Khải',    N'Trương Minh',   'player9@gmail.com',       '0934000017', N'Hà Nội',  'Male',   '1999-06-14', @pwd, 900000, 1),
(18, 'player10',   N'Vy',      N'Huỳnh Ngọc',   'player10@gmail.com',      '0934000018', N'TP.HCM',  'Female', '2002-04-07', @pwd, 350000, 1),
(19, 'player11',   N'Phong',   N'Đinh Văn',     'player11@gmail.com',      '0934000019', N'Hà Nội',  'Male',   '1990-08-22', @pwd, 1100000, 1),
(20, 'player12',   N'Hoa',     N'Phan Thị',     'player12@gmail.com',      '0934000020', N'TP.HCM',  'Female', '1998-12-25', @pwd, 750000, 1),
(21, 'player13',   N'Bình',    N'Lâm Văn',      'player13@gmail.com',      '0934000021', N'Cần Thơ', 'Male',   '1991-02-10', @pwd, 400000, 1),
(22, 'player14',   N'Yến',     N'Ngô Thị',      'player14@gmail.com',     '0934000022', N'Bình Dương','Female','1995-09-18', @pwd, 550000, 1),
(23, 'player15',   N'Long',    N'Phan Đức',     'player15@gmail.com',      '0934000023', N'Hải Phòng','Male',  '1992-11-25', @pwd, 680000, 1),
(24, 'player16',   N'Anh',     N'Hoàng Thị',    'player16@gmail.com',      '0934000024', N'Nha Trang','Female','1997-04-12', @pwd, 320000, 1);
SET IDENTITY_INSERT Users OFF;
GO

INSERT INTO User_Role (user_id, role_id) VALUES
(1,1),(2,2),(3,2),(4,3),(5,3),(6,3),(7,4),(8,4),
(9,5),(10,5),(11,5),(12,5),(13,5),(14,5),(15,5),(16,5),(17,5),(18,5),(19,5),(20,5),(21,5),(22,5),(23,5),(24,5);
GO

INSERT INTO Payment_Method (method_name, code, is_active, description) VALUES
('Bank Transfer', 'BANK', 1, N'Chuyển khoản ngân hàng'),
('Momo', 'MOMO', 1, N'Ví Momo'),
('VNPay', 'VNPAY', 1, N'VNPay');
GO

INSERT INTO Chess_Title (title_code, title_name, min_elo, sort_order) VALUES
('GM','Grandmaster',2500,1),('IM','International Master',2400,2),('FM','FIDE Master',2300,3),
('CM','Candidate Master',2200,4),('NM','National Master',2200,5),
('WGM','Woman Grandmaster',2300,6),('WIM','Woman International Master',2200,7),
('WFM','Woman FIDE Master',2100,8),('WCM','Woman Candidate Master',2000,9),
('None','Unrated',0,99);
GO

INSERT INTO Avatar_Frame (frame_name, frame_url, description, rarity, price) VALUES
('Default', '/frames/default.png', N'Khung mặc định', 'Common', 0);
GO

INSERT INTO User_Chess_Profile (user_id, title_id, elo_rating, highest_elo) VALUES
(9,4,2210,2250),(10,7,2205,2220),(11,3,2350,2380),(12,9,2020,2050),(13,5,2230,2260),(14,8,2110,2140),
(15,4,2240,2280),(16,10,1450,1500),(17,10,1680,1720),(18,10,1350,1400),(19,5,2200,2250),(20,10,1580,1620),
(21,10,1520,1560),(22,10,1650,1680),(23,10,1780,1820),(24,10,1420,1460);
GO

INSERT INTO User_Avatar_Frame (user_id, frame_id, is_equipped, obtained_by) VALUES
(9,1,1,'Default'),(10,1,1,'Default'),(11,1,1,'Default'),(12,1,1,'Default'),(13,1,1,'Default'),(14,1,1,'Default'),
(15,1,1,'Default'),(16,1,1,'Default'),(17,1,1,'Default'),(18,1,1,'Default'),(19,1,1,'Default'),(20,1,1,'Default'),
(21,1,1,'Default'),(22,1,1,'Default'),(23,1,1,'Default'),(24,1,1,'Default');
GO

/* ========================= 4. TOURNAMENTS ========================= */
/* 4a. 2 giải RoundRobin: Completed + Ongoing (full 8 players) */
/* 4b. 3 giải Upcoming: RoundRobin, KnockOut, Hybrid (full players) */

SET IDENTITY_INSERT Tournaments ON;
INSERT INTO Tournaments (tournament_id, tournament_name, description, location, format, max_player, min_player, entry_fee, prize_pool, status, registration_deadline, start_date, end_date, create_by) VALUES
-- Completed - RoundRobin 8 người
(1, N'Giải RoundRobin Completed 2026', N'Giải vòng tròn đã kết thúc.', N'Hà Nội', 'RoundRobin', 8, 4, 100000, 5000000, 'Completed', '2026-01-10 23:59:00', '2026-01-15 08:00:00', '2026-01-20 18:00:00', 4),
-- Ongoing - RoundRobin 8 người
(2, N'Giải RoundRobin Ongoing 2026', N'Giải vòng tròn đang diễn ra.', N'TP.HCM', 'RoundRobin', 8, 4, 100000, 5000000, 'Ongoing', '2026-02-10 23:59:00', '2026-02-15 08:00:00', '2026-02-25 18:00:00', 5),
-- Upcoming - RoundRobin 8 người
(3, N'Giải RoundRobin Upcoming 2026', N'Giải vòng tròn sắp diễn ra.', N'Đà Nẵng', 'RoundRobin', 8, 4, 100000, 5000000, 'Upcoming', '2026-04-15 23:59:00', '2026-04-20 08:00:00', '2026-04-25 18:00:00', 4),
-- Upcoming - KnockOut 8 người
(4, N'Giải KnockOut Upcoming 2026', N'Giải loại trực tiếp sắp diễn ra.', N'Hải Phòng', 'KnockOut', 8, 4, 150000, 6000000, 'Upcoming', '2026-05-10 23:59:00', '2026-05-15 09:00:00', '2026-05-20 18:00:00', 5),
-- Upcoming - Hybrid 16 người
(5, N'Giải Hybrid Upcoming 2026', N'Giải kết hợp vòng tròn + loại trực tiếp.', N'Bình Dương', 'Hybrid', 16, 8, 200000, 10000000, 'Upcoming', '2026-06-15 23:59:00', '2026-06-20 08:00:00', '2026-06-30 18:00:00', 6);
SET IDENTITY_INSERT Tournaments OFF;
GO

/* ========================= 5. PARTICIPANTS - FULL PLAYERS ========================= */
/* T1 Completed: 8 players (9-16) */
/* T2 Ongoing: 8 players (9-16) */
/* T3 Upcoming RR: 8 players (9-16) */
/* T4 Upcoming KO: 8 players (9-16) */
/* T5 Upcoming Hybrid: 16 players (9-24) */

SET IDENTITY_INSERT Participants ON;
INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date) VALUES
-- T1 Completed - 8 players
(1,1,9,'CM',1,'Active',1,'2026-01-12 10:00:00','2026-01-10 08:00:00'),
(2,1,10,'WIM',2,'Active',1,'2026-01-12 11:00:00','2026-01-10 09:00:00'),
(3,1,11,'FM',3,'Active',1,'2026-01-12 12:00:00','2026-01-10 10:00:00'),
(4,1,12,'WCM',4,'Active',1,'2026-01-12 13:00:00','2026-01-10 11:00:00'),
(5,1,13,'NM',5,'Active',1,'2026-01-12 14:00:00','2026-01-10 12:00:00'),
(6,1,14,'WFM',6,'Active',1,'2026-01-12 15:00:00','2026-01-10 13:00:00'),
(7,1,15,'CM',7,'Active',1,'2026-01-12 16:00:00','2026-01-10 14:00:00'),
(8,1,16,'Unrated',8,'Active',1,'2026-01-12 17:00:00','2026-01-10 15:00:00'),
-- T2 Ongoing - 8 players
(9,2,9,'CM',1,'Active',1,'2026-02-12 10:00:00','2026-02-10 08:00:00'),
(10,2,10,'WIM',2,'Active',1,'2026-02-12 11:00:00','2026-02-10 09:00:00'),
(11,2,11,'FM',3,'Active',1,'2026-02-12 12:00:00','2026-02-10 10:00:00'),
(12,2,12,'WCM',4,'Active',1,'2026-02-12 13:00:00','2026-02-10 11:00:00'),
(13,2,13,'NM',5,'Active',1,'2026-02-12 14:00:00','2026-02-10 12:00:00'),
(14,2,14,'WFM',6,'Active',1,'2026-02-12 15:00:00','2026-02-10 13:00:00'),
(15,2,15,'CM',7,'Active',1,'2026-02-12 16:00:00','2026-02-10 14:00:00'),
(16,2,16,'Unrated',8,'Active',1,'2026-02-12 17:00:00','2026-02-10 15:00:00'),
-- T3 Upcoming RR - 8 players
(17,3,9,'CM',1,'Active',1,'2026-04-10 10:00:00','2026-04-08 08:00:00'),
(18,3,10,'WIM',2,'Active',1,'2026-04-10 11:00:00','2026-04-08 09:00:00'),
(19,3,11,'FM',3,'Active',1,'2026-04-10 12:00:00','2026-04-08 10:00:00'),
(20,3,12,'WCM',4,'Active',1,'2026-04-10 13:00:00','2026-04-08 11:00:00'),
(21,3,13,'NM',5,'Active',1,'2026-04-10 14:00:00','2026-04-08 12:00:00'),
(22,3,14,'WFM',6,'Active',1,'2026-04-10 15:00:00','2026-04-08 13:00:00'),
(23,3,15,'CM',7,'Active',1,'2026-04-10 16:00:00','2026-04-08 14:00:00'),
(24,3,16,'Unrated',8,'Active',1,'2026-04-10 17:00:00','2026-04-08 15:00:00'),
-- T4 Upcoming KO - 8 players
(25,4,9,'CM',1,'Active',1,'2026-05-08 10:00:00','2026-05-06 08:00:00'),
(26,4,10,'WIM',2,'Active',1,'2026-05-08 11:00:00','2026-05-06 09:00:00'),
(27,4,11,'FM',3,'Active',1,'2026-05-08 12:00:00','2026-05-06 10:00:00'),
(28,4,12,'WCM',4,'Active',1,'2026-05-08 13:00:00','2026-05-06 11:00:00'),
(29,4,13,'NM',5,'Active',1,'2026-05-08 14:00:00','2026-05-06 12:00:00'),
(30,4,14,'WFM',6,'Active',1,'2026-05-08 15:00:00','2026-05-06 13:00:00'),
(31,4,15,'CM',7,'Active',1,'2026-05-08 16:00:00','2026-05-06 14:00:00'),
(32,4,16,'Unrated',8,'Active',1,'2026-05-08 17:00:00','2026-05-06 15:00:00'),
-- T5 Upcoming Hybrid - 16 players
(33,5,9,'CM',1,'Active',1,'2026-06-10 10:00:00','2026-06-08 08:00:00'),
(34,5,10,'WIM',2,'Active',1,'2026-06-10 11:00:00','2026-06-08 09:00:00'),
(35,5,11,'FM',3,'Active',1,'2026-06-10 12:00:00','2026-06-08 10:00:00'),
(36,5,12,'WCM',4,'Active',1,'2026-06-10 13:00:00','2026-06-08 11:00:00'),
(37,5,13,'NM',5,'Active',1,'2026-06-10 14:00:00','2026-06-08 12:00:00'),
(38,5,14,'WFM',6,'Active',1,'2026-06-10 15:00:00','2026-06-08 13:00:00'),
(39,5,15,'CM',7,'Active',1,'2026-06-10 16:00:00','2026-06-08 14:00:00'),
(40,5,16,'Unrated',8,'Active',1,'2026-06-10 17:00:00','2026-06-08 15:00:00'),
(41,5,17,'Unrated',9,'Active',1,'2026-06-10 18:00:00','2026-06-08 16:00:00'),
(42,5,18,'Unrated',10,'Active',1,'2026-06-10 19:00:00','2026-06-08 17:00:00'),
(43,5,19,'NM',11,'Active',1,'2026-06-11 10:00:00','2026-06-09 08:00:00'),
(44,5,20,'Unrated',12,'Active',1,'2026-06-11 11:00:00','2026-06-09 09:00:00'),
(45,5,21,'Unrated',13,'Active',1,'2026-06-11 12:00:00','2026-06-09 10:00:00'),
(46,5,22,'Unrated',14,'Active',1,'2026-06-11 13:00:00','2026-06-09 11:00:00'),
(47,5,23,'Unrated',15,'Active',1,'2026-06-11 14:00:00','2026-06-09 12:00:00'),
(48,5,24,'Unrated',16,'Active',1,'2026-06-11 15:00:00','2026-06-09 13:00:00');
SET IDENTITY_INSERT Participants OFF;
GO

/* ========================= 6. TOURNAMENT_REFEREE ========================= */
INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by) VALUES
(1,7,'Chief',4),(1,8,'Assistant',4),
(2,7,'Chief',5),(2,8,'Assistant',5),
(3,7,'Chief',4),(3,8,'Assistant',4),
(4,7,'Chief',5),(4,8,'Assistant',5),
(5,7,'Chief',6),(5,8,'Assistant',6);
GO

/* ========================= 7. TOURNAMENT_SETUP_STATE ========================= */
INSERT INTO Tournament_Setup_State (tournament_id, current_step, bracket_status, players_status, schedule_status, referees_status) VALUES
(1, 'COMPLETED', 'FINALIZED', 'FINALIZED', 'FINALIZED', 'FINALIZED'),
(2, 'COMPLETED', 'FINALIZED', 'FINALIZED', 'FINALIZED', 'FINALIZED'),
(3, 'REFEREE', 'FINALIZED', 'FINALIZED', 'FINALIZED', 'DRAFT'),
(4, 'REFEREE', 'FINALIZED', 'FINALIZED', 'FINALIZED', 'DRAFT'),
(5, 'REFEREE', 'FINALIZED', 'FINALIZED', 'FINALIZED', 'DRAFT');
GO

/* ========================= 8. BRACKET, ROUND, MATCHES (T1, T2) ========================= */
SET IDENTITY_INSERT Bracket ON;
INSERT INTO Bracket (bracket_id, bracket_name, tournament_id, type, status) VALUES
(1, N'Bảng chính', 1, 'RoundRobin', 'Completed'),
(2, N'Bảng chính', 2, 'RoundRobin', 'Ongoing');
SET IDENTITY_INSERT Bracket OFF;
GO

SET IDENTITY_INSERT Round ON;
INSERT INTO Round (round_id, bracket_id, tournament_id, name, round_index, start_time, end_time, is_completed) VALUES
(1,1,1,'Round 1',1,'2026-01-15 08:00:00','2026-01-15 12:00:00',1),
(2,1,1,'Round 2',2,'2026-01-16 08:00:00','2026-01-16 12:00:00',1),
(3,1,1,'Round 3',3,'2026-01-17 08:00:00','2026-01-17 12:00:00',1),
(4,1,1,'Round 4',4,'2026-01-18 08:00:00','2026-01-18 12:00:00',1),
(5,1,1,'Round 5',5,'2026-01-19 08:00:00','2026-01-19 12:00:00',1),
(6,2,2,'Round 1',1,'2026-02-15 08:00:00','2026-02-15 12:00:00',1),
(7,2,2,'Round 2',2,'2026-02-16 08:00:00','2026-02-16 12:00:00',0);
SET IDENTITY_INSERT Round OFF;
GO

SET IDENTITY_INSERT Matches ON;
/* Matches: player1_id, player2_id = cặp đấu (theo thứ tự ván 1 trắng/đen); result = player1|player2|draw|pending */
INSERT INTO Matches (match_id, tournament_id, round_id, group_id, board_number, player1_id, player2_id, player1_score, player2_score, winner_id, result, status, start_time, end_time) VALUES
-- T1 Round 1 (9-10: 1.5-0.5, 11-12: 0-2, 13-14: 1-1, 15-16: 1.5-0.5)
(1,1,1,NULL,1,9,10,1.5,0.5,9,'player1','Completed','2026-01-15 08:00:00','2026-01-15 09:00:00'),
(2,1,1,NULL,2,11,12,0,2,12,'player2','Completed','2026-01-15 08:00:00','2026-01-15 09:00:00'),
(3,1,1,NULL,3,13,14,1,1,NULL,'draw','Completed','2026-01-15 08:00:00','2026-01-15 09:00:00'),
(4,1,1,NULL,4,15,16,1.5,0.5,15,'player1','Completed','2026-01-15 08:00:00','2026-01-15 09:00:00'),
-- T1 Round 2
(5,1,2,NULL,1,10,11,0,2,11,'player2','Completed','2026-01-16 08:00:00','2026-01-16 09:00:00'),
(6,1,2,NULL,2,12,13,1.5,0.5,12,'player1','Completed','2026-01-16 08:00:00','2026-01-16 09:00:00'),
(7,1,2,NULL,3,14,15,1,1,NULL,'draw','Completed','2026-01-16 08:00:00','2026-01-16 09:00:00'),
(8,1,2,NULL,4,16,9,0,2,9,'player2','Completed','2026-01-16 08:00:00','2026-01-16 09:00:00'),
-- T2 Round 1
(9,2,6,NULL,1,9,10,1.5,0.5,9,'player1','Completed','2026-02-15 08:00:00','2026-02-15 09:00:00'),
(10,2,6,NULL,2,11,12,0,2,12,'player2','Completed','2026-02-15 08:00:00','2026-02-15 09:00:00'),
(11,2,6,NULL,3,13,14,1,1,NULL,'draw','Completed','2026-02-15 08:00:00','2026-02-15 09:00:00'),
(12,2,6,NULL,4,15,16,1.5,0.5,15,'player1','Completed','2026-02-15 08:00:00','2026-02-15 09:00:00'),
-- T2 Round 2 (Scheduled)
(13,2,7,NULL,1,10,11,0,0,NULL,'pending','Scheduled','2026-02-16 08:00:00',NULL),
(14,2,7,NULL,2,12,13,0,0,NULL,'pending','Scheduled','2026-02-16 08:00:00',NULL),
(15,2,7,NULL,3,14,15,0,0,NULL,'pending','Scheduled','2026-02-16 08:00:00',NULL),
(16,2,7,NULL,4,16,9,0,0,NULL,'pending','Scheduled','2026-02-16 08:00:00',NULL);
SET IDENTITY_INSERT Matches OFF;
GO

INSERT INTO Match_Referee (match_id, referee_id, role) VALUES
(1,7,'Main'),(2,8,'Main'),(3,7,'Main'),(4,8,'Main'),(5,7,'Main'),(6,8,'Main'),(7,7,'Main'),(8,8,'Main'),
(9,7,'Main'),(10,8,'Main'),(11,7,'Main'),(12,8,'Main'),(13,7,'Main'),(14,8,'Main'),(15,7,'Main'),(16,8,'Main');
GO

/* Mini_matches: T1/T2 Round Robin – 2 ván/trận (ván 2 đổi màu). result: 1-0|0-1|1/2-1/2|* ; NULL → dùng '*' cho Scheduled. */
INSERT INTO Mini_matches (match_id, game_number, is_tiebreak, white_player_id, black_player_id, result, termination, status, start_time, end_time) VALUES
-- T1 Round 1
(1,1,0,9,10,'1-0',NULL,'Completed','2026-01-15 08:00:00','2026-01-15 08:30:00'),
(1,2,0,10,9,'1/2-1/2',NULL,'Completed','2026-01-15 08:30:00','2026-01-15 09:00:00'),
(2,1,0,11,12,'0-1',NULL,'Completed','2026-01-15 08:00:00','2026-01-15 08:30:00'),
(2,2,0,12,11,'0-1',NULL,'Completed','2026-01-15 08:30:00','2026-01-15 09:00:00'),
(3,1,0,13,14,'1/2-1/2',NULL,'Completed','2026-01-15 08:00:00','2026-01-15 08:30:00'),
(3,2,0,14,13,'1/2-1/2',NULL,'Completed','2026-01-15 08:30:00','2026-01-15 09:00:00'),
(4,1,0,15,16,'1-0',NULL,'Completed','2026-01-15 08:00:00','2026-01-15 08:30:00'),
(4,2,0,16,15,'1/2-1/2',NULL,'Completed','2026-01-15 08:30:00','2026-01-15 09:00:00'),
-- T1 Round 2
(5,1,0,10,11,'0-1',NULL,'Completed','2026-01-16 08:00:00','2026-01-16 08:30:00'),
(5,2,0,11,10,'0-1',NULL,'Completed','2026-01-16 08:30:00','2026-01-16 09:00:00'),
(6,1,0,12,13,'1-0',NULL,'Completed','2026-01-16 08:00:00','2026-01-16 08:30:00'),
(6,2,0,13,12,'1/2-1/2',NULL,'Completed','2026-01-16 08:30:00','2026-01-16 09:00:00'),
(7,1,0,14,15,'1/2-1/2',NULL,'Completed','2026-01-16 08:00:00','2026-01-16 08:30:00'),
(7,2,0,15,14,'1/2-1/2',NULL,'Completed','2026-01-16 08:30:00','2026-01-16 09:00:00'),
(8,1,0,16,9,'0-1',NULL,'Completed','2026-01-16 08:00:00','2026-01-16 08:30:00'),
(8,2,0,9,16,'0-1',NULL,'Completed','2026-01-16 08:30:00','2026-01-16 09:00:00'),
-- T2 Round 1
(9,1,0,9,10,'1-0',NULL,'Completed','2026-02-15 08:00:00','2026-02-15 08:30:00'),
(9,2,0,10,9,'1/2-1/2',NULL,'Completed','2026-02-15 08:30:00','2026-02-15 09:00:00'),
(10,1,0,11,12,'0-1',NULL,'Completed','2026-02-15 08:00:00','2026-02-15 08:30:00'),
(10,2,0,12,11,'0-1',NULL,'Completed','2026-02-15 08:30:00','2026-02-15 09:00:00'),
(11,1,0,13,14,'1/2-1/2',NULL,'Completed','2026-02-15 08:00:00','2026-02-15 08:30:00'),
(11,2,0,14,13,'1/2-1/2',NULL,'Completed','2026-02-15 08:30:00','2026-02-15 09:00:00'),
(12,1,0,15,16,'1-0',NULL,'Completed','2026-02-15 08:00:00','2026-02-15 08:30:00'),
(12,2,0,16,15,'1/2-1/2',NULL,'Completed','2026-02-15 08:30:00','2026-02-15 09:00:00'),
-- T2 Round 2 (Scheduled): result = '*' chưa có kết quả
(13,1,0,10,11,'*',NULL,'Scheduled','2026-02-16 08:00:00',NULL),
(13,2,0,11,10,'*',NULL,'Scheduled','2026-02-16 08:30:00',NULL),
(14,1,0,12,13,'*',NULL,'Scheduled','2026-02-16 08:00:00',NULL),
(14,2,0,13,12,'*',NULL,'Scheduled','2026-02-16 08:30:00',NULL),
(15,1,0,14,15,'*',NULL,'Scheduled','2026-02-16 08:00:00',NULL),
(15,2,0,15,14,'*',NULL,'Scheduled','2026-02-16 08:30:00',NULL),
(16,1,0,16,9,'*',NULL,'Scheduled','2026-02-16 08:00:00',NULL),
(16,2,0,9,16,'*',NULL,'Scheduled','2026-02-16 08:30:00',NULL);
GO

INSERT INTO Standing (tournament_id, user_id, matches_played, won, drawn, lost, point, current_rank) VALUES
(1,9,2,2,0,0,2.0,1),(1,11,2,2,0,0,2.0,1),(1,13,2,0,2,0,1.0,3),(1,15,2,1,1,0,1.5,2),(1,10,2,0,0,2,0.0,5),(1,12,2,1,0,1,1.0,4),(1,14,2,0,1,1,0.5,6),(1,16,2,0,0,2,0.0,7),
(2,9,1,1,0,0,1.0,NULL),(2,11,1,0,0,1,0.0,NULL),(2,13,1,0,1,0,0.5,NULL),(2,15,1,1,0,0,1.0,NULL),(2,10,1,0,0,1,0.0,NULL),(2,12,1,1,0,0,1.0,NULL),(2,14,1,0,1,0,0.5,NULL),(2,16,1,0,0,1,0.0,NULL);
GO

INSERT INTO Prize_Template (tournament_id, rank_position, percentage, label) VALUES
(1,1,50,'Champion'),(1,2,30,'Runner-up'),(1,3,20,'3rd'),
(2,1,50,'Champion'),(2,2,30,'Runner-up'),(2,3,20,'3rd'),
(3,1,50,'Champion'),(3,2,30,'Runner-up'),(3,3,20,'3rd'),
(4,1,50,'Champion'),(4,2,30,'Runner-up'),(4,3,10,'3rd'),(4,4,10,'4th'),
(5,1,50,'Champion'),(5,2,30,'Runner-up'),(5,3,20,'3rd');
GO

/* ========================= 5b. SEED: Giải KnockOut đang diễn ra (T6) – test Referee Matches ========================= */
SET IDENTITY_INSERT Tournaments ON;
INSERT INTO Tournaments (tournament_id, tournament_name, description, location, format, categories, max_player, min_player, entry_fee, prize_pool, status, registration_deadline, start_date, end_date, create_by) VALUES
(6, N'Giải KnockOut Đang diễn ra 2026', N'Giải loại trực tiếp đang diễn ra để test điều hành trận.', N'Hà Nội', 'KnockOut', 'Open', 8, 4, 100000, 4000000, 'Ongoing', '2026-03-01 23:59:00', '2026-03-05 08:00:00', '2026-03-15 18:00:00', 4);
SET IDENTITY_INSERT Tournaments OFF;
GO

SET IDENTITY_INSERT Participants ON;
INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date) VALUES
(49,6,9,'CM',1,'Active',1,'2026-03-02 10:00:00','2026-03-01 08:00:00'),
(50,6,10,'WIM',2,'Active',1,'2026-03-02 11:00:00','2026-03-01 09:00:00'),
(51,6,11,'FM',3,'Active',1,'2026-03-02 12:00:00','2026-03-01 10:00:00'),
(52,6,12,'WCM',4,'Active',1,'2026-03-02 13:00:00','2026-03-01 11:00:00'),
(53,6,13,'NM',5,'Active',1,'2026-03-02 14:00:00','2026-03-01 12:00:00'),
(54,6,14,'WFM',6,'Active',1,'2026-03-02 15:00:00','2026-03-01 13:00:00'),
(55,6,15,'CM',7,'Active',1,'2026-03-02 16:00:00','2026-03-01 14:00:00'),
(56,6,16,'Unrated',8,'Active',1,'2026-03-02 17:00:00','2026-03-01 15:00:00');
SET IDENTITY_INSERT Participants OFF;
GO

INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by) VALUES
(6,7,'Chief',4),(6,8,'Assistant',4);
GO

INSERT INTO Tournament_Setup_State (tournament_id, current_step, bracket_status, players_status, schedule_status, referees_status) VALUES
(6, 'COMPLETED', 'FINALIZED', 'FINALIZED', 'FINALIZED', 'FINALIZED');
GO

SET IDENTITY_INSERT Bracket ON;
INSERT INTO Bracket (bracket_id, bracket_name, tournament_id, type, status) VALUES
(3, N'KnockOut Bracket', 6, 'KnockOut', 'Ongoing');
SET IDENTITY_INSERT Bracket OFF;
GO

SET IDENTITY_INSERT Round ON;
INSERT INTO Round (round_id, bracket_id, tournament_id, name, round_index, start_time, end_time, is_completed) VALUES
(8, 3, 6, N'Tứ kết', 1, '2026-03-05 08:00:00', '2026-03-05 12:00:00', 1),
(9, 3, 6, N'Bán kết', 2, '2026-03-08 08:00:00', '2026-03-08 12:00:00', 0),
(10, 3, 6, N'Chung kết', 3, '2026-03-12 09:00:00', '2026-03-12 14:00:00', 0);
SET IDENTITY_INSERT Round OFF;
GO

SET IDENTITY_INSERT Matches ON;
INSERT INTO Matches (match_id, tournament_id, round_id, group_id, board_number, player1_id, player2_id, player1_score, player2_score, winner_id, result, status, start_time, end_time) VALUES
(17, 6, 8, NULL, 1, 9, 10, 1.5, 0.5, 9, 'player1', 'Completed', '2026-03-05 08:00:00', '2026-03-05 09:00:00'),
(18, 6, 8, NULL, 2, 11, 12, 0, 2, 12, 'player2', 'Completed', '2026-03-05 08:30:00', '2026-03-05 09:30:00'),
(19, 6, 8, NULL, 3, 13, 14, 0, 0, NULL, 'pending', 'Scheduled', '2026-03-05 09:00:00', NULL),
(20, 6, 8, NULL, 4, 15, 16, 0, 0, NULL, 'pending', 'Scheduled', '2026-03-05 09:30:00', NULL),
(21, 6, 9, NULL, 1, 9, 12, 0, 0, NULL, 'pending', 'Scheduled', '2026-03-08 08:00:00', NULL),
(22, 6, 9, NULL, 2, 13, 15, 0, 0, NULL, 'pending', 'Scheduled', '2026-03-08 08:30:00', NULL),
(23, 6, 10, NULL, 1, 9, 13, 0, 0, NULL, 'pending', 'Scheduled', '2026-03-12 09:00:00', NULL);
SET IDENTITY_INSERT Matches OFF;
GO

INSERT INTO Match_Referee (match_id, referee_id, role) VALUES
(17, 7, 'Main'),(18, 8, 'Main'),(19, 7, 'Main'),(20, 8, 'Main'),
(21, 7, 'Main'),(22, 8, 'Main'),(23, 7, 'Main');
GO

/* Mini_matches: T6 KnockOut – 2 ván/trận (ván 1 + ván 2 đổi màu). Trận 17–18 đã có kết quả; 19–23 Scheduled (result='*'). */
INSERT INTO Mini_matches (match_id, game_number, is_tiebreak, white_player_id, black_player_id, result, termination, status, start_time, end_time) VALUES
-- Match 17 (9 vs 10): ván 1 9 trắng 10 đen 1-0, ván 2 10 trắng 9 đen hòa → 9 thắng 1.5-0.5
(17,1,0,9,10,'1-0',NULL,'Completed','2026-03-05 08:00:00','2026-03-05 08:30:00'),
(17,2,0,10,9,'1/2-1/2',NULL,'Completed','2026-03-05 08:30:00','2026-03-05 09:00:00'),
-- Match 18 (11 vs 12): ván 1 và 2 đều 12 thắng → 12 thắng 2-0
(18,1,0,11,12,'0-1',NULL,'Completed','2026-03-05 08:30:00','2026-03-05 09:00:00'),
(18,2,0,12,11,'0-1',NULL,'Completed','2026-03-05 09:00:00','2026-03-05 09:30:00'),
-- Match 19–23: Scheduled
(19,1,0,13,14,'*',NULL,'Scheduled','2026-03-05 09:00:00',NULL),
(19,2,0,14,13,'*',NULL,'Scheduled','2026-03-05 09:30:00',NULL),
(20,1,0,15,16,'*',NULL,'Scheduled','2026-03-05 09:30:00',NULL),
(20,2,0,16,15,'*',NULL,'Scheduled','2026-03-05 10:00:00',NULL),
(21,1,0,9,12,'*',NULL,'Scheduled','2026-03-08 08:00:00',NULL),
(21,2,0,12,9,'*',NULL,'Scheduled','2026-03-08 08:30:00',NULL),
(22,1,0,13,15,'*',NULL,'Scheduled','2026-03-08 08:30:00',NULL),
(22,2,0,15,13,'*',NULL,'Scheduled','2026-03-08 09:00:00',NULL),
(23,1,0,9,13,'*',NULL,'Scheduled','2026-03-12 09:00:00',NULL),
(23,2,0,13,9,'*',NULL,'Scheduled','2026-03-12 09:30:00',NULL);
GO

INSERT INTO Prize_Template (tournament_id, rank_position, percentage, label) VALUES
(6,1,60,'Vô địch'),(6,2,30,'Á quân'),(6,3,10,'Hạng ba');
GO

/* ========================= 6. BLOG POSTS ========================= */
INSERT INTO Blog_Post (title, summary, content, thumbnail_url, author_id, categories, status, views, publish_at, create_at) VALUES
(N'Khai mạc giải Hanoi Open Chess 2026',
 N'Giải cờ vua mở rộng Hà Nội lần thứ 5 chính thức khai mạc với sự tham gia của nhiều kỳ thủ hàng đầu.',
 N'Sáng ngày 15/01/2026, giải cờ vua mở rộng Hà Nội lần thứ 5 đã chính thức khai mạc tại Cung Văn hóa Hữu nghị Việt Xô. Giải thu hút sự tham gia của 5 kỳ thủ hàng đầu miền Bắc với tổng giải thưởng lên đến 10 triệu đồng. Giải được tổ chức theo thể thức Round Robin, mỗi kỳ thủ sẽ đấu với tất cả các đối thủ còn lại. Thời gian thi đấu: 90 phút + 30 giây/nước theo luật FIDE.',
 '/blogs/hanoi-open-2026.jpg', 2, 'News', 'Public', 1250, '2026-01-15 07:00:00', '2026-01-14 22:00:00'),
(N'FM Trần Quốc Hùng vô địch Hanoi Open 2026',
 N'FM Hùng giành chức vô địch với thành tích toàn thắng 4/4 ván.',
 N'Sau 5 ngày tranh tài căng thẳng, FM Trần Quốc Hùng đã xuất sắc giành chức vô địch Hanoi Open Chess 2026 với thành tích ấn tượng 4 thắng, 0 hòa, 0 thua. Ở vị trí á quân là CM Lê Trường Quang với 3 điểm. NM Võ Hoàng Nam giành hạng ba với 2 điểm. FM Hùng cho biết: "Tôi rất vui vì đã thi đấu tốt trong suốt giải. Các ván đấu đều rất kịch tính."',
 '/blogs/hanoi-open-winner.jpg', 2, 'News', 'Public', 2340, '2026-01-20 19:00:00', '2026-01-20 18:30:00'),
(N'10 mẹo cải thiện chiến thuật cờ vua cho người mới',
 N'Những mẹo đơn giản nhưng hiệu quả giúp bạn nâng cao trình độ cờ vua.',
 N'1. Luôn kiểm soát trung tâm bàn cờ. 2. Phát triển quân nhanh trong khai cuộc. 3. Bảo vệ Vua bằng cách nhập thành sớm. 4. Không di chuyển cùng một quân nhiều lần trong khai cuộc. 5. Đừng đưa Hậu ra sớm. 6. Kết nối hai Xe. 7. Tính toán trước ít nhất 3 nước. 8. Học các motif chiến thuật: ghim quân, đòn đôi, phát hiện. 9. Phân tích ván đấu sau khi kết thúc. 10. Luyện tập giải puzzle mỗi ngày.',
 '/blogs/chess-tips.jpg', 3, 'Guide', 'Public', 5680, '2026-01-25 10:00:00', '2026-01-24 16:00:00'),
(N'Chiến lược tấn công cánh Vua trong cờ vua',
 N'Phân tích chi tiết các phương pháp tấn công cánh Vua phổ biến nhất.',
 N'Tấn công cánh Vua là một trong những chủ đề quan trọng nhất trong cờ vua trung cuộc. Bài viết này sẽ phân tích các phương pháp tấn công phổ biến: 1) Hy sinh Mã ở f7/f2, 2) Tấn công Hy Lạp (Bxh7+), 3) Tấn công tốt chung (g4-g5-g6), 4) Mở cột h cho Xe. Mỗi phương pháp đều có ví dụ minh họa từ các ván đấu của các Đại Kiện Tướng.',
 '/blogs/kingside-attack.jpg', 4, 'Strategy', 'Public', 3420, '2026-02-01 08:00:00', '2026-01-30 20:00:00'),
(N'Thông báo: Saigon Blitz Championship đang diễn ra!',
 N'Giải cờ chớp nhoáng TP.HCM bước vào giai đoạn knock-out hấp dẫn.',
 N'Saigon Blitz Championship 2026 đã chính thức bước vào vòng tứ kết với 8 kỳ thủ xuất sắc nhất. Các trận đấu diễn ra vô cùng kịch tính với thời gian thi đấu 3 phút + 2 giây/nước. Kết quả vòng tứ kết: CM Quang thắng Hoa, FM Hùng thắng WFM Lan, CM Sơn thắng WIM Mai, NM Nam thắng WCM Thảo. Vòng bán kết sẽ diễn ra vào ngày 18/02.',
 '/blogs/saigon-blitz-qf.jpg', 3, 'News', 'Public', 1890, '2026-02-16 10:00:00', '2026-02-16 09:00:00'),
(N'Hướng dẫn tàn cuộc Vua và Tốt cơ bản',
 N'Nắm vững tàn cuộc Vua Tốt - nền tảng quan trọng nhất của cờ vua.',
 N'Tàn cuộc Vua và Tốt là nền tảng của mọi tàn cuộc cờ vua. Bài viết trình bày: Quy tắc ô vuông, Opposition (đối Vua), Triangulation, Tốt thông xa, Zugzwang. Hiểu rõ các kỹ thuật này sẽ giúp bạn chuyển hóa lợi thế thành chiến thắng.',
 '/blogs/king-pawn-endgame.jpg', 4, 'Guide', 'Draft', 0, NULL, '2026-02-18 14:00:00');
GO

/* ========================= VERIFICATION ========================= */
PRINT N'';
PRINT N'=== CTMS DATABASE CREATED SUCCESSFULLY ===';
PRINT N'';
PRINT N'--- Summary ---';
SELECT 'Users' AS [Table], COUNT(*) AS [Rows] FROM Users
UNION ALL SELECT 'Tournaments', COUNT(*) FROM Tournaments
UNION ALL SELECT 'Participants', COUNT(*) FROM Participants
UNION ALL SELECT 'Tournament_Setup_State', COUNT(*) FROM Tournament_Setup_State
UNION ALL SELECT 'Blog_Post', COUNT(*) FROM Blog_Post;
PRINT N'';
PRINT N'--- Tournaments by status ---';
SELECT status, format, COUNT(*) AS cnt FROM Tournaments GROUP BY status, format ORDER BY status, format;
PRINT N'';
PRINT N'--- Login: admin@ctms.vn / 123456 ---';
PRINT N'--- Leaders: leader1@gmail.com, leader2@gmail.com, leader3@gmail.com ---';
PRINT N'--- Referees: referee1@gmail.com, referee2@gmail.com ---';
PRINT N'--- Players: player1@gmail.com ... player16@gmail.com ---';
GO

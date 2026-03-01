<<<<<<< HEAD
=======
create database SWP391

use SWP391
>>>>>>> Dung
/* =====================================================================
   SWP391 - CHESS TOURNAMENT MANAGEMENT SYSTEM (CTMS)
   Database Schema v2.1

   Nguyen tac:
     - GIU NGUYEN tat ca bang hien tai (Users, RBAC, Participants, 
       Bracket, Round, Matches, Standing, Report, Feedback,
       Blog_Post, Notification, Payment, password_reset_otp)
     - CHI CHINH bang Tournaments (them tournament_image, rules)
     - THEM bang MOI cho cac tinh nang bo sung

   Thay doi:
     [Chinh] Tournaments         + tournament_image, rules
     [Moi]   Blog_Image          - Anh cho noi dung blog
     [Moi]   Avatar_Frame        - Danh sach khung avatar
     [Moi]   User_Avatar_Frame   - User dang dung khung nao
     [Moi]   Chess_Title         - Danh sach cap bac co thu
     [Moi]   User_Chess_Profile  - Elo + title cua tung nguoi choi
     [Moi]   Prize_Template      - Mau chia thuong top 1,2,3
     [Moi]   Prize_Distribution  - Thuc te chia thuong
     [Moi]   Payment_Transaction - Lich su dong tien
     [Moi]   Match_PGN           - Lich su van co

   Fixes ky thuat:
     - IDENTITY cho Bracket, Round, Matches, Notification, Permission
     - snake_case thong nhat (Payment tables)
     - Fix typo creat_at -> create_at (Report)
     - Fix typo created_at -> create_at (Tournament_Approval_Log)
     - CHECK constraints cho Matches, Bracket, Report, Feedback, Notification
     - ON DELETE CASCADE cho Matches, Standing, Bracket -> Tournaments
   ===================================================================== */


/* =========================
   USERS (GIU NGUYEN)
   ========================= */
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

/* =========================
   ROLES & PERMISSIONS (GIU NGUYEN cau truc, them IDENTITY cho Permission)
   ========================= */
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

/* =========================
   TOURNAMENTS (CHINH: them tournament_image + rules)
   ========================= */
CREATE TABLE Tournaments (
    tournament_id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_name NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    tournament_image NVARCHAR(500),             -- Anh dai dien / banner giai dau
    rules NVARCHAR(MAX),                        -- Luat thi dau (time control, tie-break, ...)
    location NVARCHAR(200),
    format NVARCHAR(20) NOT NULL
        CHECK (format IN ('RoundRobin','KnockOut','Hybrid')),
    categories NVARCHAR(50) NOT NULL,
    max_player INT,
    min_player INT,
    entry_fee DECIMAL(18,2) DEFAULT 0,
    prize_pool DECIMAL(18,2) DEFAULT 0,
    status NVARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending','Rejected','Delayed','Ongoing','Completed','Cancelled')),
    registration_deadline DATETIME,
    start_date DATETIME,
    end_date DATETIME,
    create_by INT NOT NULL,
    create_at DATETIME DEFAULT GETDATE(),
    notes NVARCHAR(MAX),
    FOREIGN KEY (create_by) REFERENCES Users(user_id)
);
GO

/* =========================
<<<<<<< HEAD
=======
   TOURNAMENT IMAGES (NEW)
   ========================= */
CREATE TABLE Tournament_Images (
    image_id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    image_url NVARCHAR(500) NOT NULL,
    display_order INT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE
);
GO

/* =========================
>>>>>>> Dung
   TOURNAMENT STAFF & REFEREE (GIU NGUYEN, fix created_at -> create_at)
   ========================= */
CREATE TABLE Tournament_Staff (
    tournament_id INT,
    staff_id INT,
    staff_role NVARCHAR(30)
        CHECK (staff_role IN ('Manager','Approver','Support')),
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
    referee_role NVARCHAR(30)
        CHECK (referee_role IN ('Chief','Assistant')),
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
    action NVARCHAR(30)
        CHECK (action IN ('Approve','Reject','Delay','Start','Complete','Cancel')),
    from_status NVARCHAR(20),
    to_status NVARCHAR(20)
        CHECK (to_status IN ('Pending','Rejected','Delayed','Ongoing','Completed','Cancelled')),
    note NVARCHAR(500),
    create_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES Users(user_id)
);
GO

/* =========================
   PARTICIPANTS (GIU NGUYEN)
   ========================= */
CREATE TABLE Participants (
    participant_id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    user_id INT NOT NULL,
    title_at_registration NVARCHAR(20),
    seed INT,
    status NVARCHAR(20) DEFAULT 'Active'
        CHECK (status IN ('Active','Withdrawn','Disqualified')),
    is_paid BIT DEFAULT 0,
    payment_date DATETIME,
    registration_date DATETIME DEFAULT GETDATE(),
    notes NVARCHAR(MAX),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    CONSTRAINT UQ_Participant UNIQUE (tournament_id, user_id)
);
GO

/* =========================
   BRACKET / ROUND / MATCH (them IDENTITY + CHECK + CASCADE)
   ========================= */
CREATE TABLE Bracket (
    bracket_id INT IDENTITY(1,1) PRIMARY KEY,
    bracket_name NVARCHAR(50),
    tournament_id INT,
    type NVARCHAR(20) NOT NULL
        CHECK (type IN ('RoundRobin','KnockOut','Swiss')),
    status NVARCHAR(20) DEFAULT 'Pending'
        CHECK (status IN ('Pending','Ongoing','Completed')),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE
);

CREATE TABLE Round (
    round_id INT IDENTITY(1,1) PRIMARY KEY,
    bracket_id INT,
    tournament_id INT NOT NULL,
    name NVARCHAR(50) NOT NULL,
    round_index INT NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    is_completed BIT DEFAULT 0,
    FOREIGN KEY (bracket_id) REFERENCES Bracket(bracket_id),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE
);

CREATE TABLE Matches (
    match_id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    round_id INT,
    board_number INT,
    white_player_id INT,
    black_player_id INT,
    result NVARCHAR(50)
        CHECK (result IN ('1-0','0-1','1/2-1/2','*','forfeit-w','forfeit-b')),
    termination NVARCHAR(50)
        CHECK (termination IN ('Checkmate','Resignation','Timeout','Stalemate','Draw','Forfeit','Adjudication')),
    status NVARCHAR(20) DEFAULT 'Scheduled'
        CHECK (status IN ('Scheduled','Ongoing','Completed','Cancelled','Postponed')),
    start_time DATETIME,
    end_time DATETIME,
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (round_id) REFERENCES Round(round_id),
    FOREIGN KEY (white_player_id) REFERENCES Users(user_id),
    FOREIGN KEY (black_player_id) REFERENCES Users(user_id),
    CHECK (white_player_id <> black_player_id)
);

CREATE TABLE Match_Referee (
    match_id INT,
    referee_id INT,
    role NVARCHAR(30) DEFAULT 'Main'
        CHECK (role IN ('Main','Assistant')),
    assigned_at DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (match_id, referee_id),
    FOREIGN KEY (match_id) REFERENCES Matches(match_id) ON DELETE CASCADE,
    FOREIGN KEY (referee_id) REFERENCES Users(user_id)
);

/* Luu lich su van co (PGN) */
CREATE TABLE Match_PGN (
    match_id INT PRIMARY KEY,
    pgn_text NVARCHAR(MAX),
    fen_final NVARCHAR(200),
    total_moves INT,
    duration_seconds INT,
    FOREIGN KEY (match_id) REFERENCES Matches(match_id) ON DELETE CASCADE
);
GO

/* =========================
   STANDING (them CASCADE)
   ========================= */
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

/* =========================
   REPORT & FEEDBACK (fix typo, them CHECK)
   ========================= */
CREATE TABLE Report (
    report_id INT IDENTITY(1,1) PRIMARY KEY,
    reporter_id INT,
    accused_id INT,
    match_id INT,
    description NVARCHAR(500) NOT NULL,
    evidence_url NVARCHAR(500) NOT NULL,
    type NVARCHAR(100) NOT NULL
        CHECK (type IN ('Cheating','Misconduct','TechnicalIssue','Other')),
    status NVARCHAR(50) DEFAULT 'Pending'
        CHECK (status IN ('Pending','Investigating','Resolved','Dismissed')),
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
    status NVARCHAR(30) DEFAULT 'pending'
        CHECK (status IN ('pending','approved','rejected')),
    reply NVARCHAR(500),
    create_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES Matches(match_id)
);
GO

/* =========================
   BLOG & NOTIFICATION (GIU NGUYEN + them Blog_Image + IDENTITY cho Notification)
   ========================= */
CREATE TABLE Blog_Post (
    blog_post_id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    summary NVARCHAR(500),
    content NVARCHAR(MAX),
    thumbnail_url NVARCHAR(500),
    author_id INT NOT NULL,
    categories NVARCHAR(50)
        CHECK (categories IN ('Strategy','News','Guide')),
    status NVARCHAR(20) DEFAULT 'Draft'
        CHECK (status IN ('Draft','Public','Private')),
    views INT DEFAULT 0,
    publish_at DATETIME,
    create_at DATETIME DEFAULT GETDATE(),
    update_at DATETIME,
    FOREIGN KEY (author_id) REFERENCES Users(user_id)
);

/* [MOI] Anh noi dung blog — nhieu anh / 1 bai viet */
CREATE TABLE Blog_Image (
    image_id INT IDENTITY(1,1) PRIMARY KEY,
    blog_post_id INT NOT NULL,
    image_url NVARCHAR(500) NOT NULL,
    caption NVARCHAR(200),
    sort_order INT DEFAULT 0,
    create_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (blog_post_id) REFERENCES Blog_Post(blog_post_id) ON DELETE CASCADE
);

CREATE TABLE Notification (
    notification_id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(100) NOT NULL,
    message NVARCHAR(MAX),
    type NVARCHAR(30)
        CHECK (type IN ('System','Tournament','Match','Payment','Report','General')),
    action_url NVARCHAR(500),
    is_read BIT DEFAULT 0,
    create_at DATETIME DEFAULT GETDATE(),
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);
GO

/* =========================
   PAYMENT (thong nhat snake_case)
   ========================= */
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
    status VARCHAR(20) DEFAULT 'Pending'
        CHECK (status IN ('Pending','Success','Failed','Cancelled')),
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
    status VARCHAR(20) DEFAULT 'Pending'
        CHECK (status IN ('Pending','Approved','Rejected','Completed')),
    rejection_reason NVARCHAR(MAX),
    approved_by INT,
    approved_at DATETIME,
    bank_transfer_ref VARCHAR(100),
    create_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (approved_by) REFERENCES Users(user_id)
);

/* [MOI] Lich su giao dich */
CREATE TABLE Payment_Transaction (
    transaction_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    tournament_id INT NULL,
    type NVARCHAR(30) NOT NULL
        CHECK (type IN ('EntryFee','Prize','Refund','Deposit','Withdrawal')),
    amount DECIMAL(18,2) NOT NULL,
    balance_after DECIMAL(18,2),
    description NVARCHAR(500),
    reference_id INT NULL,
    create_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id)
);
GO

/* ==========================================================
   [MOI] KHUNG AVATAR
   Avatar_Frame       = danh sach khung co the co
   User_Avatar_Frame  = user so huu + dang equip khung nao
   KHONG sua bang Users
   ========================================================== */
CREATE TABLE Avatar_Frame (
    frame_id INT IDENTITY(1,1) PRIMARY KEY,
    frame_name NVARCHAR(100) NOT NULL,
    frame_url NVARCHAR(500) NOT NULL,
    description NVARCHAR(200),
    rarity NVARCHAR(20) DEFAULT 'Common'
        CHECK (rarity IN ('Common','Rare','Epic','Legendary')),
    unlock_condition NVARCHAR(200),
    price DECIMAL(18,2) DEFAULT 0,
    is_active BIT DEFAULT 1,
    create_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE User_Avatar_Frame (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    frame_id INT NOT NULL,
    is_equipped BIT DEFAULT 0,                  -- 1 = dang dung, chi 1 frame duoc equip
    obtained_at DATETIME DEFAULT GETDATE(),
    obtained_by NVARCHAR(30) DEFAULT 'Reward'
        CHECK (obtained_by IN ('Reward','Purchase','Event','Default')),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (frame_id) REFERENCES Avatar_Frame(frame_id) ON DELETE CASCADE,
    CONSTRAINT UQ_User_Frame UNIQUE (user_id, frame_id)
);
GO

/* ==========================================================
   [MOI] CAP BAC CO THU + ELO RATING
   Chess_Title         = danh sach title (GM, IM, FM, ...)
   User_Chess_Profile  = elo + title cua tung player
   KHONG sua bang Users
   ========================================================== */
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

/* ==========================================================
   [MOI] CHIA THUONG GIAI DAU
   Prize_Template     = leader dinh san % cho top 1,2,3 khi tao giai
   Prize_Distribution = thuc te ai nhan bao nhieu sau khi giai ket thuc
   ========================================================== */
CREATE TABLE Prize_Template (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    rank_position INT NOT NULL,                 -- 1 = vo dich, 2 = a quan, 3 = hang ba, ...
    percentage DECIMAL(5,2) NOT NULL,           -- % cua prize_pool (50.00 = 50%)
    fixed_amount DECIMAL(18,2) DEFAULT 0,       -- Tien co dinh (neu ko dung %)
    label NVARCHAR(50),                         -- 'Champion','Runner-up','3rd Place'
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

/* =========================
   SECURITY (GIU NGUYEN)
   ========================= */
CREATE TABLE Password_Reset_OTP (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(100) NOT NULL,
    otp NVARCHAR(10) NOT NULL,
    is_used BIT DEFAULT 0,
    create_at DATETIME DEFAULT GETDATE(),
    expire_at DATETIME NOT NULL
);
GO


/* =====================================================================
   SEED DATA
   ===================================================================== */

/* =========================
   1. ROLES
   ========================= */
INSERT INTO Roles (role_name, description) VALUES
    ('Admin',             'Full system access'),
    ('Staff',             'Tournament staff - approve/reject tournaments'),
    ('TournamentLeader',  'Tournament organizer/leader'),
    ('Referee',           'Match referee/arbiter'),
    ('Player',            'Normal chess player');
GO

/* =========================
   2. PERMISSIONS
   ========================= */
SET IDENTITY_INSERT Permission ON;

INSERT INTO Permission (permission_id, permission_name, permission_code, module, description) VALUES
-- USER
(1,  'View Own Profile',            'USER_VIEW_PROFILE',      'USER',        'View own profile information'),
(2,  'Edit Own Profile',            'USER_EDIT_PROFILE',      'USER',        'Edit own profile'),
(3,  'Change Password',             'USER_CHANGE_PWD',        'USER',        'Change own password'),
-- ADMIN
(10, 'View All Users',              'ADMIN_USER_LIST',        'ADMIN',       'View list of all users'),
(11, 'Edit User Status',            'ADMIN_USER_STATUS',      'ADMIN',       'Ban/Unban/Activate users'),
(12, 'Manage User Roles',           'ADMIN_USER_ROLE',        'ADMIN',       'Assign/remove roles'),
(13, 'Manage Role Permissions',     'ADMIN_ROLE_PERM',        'ADMIN',       'Edit permissions for roles'),
(14, 'View Dashboard',              'ADMIN_DASHBOARD',        'ADMIN',       'View admin dashboard'),
-- TOURNAMENT
(20, 'Create Tournament',           'TOUR_CREATE',            'TOURNAMENT',  'Create a new tournament'),
(21, 'Edit Own Tournament',         'TOUR_EDIT',              'TOURNAMENT',  'Edit tournament details'),
(22, 'Cancel Own Tournament',       'TOUR_CANCEL',            'TOURNAMENT',  'Cancel/delete own tournament'),
(23, 'View Tournament List',        'TOUR_VIEW_LIST',         'TOURNAMENT',  'View list of tournaments'),
(24, 'View Tournament Detail',      'TOUR_VIEW_DETAIL',       'TOURNAMENT',  'View tournament detail page'),
(25, 'Approve Tournament',          'TOUR_APPROVE',           'TOURNAMENT',  'Approve pending tournament'),
(26, 'Reject Tournament',           'TOUR_REJECT',            'TOURNAMENT',  'Reject pending tournament'),
(27, 'Start Tournament',            'TOUR_START',             'TOURNAMENT',  'Start tournament'),
(28, 'Complete Tournament',         'TOUR_COMPLETE',          'TOURNAMENT',  'Mark as Completed'),
(29, 'Assign Staff',                'TOUR_ASSIGN_STAFF',      'TOURNAMENT',  'Assign staff to tournament'),
(30, 'Assign Referee',              'TOUR_ASSIGN_REFEREE',    'TOURNAMENT',  'Assign referee to tournament'),
-- PARTICIPANT
(40, 'Register Tournament',         'PART_REGISTER',          'PARTICIPANT', 'Register to join a tournament'),
(41, 'Withdraw Tournament',         'PART_WITHDRAW',          'PARTICIPANT', 'Withdraw from a tournament'),
(42, 'View Participants',           'PART_VIEW_LIST',         'PARTICIPANT', 'View participant list'),
-- MATCH
(50, 'View Matches',                'MATCH_VIEW',             'MATCH',       'View match schedule & results'),
(51, 'Record Match Result',         'MATCH_RECORD_RESULT',    'MATCH',       'Enter/edit match results'),
(52, 'Generate Bracket',            'MATCH_GEN_BRACKET',      'MATCH',       'Generate bracket/pairings'),
-- STANDING
(55, 'View Standings',              'STANDING_VIEW',          'STANDING',    'View tournament standings'),
-- REPORT
(60, 'Create Report',               'REPORT_CREATE',          'REPORT',      'Submit a report'),
(61, 'View Reports',                'REPORT_VIEW',            'REPORT',      'View reports list'),
(62, 'Resolve Report',              'REPORT_RESOLVE',         'REPORT',      'Resolve reports'),
-- FEEDBACK
(70, 'Create Feedback',             'FEEDBACK_CREATE',        'FEEDBACK',    'Submit feedback/rating'),
(71, 'View Feedbacks',              'FEEDBACK_VIEW',          'FEEDBACK',    'View feedback list'),
(72, 'Moderate Feedback',           'FEEDBACK_MODERATE',      'FEEDBACK',    'Approve or reject feedback'),
-- BLOG
(80, 'Create Blog Post',            'BLOG_CREATE',            'BLOG',        'Create a new blog post'),
(81, 'Edit Own Blog Post',          'BLOG_EDIT',              'BLOG',        'Edit own blog post'),
(82, 'Delete Own Blog Post',        'BLOG_DELETE',            'BLOG',        'Delete own blog post'),
(83, 'Publish Blog Post',           'BLOG_PUBLISH',           'BLOG',        'Publish blog post'),
(84, 'Manage All Blog Posts',       'BLOG_MANAGE_ALL',        'BLOG',        'Edit/delete any blog post'),
-- PAYMENT
(90, 'View Own Balance',            'PAY_VIEW_BALANCE',       'PAYMENT',     'View wallet balance'),
(91, 'Request Deposit',             'PAY_DEPOSIT',            'PAYMENT',     'Create deposit request'),
(92, 'Request Withdrawal',          'PAY_WITHDRAW',           'PAYMENT',     'Create withdrawal request'),
(93, 'Process Deposit',             'PAY_PROCESS_DEPOSIT',    'PAYMENT',     'Approve/reject deposit'),
(94, 'Process Withdrawal',          'PAY_PROCESS_WITHDRAW',   'PAYMENT',     'Approve/reject withdrawal'),
(95, 'View All Transactions',       'PAY_VIEW_ALL',           'PAYMENT',     'View all transactions'),
-- NOTIFICATION
(100, 'Receive Notifications',      'NOTIF_RECEIVE',          'NOTIFICATION','Receive notifications'),
(101, 'Send System Notification',   'NOTIF_SEND',             'NOTIFICATION','Send notifications');

SET IDENTITY_INSERT Permission OFF;
GO

/* =========================
   3. ROLE -> PERMISSION MAPPING
   ========================= */

-- ADMIN: tat ca quyen
INSERT INTO Role_Permission (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM Roles r, Permission p
WHERE r.role_name = 'Admin';

-- STAFF
INSERT INTO Role_Permission (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM Roles r, Permission p
WHERE r.role_name = 'Staff'
  AND p.permission_code IN (
    'USER_VIEW_PROFILE','USER_EDIT_PROFILE','USER_CHANGE_PWD',
    'TOUR_VIEW_LIST','TOUR_VIEW_DETAIL','TOUR_APPROVE','TOUR_REJECT',
    'TOUR_START','TOUR_COMPLETE','TOUR_ASSIGN_STAFF','TOUR_ASSIGN_REFEREE',
    'PART_VIEW_LIST',
    'MATCH_VIEW','MATCH_GEN_BRACKET',
    'STANDING_VIEW',
    'REPORT_VIEW','REPORT_RESOLVE',
    'FEEDBACK_VIEW','FEEDBACK_MODERATE',
    'BLOG_CREATE','BLOG_EDIT','BLOG_DELETE','BLOG_PUBLISH',
    'PAY_VIEW_BALANCE',
    'NOTIF_RECEIVE','NOTIF_SEND'
  );

-- TOURNAMENT LEADER
INSERT INTO Role_Permission (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM Roles r, Permission p
WHERE r.role_name = 'TournamentLeader'
  AND p.permission_code IN (
    'USER_VIEW_PROFILE','USER_EDIT_PROFILE','USER_CHANGE_PWD',
    'TOUR_CREATE','TOUR_EDIT','TOUR_CANCEL','TOUR_VIEW_LIST','TOUR_VIEW_DETAIL',
    'TOUR_ASSIGN_REFEREE',
    'PART_VIEW_LIST',
    'MATCH_VIEW','MATCH_GEN_BRACKET',
    'STANDING_VIEW',
    'REPORT_VIEW',
    'FEEDBACK_VIEW',
    'BLOG_CREATE','BLOG_EDIT','BLOG_DELETE',
    'PAY_VIEW_BALANCE','PAY_DEPOSIT','PAY_WITHDRAW',
    'NOTIF_RECEIVE'
  );

-- REFEREE
INSERT INTO Role_Permission (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM Roles r, Permission p
WHERE r.role_name = 'Referee'
  AND p.permission_code IN (
    'USER_VIEW_PROFILE','USER_EDIT_PROFILE','USER_CHANGE_PWD',
    'TOUR_VIEW_LIST','TOUR_VIEW_DETAIL',
    'PART_VIEW_LIST',
    'MATCH_VIEW','MATCH_RECORD_RESULT',
    'STANDING_VIEW',
    'REPORT_CREATE','REPORT_VIEW',
    'FEEDBACK_VIEW',
    'PAY_VIEW_BALANCE','PAY_DEPOSIT','PAY_WITHDRAW',
    'NOTIF_RECEIVE'
  );

-- PLAYER
INSERT INTO Role_Permission (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM Roles r, Permission p
WHERE r.role_name = 'Player'
  AND p.permission_code IN (
    'USER_VIEW_PROFILE','USER_EDIT_PROFILE','USER_CHANGE_PWD',
    'TOUR_VIEW_LIST','TOUR_VIEW_DETAIL',
    'PART_REGISTER','PART_WITHDRAW','PART_VIEW_LIST',
    'MATCH_VIEW',
    'STANDING_VIEW',
    'REPORT_CREATE',
    'FEEDBACK_CREATE','FEEDBACK_VIEW',
    'PAY_VIEW_BALANCE','PAY_DEPOSIT','PAY_WITHDRAW',
    'NOTIF_RECEIVE'
  );
GO

/* =========================
   4. PAYMENT METHODS
   ========================= */
INSERT INTO Payment_Method (method_name, code, is_active, description) VALUES
    ('Bank Transfer', 'BANK',   1, N'Chuyen khoan ngan hang'),
    ('Momo',          'MOMO',   1, N'Vi dien tu Momo'),
    ('VNPay',         'VNPAY',  1, N'Cong thanh toan VNPay'),
    ('ZaloPay',       'ZALO',   1, N'Vi ZaloPay');
GO

/* =========================
   5. CHESS TITLES
   ========================= */
INSERT INTO Chess_Title (title_code, title_name, min_elo, sort_order) VALUES
    ('GM',   'Grandmaster',                2500, 1),
    ('IM',   'International Master',       2400, 2),
    ('FM',   'FIDE Master',                2300, 3),
    ('CM',   'Candidate Master',           2200, 4),
    ('NM',   'National Master',            2200, 5),
    ('WGM',  'Woman Grandmaster',          2300, 6),
    ('WIM',  'Woman International Master', 2200, 7),
    ('WFM',  'Woman FIDE Master',          2100, 8),
    ('WCM',  'Woman Candidate Master',     2000, 9),
    ('None', 'Unrated',                    0,    99);
GO

/* =========================
   6. AVATAR FRAMES
   ========================= */
INSERT INTO Avatar_Frame (frame_name, frame_url, description, rarity, unlock_condition, price) VALUES
    ('Default',       '/frames/default.png',       N'Khung mac dinh',                    'Common',    'Default',              0),
    ('Bronze',        '/frames/bronze.png',        N'Khung dong - 10 tran thang',        'Common',    'Win 10 matches',       0),
    ('Silver',        '/frames/silver.png',        N'Khung bac - 50 tran thang',         'Rare',      'Win 50 matches',       0),
    ('Gold',          '/frames/gold.png',          N'Khung vang - 100 tran thang',       'Epic',      'Win 100 matches',      0),
    ('Diamond',       '/frames/diamond.png',       N'Khung kim cuong - Vo dich 5 giai',  'Legendary', 'Win 5 tournaments',    0),
    ('Fire',          '/frames/fire.png',          N'Khung lua - Mua trong shop',        'Rare',      'Purchase',             50000),
    ('Neon',          '/frames/neon.png',          N'Khung neon - Mua trong shop',       'Epic',      'Purchase',             100000),
    ('Crown',         '/frames/crown.png',         N'Khung vuong mien - GM title',       'Legendary', 'Reach GM title',       0);
GO


/* =========================
<<<<<<< HEAD
=======
   7. USERS (20 nguoi dung)
   ========================= */
SET IDENTITY_INSERT Users ON;

INSERT INTO Users (user_id, username, first_name, last_name, email, phone_number, address, gender, birthday, password, avatar, balance, rank, last_login, is_active) VALUES
-- Admin
(1,  'admin_nguyen',    N'Minh',    N'Nguyễn Văn',   'admin@ctms.vn',            '0901000001', N'123 Lê Lợi, Q.1, TP.HCM',          'Male',   '1985-03-15', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',    '/avatars/admin.png',    0,      0, '2026-02-19 08:30:00', 1),
-- Staff
(2,  'staff_tran',      N'Hương',   N'Trần Thị',     'huong.tran@ctms.vn',       '0901000002', N'45 Hai Bà Trưng, Hoàn Kiếm, HN',   'Female', '1990-07-22', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',    '/avatars/staff1.png',   0,      0, '2026-02-18 14:00:00', 1),
(3,  'staff_le',        N'Tuấn',    N'Lê Thanh',     'tuan.le@ctms.vn',          '0901000003', N'78 Nguyễn Huệ, Q.1, TP.HCM',       'Male',   '1988-11-05', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',    '/avatars/staff2.png',   0,      0, '2026-02-17 09:15:00', 1),
-- Tournament Leaders
(4,  'leader_pham',     N'Đức',     N'Phạm Quốc',    'duc.pham@gmail.com',       '0912000004', N'10 Trần Phú, Hải Châu, Đà Nẵng',   'Male',   '1982-01-20', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',   '/avatars/leader1.png',  5000000, 0, '2026-02-19 10:00:00', 1),
(5,  'leader_hoang',    N'Linh',    N'Hoàng Thị',    'linh.hoang@gmail.com',     '0912000005', N'25 Lý Tự Trọng, Q.3, TP.HCM',      'Female', '1991-09-12', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',   '/avatars/leader2.png',  3000000, 0, '2026-02-18 16:30:00', 1),
(6,  'leader_vo',       N'Hải',     N'Võ Thanh',      'hai.vo@gmail.com',         '0912000006', N'88 Bạch Đằng, Hải Châu, Đà Nẵng',  'Male',   '1987-04-08', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',   '/avatars/leader3.png',  2000000, 0, '2026-02-15 11:00:00', 1),
-- Referees
(7,  'referee_dang',    N'Khoa',    N'Đặng Trọng',   'khoa.dang@gmail.com',      '0923000007', N'56 Pasteur, Q.1, TP.HCM',           'Male',   '1980-06-30', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',  '/avatars/referee1.png', 500000,  0, '2026-02-19 07:45:00', 1),
(8,  'referee_bui',     N'Ngọc',    N'Bùi Thị',      'ngoc.bui@gmail.com',       '0923000008', N'12 Điện Biên Phủ, Ba Đình, HN',     'Female', '1992-12-18', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',  '/avatars/referee2.png', 300000,  0, '2026-02-18 13:20:00', 1),
-- Players
(9,  'player_quang',    N'Quang',   N'Lê Trường',    'quang.le@gmail.com',       '0934000009', N'34 Nguyễn Trãi, Thanh Xuân, HN',    'Male',   '1995-02-14', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',   '/avatars/player1.png',  1500000, 1, '2026-02-19 20:00:00', 1),
(10, 'player_mai',      N'Mai',     N'Nguyễn Thị',   'mai.nguyen@gmail.com',     '0934000010', N'67 Lê Duẩn, Q.1, TP.HCM',           'Female', '1998-05-28', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',   '/avatars/player2.png',  800000,  2, '2026-02-19 18:30:00', 1),
(11, 'player_hung',     N'Hùng',    N'Trần Quốc',    'hung.tran@gmail.com',      '0934000011', N'90 Cách Mạng Tháng 8, Q.3, TP.HCM', 'Male',   '1993-08-03', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',   '/avatars/player3.png',  2200000, 3, '2026-02-19 21:15:00', 1),
(12, 'player_thao',     N'Thảo',    N'Phạm Thanh',   'thao.pham@gmail.com',      '0934000012', N'15 Trần Hưng Đạo, Hoàn Kiếm, HN',  'Female', '2000-11-11', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',   '/avatars/player4.png',  600000,  4, '2026-02-18 19:45:00', 1),
(13, 'player_nam',      N'Nam',     N'Võ Hoàng',     'nam.vo@gmail.com',         '0934000013', N'23 Phan Chu Trinh, Hải Châu, ĐN',   'Male',   '1997-03-25', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',   '/avatars/player5.png',  1000000, 5, '2026-02-19 17:00:00', 1),
(14, 'player_lan',      N'Lan',     N'Đỗ Thị',       'lan.do@gmail.com',         '0934000014', N'41 Võ Văn Tần, Q.3, TP.HCM',        'Female', '1996-07-19', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',   '/avatars/player6.png',  450000,  6, '2026-02-17 20:30:00', 1),
(15, 'player_son',      N'Sơn',     N'Nguyễn Hữu',   'son.nguyen@gmail.com',     '0934000015', N'8 Hùng Vương, Hải Châu, Đà Nẵng',   'Male',   '1994-10-02', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',   '/avatars/player7.png',  1800000, 7, '2026-02-19 22:00:00', 1),
(16, 'player_trang',    N'Trang',   N'Lê Thị',       'trang.le@gmail.com',       '0934000016', N'55 Nguyễn Văn Cừ, Q.5, TP.HCM',     'Female', '2001-01-30', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',   '/avatars/player8.png',  200000,  8, '2026-02-16 15:00:00', 1),
(17, 'player_khai',     N'Khải',    N'Trương Minh',   'khai.truong@gmail.com',    '0934000017', N'72 Lạc Long Quân, Tây Hồ, HN',      'Male',   '1999-06-14', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',   '/avatars/player9.png',  900000,  9, '2026-02-19 19:30:00', 1),
(18, 'player_vy',       N'Vy',      N'Huỳnh Ngọc',   'vy.huynh@gmail.com',       '0934000018', N'30 Nguyễn Thị Minh Khai, Q.1, HCM', 'Female', '2002-04-07', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',   '/avatars/player10.png', 350000, 10, '2026-02-18 21:00:00', 1),
(19, 'player_phong',    N'Phong',   N'Đinh Văn',      'phong.dinh@gmail.com',     '0934000019', N'19 Trần Quốc Toản, Q.3, TP.HCM',    'Male',   '1990-08-22', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',   '/avatars/player11.png', 1100000, 0, '2026-02-14 10:00:00', 0),
(20, 'player_hoa',      N'Hoa',     N'Phan Thị',      'hoa.phan@gmail.com',       '0934000020', N'63 Hai Bà Trưng, Q.1, TP.HCM',      'Female', '1998-12-25', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',   '/avatars/player12.png', 750000, 11, '2026-02-19 16:00:00', 1);

SET IDENTITY_INSERT Users OFF;
GO

/* =========================
   8. USER_ROLE
   ========================= */
INSERT INTO User_Role (user_id, role_id) VALUES
(1,  1),  -- Admin
(2,  2),  -- Staff
(3,  2),  -- Staff
(4,  3),  -- TournamentLeader
(5,  3),  -- TournamentLeader
(6,  3),  -- TournamentLeader
(7,  4),  -- Referee
(8,  4),  -- Referee
(9,  5),  -- Player
(10, 5),  -- Player
(11, 5),  -- Player
(12, 5),  -- Player
(13, 5),  -- Player
(14, 5),  -- Player
(15, 5),  -- Player
(16, 5),  -- Player
(17, 5),  -- Player
(18, 5),  -- Player
(19, 5),  -- Player
(20, 5);  -- Player
GO

/* =========================
   9. USER_CHESS_PROFILE
   ========================= */
INSERT INTO User_Chess_Profile (user_id, title_id, elo_rating, highest_elo, total_games, total_wins, total_draws, total_losses, last_game_at) VALUES
(9,  4,  2210, 2250, 320, 180, 60, 80,  '2026-02-10 18:00:00'),  -- CM
(10, 7,  2205, 2220, 210, 110, 45, 55,  '2026-02-10 17:30:00'),  -- WIM
(11, 3,  2350, 2380, 450, 270, 80, 100, '2026-02-10 19:00:00'),  -- FM
(12, 9,  2020, 2050, 150, 75,  30, 45,  '2026-02-08 20:00:00'),  -- WCM
(13, 5,  2230, 2260, 280, 150, 55, 75,  '2026-02-10 16:45:00'),  -- NM
(14, 8,  2110, 2140, 190, 95,  40, 55,  '2026-02-09 21:00:00'),  -- WFM
(15, 4,  2240, 2280, 350, 200, 65, 85,  '2026-02-10 20:00:00'),  -- CM
(16, 10, 1450, 1500, 80,  30,  15, 35,  '2026-02-07 19:00:00'),  -- Unrated
(17, 10, 1680, 1720, 120, 55,  25, 40,  '2026-02-10 18:30:00'),  -- Unrated
(18, 10, 1350, 1400, 60,  20,  10, 30,  '2026-02-06 17:00:00'),  -- Unrated
(19, 5,  2200, 2250, 300, 160, 60, 80,  '2026-01-20 15:00:00'),  -- NM (inactive)
(20, 10, 1580, 1620, 100, 45,  20, 35,  '2026-02-10 19:30:00'); -- Unrated
GO

/* =========================
   10. TOURNAMENTS (4 giai dau)
   ========================= */
SET IDENTITY_INSERT Tournaments ON;

INSERT INTO Tournaments (tournament_id, tournament_name, description, tournament_image, rules, location, format, categories, max_player, min_player, entry_fee, prize_pool, status, registration_deadline, start_date, end_date, create_by, create_at, notes) VALUES
(1, N'Hanoi Open Chess 2026',
   N'Giải cờ vua mở rộng Hà Nội lần thứ 5. Quy tụ các kỳ thủ hàng đầu miền Bắc.',
   '/tournaments/hanoi-open-2026.jpg',
   N'Time control: 90 phút + 30 giây/nước. Tie-break: Buchholz, Sonneborn-Berger. Luật FIDE áp dụng.',
   N'Cung Văn hóa Hữu nghị Việt Xô, Hà Nội',
   'RoundRobin', 'Open', 8, 4, 200000, 10000000,
   'Completed', '2026-01-10 23:59:00', '2026-01-15 08:00:00', '2026-01-20 18:00:00',
   4, '2025-12-20 10:00:00', N'Giải đã kết thúc thành công'),

(2, N'Saigon Blitz Championship',
   N'Giải cờ chớp nhoáng TP.HCM. Mỗi bên 3 phút + 2 giây/nước.',
   '/tournaments/saigon-blitz.jpg',
   N'Time control: 3 phút + 2 giây increment. Luật FIDE Blitz. Tie-break: Direct encounter, Buchholz.',
   N'Nhà Văn hóa Thanh Niên, TP.HCM',
   'KnockOut', 'Blitz', 8, 4, 100000, 5000000,
   'Ongoing', '2026-02-10 23:59:00', '2026-02-15 09:00:00', '2026-02-25 18:00:00',
   5, '2026-01-15 14:00:00', N'Đang diễn ra vòng tứ kết'),

(3, N'Đà Nẵng Summer Chess Festival',
   N'Lễ hội cờ vua mùa hè Đà Nẵng. Chào đón mọi cấp độ kỳ thủ.',
   '/tournaments/danang-summer.jpg',
   N'Time control: 60 phút + 15 giây/nước. Swiss system 7 vòng. Tie-break: Buchholz, Progressive.',
   N'Trung tâm Hội nghị Ariyana, Đà Nẵng',
   'RoundRobin', 'Open', 12, 6, 150000, 8000000,
   'Pending', '2026-03-20 23:59:00', '2026-04-01 08:00:00', '2026-04-05 18:00:00',
   6, '2026-02-10 09:00:00', N'Đang chờ phê duyệt'),

(4, N'Vietnam National Rapid 2026',
   N'Giải cờ nhanh quốc gia Việt Nam. Dành cho kỳ thủ có Elo >= 2000.',
   '/tournaments/national-rapid.jpg',
   N'Time control: 15 phút + 10 giây/nước. Luật FIDE Rapid. Tie-break: Buchholz, Sonneborn-Berger, Direct encounter.',
   N'Trung tâm Hội nghị Quốc gia, Hà Nội',
   'Hybrid', 'Rapid', 16, 8, 500000, 30000000,
   'Cancelled', '2026-02-01 23:59:00', '2026-02-20 08:00:00', '2026-02-28 18:00:00',
   4, '2026-01-05 11:00:00', N'Hủy do không đủ số lượng đăng ký');

SET IDENTITY_INSERT Tournaments OFF;
GO

/* =========================
   10.1 TOURNAMENT IMAGES (NEW)
   ========================= */
INSERT INTO Tournament_Images (tournament_id, image_url, display_order) VALUES
(1, '/tournaments/hanoi-open-2026.jpg', 1),
(1, '/tournaments/hanoi-open-2026-2.jpg', 2),
(1, '/tournaments/hanoi-open-2026-3.jpg', 3),
(2, '/tournaments/saigon-blitz.jpg', 1),
(2, '/tournaments/saigon-blitz-2.jpg', 2),
(3, '/tournaments/danang-summer.jpg', 1),
(3, '/tournaments/danang-summer-2.jpg', 2),
(4, '/tournaments/national-rapid.jpg', 1),
(4, '/tournaments/national-rapid-2.jpg', 2);
GO

/* =========================
   11. TOURNAMENT_STAFF
   ========================= */
INSERT INTO Tournament_Staff (tournament_id, staff_id, staff_role, assigned_by, note) VALUES
(1, 2, 'Approver',  1, N'Phụ trách phê duyệt giải Hà Nội Open'),
(1, 3, 'Support',   1, N'Hỗ trợ hậu cần'),
(2, 3, 'Approver',  1, N'Phụ trách phê duyệt giải Saigon Blitz'),
(2, 2, 'Support',   1, N'Hỗ trợ truyền thông'),
(3, 2, 'Manager',   1, N'Quản lý giải Đà Nẵng Summer'),
(4, 3, 'Approver',  1, N'Phụ trách giải National Rapid');
GO

/* =========================
   12. TOURNAMENT_REFEREE
   ========================= */
INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by, note) VALUES
(1, 7, 'Chief',     4, N'Trọng tài trưởng giải Hà Nội Open'),
(1, 8, 'Assistant',  4, N'Trọng tài phụ'),
(2, 8, 'Chief',     5, N'Trọng tài trưởng giải Saigon Blitz'),
(2, 7, 'Assistant',  5, N'Trọng tài phụ'),
(3, 7, 'Chief',     6, N'Trọng tài trưởng - chờ xác nhận');
GO

/* =========================
   13. TOURNAMENT_APPROVAL_LOG
   ========================= */
INSERT INTO Tournament_Approval_Log (tournament_id, staff_id, action, from_status, to_status, note, create_at) VALUES
(1, 2, 'Approve',  'Pending',   'Ongoing',    N'Đủ điều kiện tổ chức',                '2025-12-25 09:00:00'),
(1, 2, 'Start',    'Ongoing',   'Ongoing',    N'Bắt đầu giải đấu',                    '2026-01-15 08:00:00'),
(1, 2, 'Complete', 'Ongoing',   'Completed',  N'Giải đấu kết thúc thành công',         '2026-01-20 18:00:00'),
(2, 3, 'Approve',  'Pending',   'Ongoing',    N'Đủ điều kiện, bắt đầu nhận đăng ký',  '2026-01-20 10:00:00'),
(2, 3, 'Start',    'Ongoing',   'Ongoing',    N'Giải đấu chính thức bắt đầu',          '2026-02-15 09:00:00'),
(3, 2, 'Delay',    'Pending',   'Delayed',    N'Cần bổ sung thêm thông tin địa điểm',  '2026-02-15 11:00:00'),
(4, 3, 'Approve',  'Pending',   'Ongoing',    N'Đã phê duyệt',                         '2026-01-10 14:00:00'),
(4, 3, 'Cancel',   'Ongoing',   'Cancelled',  N'Hủy do không đủ người đăng ký',        '2026-02-05 16:00:00');
GO

/* =========================
   14. PARTICIPANTS
   ========================= */
SET IDENTITY_INSERT Participants ON;

INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date, notes) VALUES
-- Tournament 1 (Hanoi Open - Completed) - 6 players
(1,  1, 9,  'CM',      1, 'Active',    1, '2025-12-28 10:00:00', '2025-12-25 08:00:00', NULL),
(2,  1, 11, 'FM',      2, 'Active',    1, '2025-12-27 14:00:00', '2025-12-26 09:00:00', NULL),
(3,  1, 13, 'NM',      3, 'Active',    1, '2025-12-29 11:00:00', '2025-12-27 10:00:00', NULL),
(4,  1, 15, 'CM',      4, 'Active',    1, '2025-12-30 09:00:00', '2025-12-28 15:00:00', NULL),
(5,  1, 17, 'Unrated', 5, 'Active',    1, '2026-01-02 16:00:00', '2025-12-30 12:00:00', NULL),
(6,  1, 19, 'NM',      6, 'Withdrawn', 1, '2026-01-03 10:00:00', '2026-01-02 08:00:00', N'Rút lui do lý do cá nhân'),

-- Tournament 2 (Saigon Blitz - Ongoing) - 8 players
(7,  2, 9,  'CM',      1, 'Active', 1, '2026-02-01 10:00:00', '2026-01-20 09:00:00', NULL),
(8,  2, 10, 'WIM',     2, 'Active', 1, '2026-02-02 11:00:00', '2026-01-21 14:00:00', NULL),
(9,  2, 11, 'FM',      3, 'Active', 1, '2026-02-01 15:00:00', '2026-01-22 10:00:00', NULL),
(10, 2, 12, 'WCM',     4, 'Active', 1, '2026-02-03 09:00:00', '2026-01-23 16:00:00', NULL),
(11, 2, 13, 'NM',      5, 'Active', 1, '2026-02-04 14:00:00', '2026-01-25 08:00:00', NULL),
(12, 2, 14, 'WFM',     6, 'Active', 1, '2026-02-05 10:00:00', '2026-01-26 11:00:00', NULL),
(13, 2, 15, 'CM',      7, 'Active', 1, '2026-02-06 16:00:00', '2026-01-28 09:00:00', NULL),
(14, 2, 20, 'Unrated', 8, 'Active', 1, '2026-02-08 11:00:00', '2026-02-01 15:00:00', NULL),

-- Tournament 3 (Da Nang Summer - Pending) - 4 nguoi dang ky som
(15, 3, 10, 'WIM',     NULL, 'Active', 1, '2026-02-12 10:00:00', '2026-02-11 09:00:00', NULL),
(16, 3, 12, 'WCM',     NULL, 'Active', 1, '2026-02-13 14:00:00', '2026-02-12 11:00:00', NULL),
(17, 3, 14, 'WFM',     NULL, 'Active', 0, NULL,                   '2026-02-14 16:00:00', N'Chưa thanh toán'),
(18, 3, 17, 'Unrated', NULL, 'Active', 1, '2026-02-15 09:00:00', '2026-02-14 20:00:00', NULL);

SET IDENTITY_INSERT Participants OFF;
GO

/* =========================
   15. BRACKET
   ========================= */
SET IDENTITY_INSERT Bracket ON;

INSERT INTO Bracket (bracket_id, bracket_name, tournament_id, type, status) VALUES
(1, N'Bảng chính',          1, 'RoundRobin', 'Completed'),
(2, N'Nhánh chính',         2, 'KnockOut',   'Ongoing'),
(3, N'Bảng chính (dự kiến)', 3, 'RoundRobin', 'Pending');

SET IDENTITY_INSERT Bracket OFF;
GO

/* =========================
   16. ROUND
   ========================= */
SET IDENTITY_INSERT Round ON;

INSERT INTO Round (round_id, bracket_id, tournament_id, name, round_index, start_time, end_time, is_completed) VALUES
-- Tournament 1 - RoundRobin 5 vòng (5 nguoi choi sau khi 1 rut)
(1, 1, 1, N'Vòng 1',  1, '2026-01-15 08:30:00', '2026-01-15 12:00:00', 1),
(2, 1, 1, N'Vòng 2',  2, '2026-01-16 08:30:00', '2026-01-16 12:00:00', 1),
(3, 1, 1, N'Vòng 3',  3, '2026-01-17 08:30:00', '2026-01-17 12:00:00', 1),
(4, 1, 1, N'Vòng 4',  4, '2026-01-18 08:30:00', '2026-01-18 12:00:00', 1),
(5, 1, 1, N'Vòng 5',  5, '2026-01-19 08:30:00', '2026-01-19 12:00:00', 1),
-- Tournament 2 - KnockOut: QF, SF, Final
(6, 2, 2, N'Tứ kết',       1, '2026-02-15 09:00:00', '2026-02-16 18:00:00', 1),
(7, 2, 2, N'Bán kết',      2, '2026-02-18 09:00:00', '2026-02-19 18:00:00', 0),
(8, 2, 2, N'Chung kết',    3, '2026-02-22 09:00:00', NULL,                   0);

SET IDENTITY_INSERT Round OFF;
GO

/* =========================
   17. MATCHES
   ========================= */
SET IDENTITY_INSERT Matches ON;

INSERT INTO Matches (match_id, tournament_id, round_id, board_number, white_player_id, black_player_id, result, termination, status, start_time, end_time) VALUES
-- === TOURNAMENT 1 - ROUND ROBIN (Vòng 1) ===
(1,  1, 1, 1, 9,  11, '0-1',     'Resignation', 'Completed', '2026-01-15 08:30:00', '2026-01-15 10:45:00'),
(2,  1, 1, 2, 13, 15, '1/2-1/2', 'Draw',        'Completed', '2026-01-15 08:30:00', '2026-01-15 11:20:00'),
-- Vòng 2
(3,  1, 2, 1, 11, 13, '1-0',     'Checkmate',   'Completed', '2026-01-16 08:30:00', '2026-01-16 10:15:00'),
(4,  1, 2, 2, 15, 9,  '0-1',     'Timeout',     'Completed', '2026-01-16 08:30:00', '2026-01-16 11:00:00'),
-- Vòng 3
(5,  1, 3, 1, 9,  13, '1-0',     'Resignation', 'Completed', '2026-01-17 08:30:00', '2026-01-17 10:30:00'),
(6,  1, 3, 2, 17, 11, '0-1',     'Checkmate',   'Completed', '2026-01-17 08:30:00', '2026-01-17 09:55:00'),
-- Vòng 4
(7,  1, 4, 1, 11, 15, '1-0',     'Resignation', 'Completed', '2026-01-18 08:30:00', '2026-01-18 10:40:00'),
(8,  1, 4, 2, 13, 17, '1-0',     'Timeout',     'Completed', '2026-01-18 08:30:00', '2026-01-18 11:30:00'),
-- Vòng 5
(9,  1, 5, 1, 9,  17, '1-0',     'Resignation', 'Completed', '2026-01-19 08:30:00', '2026-01-19 09:45:00'),
(10, 1, 5, 2, 15, 13, '1/2-1/2', 'Draw',        'Completed', '2026-01-19 08:30:00', '2026-01-19 11:50:00'),

-- === TOURNAMENT 2 - KNOCKOUT (Tứ kết) ===
(11, 2, 6, 1, 9,  20, '1-0',     'Checkmate',   'Completed', '2026-02-15 09:00:00', '2026-02-15 09:12:00'),
(12, 2, 6, 2, 11, 14, '1-0',     'Timeout',     'Completed', '2026-02-15 09:00:00', '2026-02-15 09:08:00'),
(13, 2, 6, 3, 10, 15, '0-1',     'Resignation', 'Completed', '2026-02-15 10:00:00', '2026-02-15 10:09:00'),
(14, 2, 6, 4, 12, 13, '0-1',     'Checkmate',   'Completed', '2026-02-15 10:00:00', '2026-02-15 10:11:00'),
-- Bán kết (ongoing)
(15, 2, 7, 1, 9,  11, NULL,      NULL,          'Scheduled',  '2026-02-18 09:00:00', NULL),
(16, 2, 7, 2, 15, 13, NULL,      NULL,          'Scheduled',  '2026-02-18 10:00:00', NULL),
-- Chung kết (chua dien ra)
(17, 2, 8, 1, NULL, NULL, NULL,   NULL,          'Scheduled',  '2026-02-22 09:00:00', NULL);

SET IDENTITY_INSERT Matches OFF;
GO

/* =========================
   18. MATCH_REFEREE
   ========================= */
INSERT INTO Match_Referee (match_id, referee_id, role) VALUES
(1,  7, 'Main'),
(2,  8, 'Main'),
(3,  7, 'Main'),
(4,  8, 'Main'),
(5,  7, 'Main'),
(6,  8, 'Main'),
(7,  7, 'Main'),
(8,  8, 'Main'),
(9,  7, 'Main'),
(10, 8, 'Main'),
(11, 8, 'Main'),
(12, 7, 'Assistant'),
(13, 8, 'Main'),
(14, 7, 'Assistant'),
(15, 8, 'Main'),
(16, 7, 'Main');
GO

/* =========================
   19. MATCH_PGN (van co da hoan thanh)
   ========================= */
INSERT INTO Match_PGN (match_id, pgn_text, fen_final, total_moves, duration_seconds) VALUES
(1,  '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. a4 c5 16. d5 c4 17. Bg5 h6 18. Be3 Nc5 19. Qd2 h5 20. Bg5 Be7 21. b4 cxb3 22. Bxb3 Nxb3 23. Qb2 Nc5 24. Nd2 Qc7 25. f3 a5 26. Kh2 Rab8 27. Nf1 b4 28. cxb4 axb4 29. a5 Qd7 30. Ne3 Nh7 31. Bxe7 Qxe7 32. Ngf1 Ng5 33. Nd2 f5 34. exf5 gxf5 35. f4 Nge4 36. Nxe4 fxe4 0-1',
     'r1b1r1k1/4q3/3p4/P1nPp3/1p2pp2/4N2P/1Q4PK/R3R3 w - - 0 37', 36, 8100),

(3,  '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 d5 5. cxd5 exd5 6. Bg5 h6 7. Bh4 c5 8. dxc5 g5 9. Bg3 Ne4 10. e3 Qa5 11. Nge2 Bf5 12. Be5 O-O 13. Nd4 Bg6 14. a3 Bxc3+ 15. bxc3 Nxc3 16. Qd2 Ne4 17. Qb2 Nd7 18. Bd6 Re8 19. f3 Nec5 20. Be2 Rac8 21. O-O Ne5 22. Bb4 Ncd3 23. Bxd3 Nxd3 24. Qa2 Nxb4 25. axb4 Rxc5 26. bxc5 Qxc5 27. Kh1 a5 28. Qb2 Qe5 29. Rab1 b6 30. Nc6 Qxb2 31. Rxb2 Re6 32. Nd4 Rd6 33. Rc2 Be4 34. fxe4 dxe4 35. Rc8+ Kg7 36. Rc7 Rd7 37. Rxd7 1-0',
     '8/3R1pk1/1p5p/p5p1/3Np3/4P3/6PP/5R1K b - - 0 37', 37, 6300),

(5,  '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O 10. O-O-O Nbd7 11. g4 b5 12. g5 Nh5 13. Kb1 Nb6 14. Na5 Rc8 15. Nd5 Bxd5 16. exd5 f5 17. gxf6 Nxf6 18. Rg1 Kh8 19. Be2 Nfxd5 20. Bg5 Bxg5 21. Rxg5 Qf6 22. Rdg1 Nc4 23. Nxc4 bxc4 24. Bxc4 Nf4 25. R5g4 g5 26. h4 h6 27. hxg5 hxg5 28. Bd5 Rc5 29. c4 Rfc8 30. b3 Qf5 31. Ka1 0-1',
     '2r5/8/p2p4/2bR1qp1/2P2nR1/1P3P2/P7/K7 w - - 6 32', 31, 7200),

(11, '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Bd2 Bxd2+ 8. Nbxd2 d5 9. exd5 Nxd5 10. Qb3 Nce7 11. O-O O-O 12. Rfe1 c6 13. a4 Qb6 14. Qc2 Bf5 15. Qc1 Nd3 16. Re2 Nxc1 17. Rxc1 Bg4 18. Ne5 Bxe2 19. Bxe2 Rfe8 20. Ndf3 f6 21. Nd3 Qd6 22. Nfe1 b5 23. a5 a6 24. Rc5 Nb4 25. Nxb4 Rxe2 26. Nd3 Rd2 27. Nf4 Rd1+ 28. Nxd1 Qxd4 29. Rc2 Rd8 30. Ne3 Qe5 31. Nd3 Qd4 32. Rc1 g5 33. g3 Kg7 34. Kg2 h5 35. Nf3 Qxb2 36. Nde1 g4 37. Nd3 Qb3 38. Nfe1 gxf3+ 39. Nxf3 Rd3 40. Rc3 Qb1 41. Rxd3 Qxd3 42. Ne1 Qe4+ 43. Kg1 h4 44. gxh4 Qe3+ 45. Kg2 Qe2+ 46. Kg3 Qe5+ 47. Kg2 c5 48. h5 c4 49. h6+ Kxh6 50. Nc2 c3 51. Kf3 Qc5 52. Ke2 c2 53. Kd2 Qf2+ 54. Kd3 Qd4# 1-0',
     '8/8/p4p1k/1p2P2P/3q4/3K4/2Nq4/8 w - - 0 55', 54, 720),

(12, '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7 8. O-O Be6 9. f4 Qc7 10. f5 Bc4 11. Bxc4 Qxc4 12. Nd2 Qc6 13. Nf3 Nbd7 14. Bg5 O-O 15. Bxf6 Nxf6 16. Qd3 Rfc8 17. Nd5 Nxd5 18. exd5 Qc4 19. Qxc4 Rxc4 20. c3 Bg5 21. Rae1 Kf8 1-0',
     'r5k1/1p3pp1/p2p4/3Ppbb1/2r5/2P2N2/PP4PP/4RRK1 b - - 2 21', 21, 480);
GO

/* =========================
   20. STANDING
   ========================= */
-- Tournament 1 (Completed): 5 nguoi choi (user 19 rut lui)
INSERT INTO Standing (tournament_id, user_id, matches_played, won, drawn, lost, point, tie_break, current_rank) VALUES
(1, 11, 4, 4, 0, 0, 4.0,  10.00, 1),   -- FM Hùng - Vo dich
(1, 9,  4, 3, 0, 1, 3.0,  8.50,  2),   -- CM Quang
(1, 13, 4, 1, 2, 1, 2.0,  7.00,  3),   -- NM Nam
(1, 15, 4, 0, 2, 2, 1.0,  5.50,  4),   -- CM Sơn
(1, 17, 4, 0, 0, 4, 0.0,  3.00,  5),   -- Khải

-- Tournament 2 (Ongoing - sau vong tu ket)
(2, 9,  1, 1, 0, 0, 1.0,  0, NULL),
(2, 11, 1, 1, 0, 0, 1.0,  0, NULL),
(2, 15, 1, 1, 0, 0, 1.0,  0, NULL),
(2, 13, 1, 1, 0, 0, 1.0,  0, NULL),
(2, 10, 1, 0, 0, 1, 0.0,  0, NULL),
(2, 14, 1, 0, 0, 1, 0.0,  0, NULL),
(2, 12, 1, 0, 0, 1, 0.0,  0, NULL),
(2, 20, 1, 0, 0, 1, 0.0,  0, NULL);
GO

/* =========================
   21. PRIZE_TEMPLATE
   ========================= */
INSERT INTO Prize_Template (tournament_id, rank_position, percentage, fixed_amount, label) VALUES
(1, 1, 50.00, 0, 'Champion'),
(1, 2, 30.00, 0, 'Runner-up'),
(1, 3, 20.00, 0, '3rd Place'),
(2, 1, 50.00, 0, 'Champion'),
(2, 2, 30.00, 0, 'Runner-up'),
(2, 3, 10.00, 0, '3rd Place'),
(2, 4, 10.00, 0, '4th Place'),
(3, 1, 50.00, 0, 'Champion'),
(3, 2, 30.00, 0, 'Runner-up'),
(3, 3, 20.00, 0, '3rd Place');
GO

/* =========================
   22. PRIZE_DISTRIBUTION (Tournament 1 - da chia thuong)
   ========================= */
INSERT INTO Prize_Distribution (tournament_id, user_id, rank_position, prize_amount, is_distributed, distributed_at, note) VALUES
(1, 11, 1, 5000000, 1, '2026-01-21 10:00:00', N'Vô địch - 50% prize pool'),
(1, 9,  2, 3000000, 1, '2026-01-21 10:00:00', N'Á quân - 30% prize pool'),
(1, 13, 3, 2000000, 1, '2026-01-21 10:00:00', N'Hạng ba - 20% prize pool');
GO

/* =========================
   23. BLOG_POST
   ========================= */
SET IDENTITY_INSERT Blog_Post ON;

INSERT INTO Blog_Post (blog_post_id, title, summary, content, thumbnail_url, author_id, categories, status, views, publish_at, create_at) VALUES
(1, N'Khai mạc giải Hanoi Open Chess 2026',
   N'Giải cờ vua mở rộng Hà Nội lần thứ 5 chính thức khai mạc với sự tham gia của nhiều kỳ thủ hàng đầu.',
   N'Sáng ngày 15/01/2026, giải cờ vua mở rộng Hà Nội lần thứ 5 đã chính thức khai mạc tại Cung Văn hóa Hữu nghị Việt Xô. Giải thu hút sự tham gia của 5 kỳ thủ hàng đầu miền Bắc với tổng giải thưởng lên đến 10 triệu đồng. Giải được tổ chức theo thể thức Round Robin, mỗi kỳ thủ sẽ đấu với tất cả các đối thủ còn lại. Thời gian thi đấu: 90 phút + 30 giây/nước theo luật FIDE.',
   '/blogs/hanoi-open-2026.jpg', 2, 'News', 'Public', 1250, '2026-01-15 07:00:00', '2026-01-14 22:00:00'),

(2, N'FM Trần Quốc Hùng vô địch Hanoi Open 2026',
   N'FM Hùng giành chức vô địch với thành tích toàn thắng 4/4 ván.',
   N'Sau 5 ngày tranh tài căng thẳng, FM Trần Quốc Hùng đã xuất sắc giành chức vô địch Hanoi Open Chess 2026 với thành tích ấn tượng 4 thắng, 0 hòa, 0 thua. Ở vị trí á quân là CM Lê Trường Quang với 3 điểm. NM Võ Hoàng Nam giành hạng ba với 2 điểm. FM Hùng cho biết: "Tôi rất vui vì đã thi đấu tốt trong suốt giải. Các ván đấu đều rất kịch tính."',
   '/blogs/hanoi-open-winner.jpg', 2, 'News', 'Public', 2340, '2026-01-20 19:00:00', '2026-01-20 18:30:00'),

(3, N'10 mẹo cải thiện chiến thuật cờ vua cho người mới',
   N'Những mẹo đơn giản nhưng hiệu quả giúp bạn nâng cao trình độ cờ vua.',
   N'1. Luôn kiểm soát trung tâm bàn cờ. 2. Phát triển quân nhanh trong khai cuộc. 3. Bảo vệ Vua bằng cách nhập thành sớm. 4. Không di chuyển cùng một quân nhiều lần trong khai cuộc. 5. Đừng đưa Hậu ra sớm. 6. Kết nối hai Xe. 7. Tính toán trước ít nhất 3 nước. 8. Học các motif chiến thuật: ghim quân, đòn đôi, phát hiện. 9. Phân tích ván đấu sau khi kết thúc. 10. Luyện tập giải puzzle mỗi ngày.',
   '/blogs/chess-tips.jpg', 3, 'Guide', 'Public', 5680, '2026-01-25 10:00:00', '2026-01-24 16:00:00'),

(4, N'Chiến lược tấn công cánh Vua trong cờ vua',
   N'Phân tích chi tiết các phương pháp tấn công cánh Vua phổ biến nhất.',
   N'Tấn công cánh Vua là một trong những chủ đề quan trọng nhất trong cờ vua trung cuộc. Bài viết này sẽ phân tích các phương pháp tấn công phổ biến: 1) Hy sinh Mã ở f7/f2, 2) Tấn công Hy Lạp (Bxh7+), 3) Tấn công tốt chung (g4-g5-g6), 4) Mở cột h cho Xe. Mỗi phương pháp đều có ví dụ minh họa từ các ván đấu của các Đại Kiện Tướng.',
   '/blogs/kingside-attack.jpg', 4, 'Strategy', 'Public', 3420, '2026-02-01 08:00:00', '2026-01-30 20:00:00'),

(5, N'Thông báo: Saigon Blitz Championship đang diễn ra!',
   N'Giải cờ chớp nhoáng TP.HCM bước vào giai đoạn knock-out hấp dẫn.',
   N'Saigon Blitz Championship 2026 đã chính thức bước vào vòng tứ kết với 8 kỳ thủ xuất sắc nhất. Các trận đấu diễn ra vô cùng kịch tính với thời gian thi đấu 3 phút + 2 giây/nước. Kết quả vòng tứ kết: CM Quang thắng Hoa, FM Hùng thắng WFM Lan, CM Sơn thắng WIM Mai, NM Nam thắng WCM Thảo. Vòng bán kết sẽ diễn ra vào ngày 18/02.',
   '/blogs/saigon-blitz-qf.jpg', 3, 'News', 'Public', 1890, '2026-02-16 10:00:00', '2026-02-16 09:00:00'),

(6, N'Hướng dẫn tàn cuộc Vua và Tốt cơ bản',
   N'Nắm vững tàn cuộc Vua Tốt - nền tảng quan trọng nhất của cờ vua.',
   N'Tàn cuộc Vua và Tốt là nền tảng của mọi tàn cuộc cờ vua. Bài viết trình bày: Quy tắc ô vuông, Opposition (đối Vua), Triangulation, Tốt thông xa, Zugzwang. Hiểu rõ các kỹ thuật này sẽ giúp bạn chuyển hóa lợi thế thành chiến thắng.',
   '/blogs/king-pawn-endgame.jpg', 4, 'Guide', 'Draft', 0, NULL, '2026-02-18 14:00:00');

SET IDENTITY_INSERT Blog_Post OFF;
GO

/* =========================
   24. BLOG_IMAGE
   ========================= */
INSERT INTO Blog_Image (blog_post_id, image_url, caption, sort_order) VALUES
(1, '/blogs/images/hanoi-open-ceremony1.jpg',   N'Lễ khai mạc giải đấu',          1),
(1, '/blogs/images/hanoi-open-ceremony2.jpg',   N'Các kỳ thủ tham dự',             2),
(2, '/blogs/images/hanoi-winner-trophy.jpg',     N'FM Hùng nhận cúp vô địch',       1),
(2, '/blogs/images/hanoi-podium.jpg',            N'Lễ trao giải top 3',              2),
(2, '/blogs/images/hanoi-final-game.jpg',        N'Ván đấu cuối cùng',              3),
(3, '/blogs/images/chess-tips-board.jpg',        N'Bàn cờ minh họa',                1),
(4, '/blogs/images/kingside-attack-diagram.jpg', N'Sơ đồ tấn công cánh Vua',        1),
(4, '/blogs/images/greek-gift-example.jpg',      N'Ví dụ đòn hy sinh Tượng h7',     2),
(5, '/blogs/images/saigon-blitz-arena.jpg',      N'Khung cảnh thi đấu',             1),
(5, '/blogs/images/saigon-blitz-players.jpg',    N'Các kỳ thủ thi đấu',             2);
GO

/* =========================
   25. NOTIFICATION
   ========================= */
INSERT INTO Notification (title, message, type, action_url, is_read, create_at, user_id) VALUES
-- Thông báo cho người chơi Tournament 1
(N'Đăng ký thành công',            N'Bạn đã đăng ký thành công giải Hanoi Open Chess 2026.',                   'Tournament', '/tournaments/1', 1, '2025-12-25 08:05:00', 9),
(N'Đăng ký thành công',            N'Bạn đã đăng ký thành công giải Hanoi Open Chess 2026.',                   'Tournament', '/tournaments/1', 1, '2025-12-26 09:05:00', 11),
(N'Giải đấu bắt đầu',              N'Hanoi Open Chess 2026 sẽ bắt đầu vào ngày 15/01. Hãy chuẩn bị!',        'Tournament', '/tournaments/1', 1, '2026-01-14 20:00:00', 9),
(N'Giải đấu bắt đầu',              N'Hanoi Open Chess 2026 sẽ bắt đầu vào ngày 15/01. Hãy chuẩn bị!',        'Tournament', '/tournaments/1', 1, '2026-01-14 20:00:00', 11),
(N'Kết quả ván đấu',               N'Ván 1: Bạn thua FM Hùng (0-1). Tiếp tục cố gắng!',                       'Match',      '/matches/1',     1, '2026-01-15 10:50:00', 9),
(N'Chúc mừng vô địch!',            N'Chúc mừng bạn đã vô địch Hanoi Open Chess 2026! Giải thưởng: 5,000,000đ.', 'Tournament', '/tournaments/1', 1, '2026-01-20 18:05:00', 11),
(N'Nhận giải thưởng',              N'Giải thưởng á quân 3,000,000đ đã được cộng vào tài khoản.',               'Payment',    '/wallet',        1, '2026-01-21 10:05:00', 9),

-- Thông báo Tournament 2
(N'Đăng ký thành công',            N'Bạn đã đăng ký thành công giải Saigon Blitz Championship.',              'Tournament', '/tournaments/2', 1, '2026-01-20 09:05:00', 9),
(N'Lịch thi đấu tứ kết',          N'Vòng tứ kết bắt đầu ngày 15/02. Bạn gặp đối thủ Phan Thị Hoa.',        'Match',      '/matches/11',    1, '2026-02-14 20:00:00', 9),
(N'Thắng trận tứ kết!',            N'Chúc mừng bạn thắng vòng tứ kết! Bán kết diễn ra ngày 18/02.',          'Match',      '/matches/15',    0, '2026-02-15 09:15:00', 9),
(N'Lịch bán kết',                  N'Bán kết: Bạn sẽ gặp FM Trần Quốc Hùng vào ngày 18/02 lúc 9:00.',       'Match',      '/matches/15',    0, '2026-02-17 20:00:00', 9),

-- Thông báo hệ thống
(N'Cập nhật hệ thống',             N'Hệ thống CTMS đã được nâng cấp lên phiên bản 2.1.',                      'System',     NULL,             0, '2026-02-10 02:00:00', NULL),
(N'Giải mới sắp mở đăng ký',       N'Đà Nẵng Summer Chess Festival sẽ mở đăng ký từ 20/03.',                 'General',    '/tournaments/3', 0, '2026-02-12 08:00:00', NULL),

-- Report notification
(N'Báo cáo đã được xử lý',         N'Báo cáo #1 của bạn về gian lận đã được xem xét và bác bỏ.',            'Report',     '/reports/1',     1, '2026-02-02 14:00:00', 12);
GO

/* =========================
   26. DEPOSIT
   ========================= */
INSERT INTO Deposit (user_id, method_id, amount, external_transaction_code, proof_url, status, admin_note, processed_by, processed_at, create_at) VALUES
(9,  1, 2000000, 'BANK-20260101-001', '/proofs/deposit_9_1.jpg',  'Success',   N'Đã xác nhận',             1, '2025-12-26 10:00:00', '2025-12-25 14:00:00'),
(11, 2, 1000000, 'MOMO-20260101-001', '/proofs/deposit_11_1.jpg', 'Success',   N'Đã xác nhận qua Momo',    1, '2025-12-27 09:00:00', '2025-12-26 20:00:00'),
(13, 3, 1500000, 'VNPAY-20260102-001','/proofs/deposit_13_1.jpg', 'Success',   N'OK',                       1, '2025-12-28 11:00:00', '2025-12-27 15:00:00'),
(15, 1, 2500000, 'BANK-20260103-001', '/proofs/deposit_15_1.jpg', 'Success',   N'Đã xác nhận',             1, '2025-12-29 10:00:00', '2025-12-28 16:00:00'),
(10, 2, 1000000, 'MOMO-20260120-001', '/proofs/deposit_10_1.jpg', 'Success',   N'OK',                       1, '2026-01-21 10:00:00', '2026-01-20 18:00:00'),
(12, 4, 800000,  'ZALO-20260122-001', '/proofs/deposit_12_1.jpg', 'Success',   N'Đã xác nhận ZaloPay',     1, '2026-01-23 09:00:00', '2026-01-22 20:00:00'),
(14, 1, 500000,  'BANK-20260125-001', '/proofs/deposit_14_1.jpg', 'Success',   N'OK',                       1, '2026-01-26 10:00:00', '2026-01-25 14:00:00'),
(20, 3, 500000,  'VNPAY-20260201-001','/proofs/deposit_20_1.jpg', 'Success',   N'OK',                       1, '2026-02-02 10:00:00', '2026-02-01 22:00:00'),
(17, 2, 1000000, 'MOMO-20260210-001', '/proofs/deposit_17_1.jpg', 'Success',   N'OK',                       1, '2026-02-11 08:00:00', '2026-02-10 19:00:00'),
(16, 1, 300000,  'BANK-20260215-001', '/proofs/deposit_16_1.jpg', 'Pending',   NULL,                        NULL, NULL,                 '2026-02-15 10:00:00'),
(18, 2, 500000,  'MOMO-20260218-001', '/proofs/deposit_18_1.jpg', 'Failed',    N'Sai thông tin giao dịch', 1, '2026-02-19 09:00:00', '2026-02-18 20:00:00');
GO

/* =========================
   27. WITHDRAWAL
   ========================= */
INSERT INTO Withdrawal (user_id, amount, bank_name, bank_account_number, bank_account_name, status, rejection_reason, approved_by, approved_at, bank_transfer_ref, create_at) VALUES
(11, 3000000, N'Vietcombank',    '0071000123456', N'TRAN QUOC HUNG',   'Completed', NULL,                                        1, '2026-01-25 10:00:00', 'VCB-REF-001', '2026-01-22 16:00:00'),
(9,  1500000, N'Techcombank',    '19033000567890', N'LE TRUONG QUANG', 'Completed', NULL,                                        1, '2026-01-28 14:00:00', 'TCB-REF-001', '2026-01-26 09:00:00'),
(13, 1000000, N'MB Bank',        '0801000234567', N'VO HOANG NAM',     'Approved',  NULL,                                        1, '2026-02-10 11:00:00', NULL,           '2026-02-08 15:00:00'),
(15, 500000,  N'BIDV',           '3100000345678', N'NGUYEN HUU SON',   'Pending',   NULL,                                        NULL, NULL,               NULL,           '2026-02-18 14:00:00'),
(17, 200000,  N'Vietcombank',    '0071000987654', N'TRUONG MINH KHAI', 'Rejected',  N'Tên tài khoản không khớp với tên đăng ký', 1, '2026-02-16 09:00:00', NULL,           '2026-02-15 20:00:00');
GO

/* =========================
   28. PAYMENT_TRANSACTION
   ========================= */
INSERT INTO Payment_Transaction (user_id, tournament_id, type, amount, balance_after, description, reference_id, create_at) VALUES
-- Deposits
(9,  NULL, 'Deposit',    2000000,  2000000, N'Nạp tiền qua Bank Transfer',           1,  '2025-12-26 10:00:00'),
(11, NULL, 'Deposit',    1000000,  1000000, N'Nạp tiền qua Momo',                    2,  '2025-12-27 09:00:00'),
(13, NULL, 'Deposit',    1500000,  1500000, N'Nạp tiền qua VNPay',                   3,  '2025-12-28 11:00:00'),
(15, NULL, 'Deposit',    2500000,  2500000, N'Nạp tiền qua Bank Transfer',           4,  '2025-12-29 10:00:00'),

-- Entry fees Tournament 1
(9,  1,    'EntryFee',  -200000,   1800000, N'Phí tham gia Hanoi Open Chess 2026',   1,  '2025-12-28 10:00:00'),
(11, 1,    'EntryFee',  -200000,   800000,  N'Phí tham gia Hanoi Open Chess 2026',   2,  '2025-12-27 14:00:00'),
(13, 1,    'EntryFee',  -200000,   1300000, N'Phí tham gia Hanoi Open Chess 2026',   3,  '2025-12-29 11:00:00'),
(15, 1,    'EntryFee',  -200000,   2300000, N'Phí tham gia Hanoi Open Chess 2026',   4,  '2025-12-30 09:00:00'),

-- Prizes Tournament 1
(11, 1,    'Prize',      5000000,  5800000, N'Giải thưởng Vô địch Hanoi Open 2026',  NULL, '2026-01-21 10:00:00'),
(9,  1,    'Prize',      3000000,  4800000, N'Giải thưởng Á quân Hanoi Open 2026',   NULL, '2026-01-21 10:00:00'),
(13, 1,    'Prize',      2000000,  3100000, N'Giải thưởng Hạng 3 Hanoi Open 2026',   NULL, '2026-01-21 10:00:00'),

-- Deposits cho Tournament 2
(10, NULL, 'Deposit',    1000000,  1000000, N'Nạp tiền qua Momo',                    5,  '2026-01-21 10:00:00'),
(12, NULL, 'Deposit',    800000,   800000,  N'Nạp tiền qua ZaloPay',                 6,  '2026-01-23 09:00:00'),
(14, NULL, 'Deposit',    500000,   500000,  N'Nạp tiền qua Bank Transfer',           7,  '2026-01-26 10:00:00'),
(20, NULL, 'Deposit',    500000,   500000,  N'Nạp tiền qua VNPay',                   8,  '2026-02-02 10:00:00'),

-- Entry fees Tournament 2
(9,  2,    'EntryFee',  -100000,   4700000, N'Phí tham gia Saigon Blitz Championship', 7,  '2026-02-01 10:00:00'),
(10, 2,    'EntryFee',  -100000,   900000,  N'Phí tham gia Saigon Blitz Championship', 8,  '2026-02-02 11:00:00'),
(11, 2,    'EntryFee',  -100000,   5700000, N'Phí tham gia Saigon Blitz Championship', 9,  '2026-02-01 15:00:00'),
(12, 2,    'EntryFee',  -100000,   700000,  N'Phí tham gia Saigon Blitz Championship', 10, '2026-02-03 09:00:00'),
(13, 2,    'EntryFee',  -100000,   3000000, N'Phí tham gia Saigon Blitz Championship', 11, '2026-02-04 14:00:00'),
(14, 2,    'EntryFee',  -100000,   400000,  N'Phí tham gia Saigon Blitz Championship', 12, '2026-02-05 10:00:00'),
(15, 2,    'EntryFee',  -100000,   2200000, N'Phí tham gia Saigon Blitz Championship', 13, '2026-02-06 16:00:00'),
(20, 2,    'EntryFee',  -100000,   400000,  N'Phí tham gia Saigon Blitz Championship', 14, '2026-02-08 11:00:00'),

-- Withdrawals
(11, NULL, 'Withdrawal', -3000000, 2700000, N'Rút tiền về Vietcombank',              1,  '2026-01-25 10:00:00'),
(9,  NULL, 'Withdrawal', -1500000, 3200000, N'Rút tiền về Techcombank',              2,  '2026-01-28 14:00:00');
GO

/* =========================
   29. REPORT
   ========================= */
INSERT INTO Report (reporter_id, accused_id, match_id, description, evidence_url, type, status, note, resolved_by, create_at, resolved_at) VALUES
(12, 9,  11, N'Nghi ngờ đối thủ sử dụng engine hỗ trợ trong trận tứ kết. Các nước đi quá chính xác và nhanh.',
     '/reports/evidence_1.png', 'Cheating', 'Dismissed', N'Đã kiểm tra, không có bằng chứng gian lận. Đối thủ có Elo cao hơn đáng kể.',
     2, '2026-02-15 12:00:00', '2026-02-16 10:00:00'),

(14, 11, 12, N'Đối thủ cố tình kéo dài thời gian khi đang thua rõ ràng.',
     '/reports/evidence_2.png', 'Misconduct', 'Resolved', N'Đã nhắc nhở người chơi. Ghi nhận lỗi vi phạm lần 1.',
     3, '2026-02-15 11:00:00', '2026-02-16 14:00:00'),

(20, NULL, NULL, N'Gặp lỗi khi thanh toán phí tham gia. Tiền đã trừ nhưng trạng thái vẫn chưa cập nhật.',
     '/reports/evidence_3.png', 'TechnicalIssue', 'Resolved', N'Đã xử lý, cập nhật trạng thái thanh toán.',
     2, '2026-02-08 09:00:00', '2026-02-08 15:00:00'),

(10, 15, 13, N'Đối thủ nói chuyện gây mất tập trung trong lúc thi đấu.',
     '/reports/evidence_4.png', 'Misconduct', 'Investigating', NULL,
     NULL, '2026-02-15 14:00:00', NULL);
GO

/* =========================
   30. FEEDBACK
   ========================= */
INSERT INTO Feedback (user_id, tournament_id, match_id, star_rating, comment, status, reply, create_at) VALUES
(9,  1, NULL, 5, N'Giải đấu tổ chức rất chuyên nghiệp. Trọng tài công bằng, địa điểm thoáng mát.',            'approved', N'Cảm ơn bạn! Rất vui vì bạn hài lòng.',    '2026-01-21 20:00:00'),
(11, 1, NULL, 5, N'Tuyệt vời! Giải thưởng hấp dẫn, đối thủ mạnh. Mong được tham gia lần sau.',                 'approved', N'Chúc mừng chức vô địch!',                  '2026-01-21 21:00:00'),
(13, 1, NULL, 4, N'Giải tốt nhưng lịch thi đấu hơi dày. Nên giãn cách 1 ngày giữa các vòng.',                  'approved', N'Cảm ơn góp ý, sẽ cải thiện.',              '2026-01-22 08:00:00'),
(15, 1, NULL, 4, N'Địa điểm đẹp, tổ chức ổn. Wifi hơi yếu.',                                                    'approved', NULL,                                        '2026-01-22 10:00:00'),
(17, 1, NULL, 3, N'Giải ổn nhưng chênh lệch trình độ khá lớn. Nên chia bảng theo Elo.',                         'approved', N'Cảm ơn góp ý, chúng tôi sẽ cân nhắc.',    '2026-01-22 14:00:00'),
(9,  2, 11,  5, N'Trận đấu blitz rất hấp dẫn! Tốc độ thi đấu nhanh, kịch tính.',                               'approved', NULL,                                        '2026-02-15 10:00:00'),
(20, 2, 11,  2, N'Bị loại ngay vòng đầu hơi thất vọng. Mong có thêm consolation bracket.',                      'pending',  NULL,                                        '2026-02-15 13:00:00'),
(14, 2, 12,  3, N'Đối thủ kéo dài thời gian, trọng tài không can thiệp kịp thời.',                              'pending',  NULL,                                        '2026-02-15 12:00:00');
GO

/* =========================
   31. USER_AVATAR_FRAME
   ========================= */
INSERT INTO User_Avatar_Frame (user_id, frame_id, is_equipped, obtained_by) VALUES
(9,  1, 0, 'Default'),
(9,  2, 0, 'Reward'),
(9,  3, 1, 'Reward'),
(10, 1, 1, 'Default'),
(11, 1, 0, 'Default'),
(11, 2, 0, 'Reward'),
(11, 3, 0, 'Reward'),
(11, 4, 1, 'Reward'),
(12, 1, 1, 'Default'),
(13, 1, 0, 'Default'),
(13, 2, 1, 'Reward'),
(14, 1, 1, 'Default'),
(15, 1, 0, 'Default'),
(15, 6, 1, 'Purchase'),
(16, 1, 1, 'Default'),
(17, 1, 1, 'Default'),
(18, 1, 1, 'Default'),
(19, 1, 0, 'Default'),
(19, 7, 1, 'Purchase'),
(20, 1, 1, 'Default');
GO


/* =========================
>>>>>>> Dung
   VERIFICATION
   ========================= */
PRINT N'';
PRINT N'=== DATABASE CREATED SUCCESSFULLY ===';
PRINT N'';
PRINT N'--- Table count ---';

SELECT 'Roles' AS [Table], COUNT(*) AS [Rows] FROM Roles
UNION ALL SELECT 'Permission', COUNT(*) FROM Permission
UNION ALL SELECT 'Role_Permission', COUNT(*) FROM Role_Permission
UNION ALL SELECT 'Payment_Method', COUNT(*) FROM Payment_Method
UNION ALL SELECT 'Chess_Title', COUNT(*) FROM Chess_Title
UNION ALL SELECT 'Avatar_Frame', COUNT(*) FROM Avatar_Frame;

PRINT N'';
PRINT N'--- Permissions per role ---';

SELECT
    r.role_name AS [Role],
    COUNT(rp.permission_id) AS [Permissions]
FROM Roles r
LEFT JOIN Role_Permission rp ON r.role_id = rp.role_id
GROUP BY r.role_name
ORDER BY COUNT(rp.permission_id) DESC;

PRINT N'';
PRINT N'--- Tournaments table now has: tournament_image, rules ---';
GO

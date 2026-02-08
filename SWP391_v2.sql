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

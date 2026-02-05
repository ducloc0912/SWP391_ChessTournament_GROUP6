CREATE TABLE Users (
    user_id INT PRIMARY KEY identity(1,1),
    username NVARCHAR(50),
    first_name NVARCHAR(50) NOT NULL,
    last_name NVARCHAR(50) NOT NULL,
    email NVARCHAR(50) UNIQUE NOT NULL,
    phone_number NVARCHAR(50) UNIQUE NOT NULL,
    address NVARCHAR(50) NOT NULL,
    gender NVARCHAR(20),
    birthday DATE,
    password NVARCHAR(MAX),
    avatar NVARCHAR(MAX),
    balance DECIMAL(18,2) DEFAULT 0,
    rank INT DEFAULT 0, -- funny rank points
    last_login DATETIME,
    create_at DATETIME DEFAULT GETDATE(),
    is_active BIT DEFAULT 1
);
GO

/* =========================
   ROLES & PERMISSIONS
   ========================= */
CREATE TABLE Roles (
    role_id INT IDENTITY(1,1) PRIMARY KEY,
    role_name NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(200)
);

CREATE TABLE Permission (
    permission_id INT PRIMARY KEY,
    permission_name NVARCHAR(50),
    permission_code NVARCHAR(50) UNIQUE,
    module NVARCHAR(50)
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
   TOURNAMENTS
   ========================= */
CREATE TABLE Tournaments (
    tournament_id INT PRIMARY KEY  identity(1,1),
    tournament_name NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    location NVARCHAR(200),
    format NVARCHAR(20) NOT NULL CHECK (format IN ('RoundRobin','KnockOut','Hybrid')),
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
   TOURNAMENT STAFF & REFEREE
   ========================= */
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
    action NVARCHAR(30)
        CHECK (action IN ('Approve','Reject','Delay','Start','Complete','Cancel')),
    from_status NVARCHAR(20),
    to_status NVARCHAR(20)
        CHECK (to_status IN ('Pending','Rejected','Delayed','Ongoing','Completed','Cancelled')),
    note NVARCHAR(500),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES Users(user_id)
);
GO

/* =========================
   PARTICIPANTS
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
   BRACKET / ROUND / MATCH
   ========================= */
CREATE TABLE Bracket (
    bracket_id INT PRIMARY KEY,
    bracket_name NVARCHAR(50),
    tournament_id INT,
    type NVARCHAR(20) NOT NULL,
    status NVARCHAR(20) DEFAULT 'Pending',
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id)
);

CREATE TABLE Round (
    round_id INT PRIMARY KEY,
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
    match_id INT PRIMARY KEY,
    tournament_id INT NOT NULL,
    round_id INT,
    board_number INT,
    white_player_id INT,
    black_player_id INT,
    result NVARCHAR(50),
    termination NVARCHAR(50),
    status NVARCHAR(20),
    start_time DATETIME,
    end_time DATETIME,
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id),
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
GO

/* =========================
   STANDING
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
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
GO

/* =========================
   REPORT & FEEDBACK
   ========================= */
CREATE TABLE Report (
    report_id INT PRIMARY KEY identity(1,1),
    reporter_id INT,
    accused_id INT,
    match_id INT,
    description NVARCHAR(200) NOT NULL,
    evidence_URL NVARCHAR(200) NOT NULL,
    type NVARCHAR(100) NOT NULL,
    status NVARCHAR(50),
    note NVARCHAR(100),
    resolved_by INT,
    creat_at DATETIME DEFAULT GETDATE(),
    resolved_time DATETIME,
    FOREIGN KEY (reporter_id) REFERENCES Users(user_id),
    FOREIGN KEY (accused_id) REFERENCES Users(user_id),
    FOREIGN KEY (resolved_by) REFERENCES Users(user_id),
    FOREIGN KEY (match_id) REFERENCES Matches(match_id)
);

CREATE TABLE Feedback (
    feedback_id INT PRIMARY KEY identity(1,1),
    user_id INT,
    tournament_id INT,
    match_id INT,
    star_rating INT,
    comment NVARCHAR(MAX),
    status NVARCHAR(200),
    reply NVARCHAR(200),
    create_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES Matches(match_id)
);
GO

/* =========================
   BLOG & NOTIFICATION
   ========================= */
CREATE TABLE Blog_Post (
    blog_post_id INT PRIMARY KEY identity(1,1),
    title NVARCHAR(200),
    summary NVARCHAR(500),
    content NVARCHAR(MAX),
    thumbnail_url NVARCHAR(MAX),
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

CREATE TABLE Notification (
    notification_id INT PRIMARY KEY,
    title NVARCHAR(100) NOT NULL,
    message NVARCHAR(MAX),
    type NVARCHAR(20),
    action_URL NVARCHAR(MAX),
    is_read BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);
GO

/* =========================
   PAYMENT
   ========================= */
CREATE TABLE PaymentMethods (
    MethodId INT IDENTITY(1,1) PRIMARY KEY,
    MethodName NVARCHAR(50) NOT NULL,
    Code VARCHAR(20) UNIQUE NOT NULL,
    IsActive BIT DEFAULT 1,
    Description NVARCHAR(200)
);

CREATE TABLE Deposits (
    DepositId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    MethodId INT NOT NULL,
    Amount DECIMAL(18,2) CHECK (Amount > 0),
    ExternalTransactionCode VARCHAR(100) UNIQUE,
    ProofUrl NVARCHAR(MAX),
    Status VARCHAR(20) DEFAULT 'Pending'
        CHECK (Status IN ('Pending','Success','Failed','Cancelled')),
    AdminNote NVARCHAR(MAX),
    ProcessedBy INT,
    ProcessedAt DATETIME,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(user_id),
    FOREIGN KEY (MethodId) REFERENCES PaymentMethods(MethodId),
    FOREIGN KEY (ProcessedBy) REFERENCES Users(user_id)
);

CREATE TABLE Withdrawals (
    WithdrawalId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Amount DECIMAL(18,2) CHECK (Amount > 0),
    BankName NVARCHAR(100) NOT NULL,
    BankAccountNumber VARCHAR(50) NOT NULL,
    BankAccountName NVARCHAR(100) NOT NULL,
    Status VARCHAR(20) DEFAULT 'Pending'
        CHECK (Status IN ('Pending','Approved','Rejected','Completed')),
    RejectionReason NVARCHAR(MAX),
    ApprovedBy INT,
    ApprovedAt DATETIME,
    BankTransferRef VARCHAR(100),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(user_id),
    FOREIGN KEY (ApprovedBy) REFERENCES Users(user_id)
);
GO

/* =========================
   SECURITY
   ========================= */
CREATE TABLE password_reset_otp (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(100) NOT NULL,
    otp NVARCHAR(10) NOT NULL,
    is_used BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    expire_at DATETIME NOT NULL
);
GO

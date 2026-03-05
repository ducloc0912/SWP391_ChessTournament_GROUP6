/* ============================================================
   INSERT 1 GIẢI HYBRID ĐỦ 8 NGƯỜI CHƠI - TEST LUỒNG SETUP
   Chạy trên database SWP391 đã có seed (Users 1-20, Tournaments 1-10).
   Nếu đã có tournament_id = 11, sửa @Tid = 12 (hoặc id trống) rồi chạy lại.
   ============================================================ */
USE SWP391;
GO

DECLARE @Tid INT = 11;

IF EXISTS (SELECT 1 FROM Tournaments WHERE tournament_id = @Tid)
BEGIN
    RAISERROR(N'Tournament_id %d đã tồn tại. Đổi @Tid trong script hoặc xóa giải đó rồi chạy lại.', 16, 1, @Tid);
    RETURN;
END

-- 1. Thêm 1 giải Hybrid (8 người, Upcoming để test setup: STRUCTURE -> PLAYERS -> SCHEDULE -> REFEREE -> COMPLETED)
SET IDENTITY_INSERT Tournaments ON;

INSERT INTO Tournaments (
    tournament_id, tournament_name, description, tournament_image, rules, location,
    format, categories, max_player, min_player, entry_fee, prize_pool, status,
    registration_deadline, start_date, end_date, create_by, create_at, notes
) VALUES (
    @Tid,
    N'CTMS Hybrid Setup Test 2026',
    N'Giải Hybrid đủ 8 người để test luồng setup: Cấu trúc -> Người chơi -> Lịch thi đấu -> Trọng tài -> Hoàn tất.',
    '/tournaments/hybrid-setup-test.jpg',
    N'Giai đoạn 1: Round Robin. Giai đoạn 2: Knock Out top 4. Time control: 60+15. Luật FIDE.',
    N'Online / Trung tâm CTMS',
    'Hybrid',
    'Open',
    8,
    4,
    100000,
    5000000,
    'Upcoming',
    '2026-04-01 23:59:00',
    '2026-04-05 08:00:00',
    '2026-04-10 18:00:00',
    4,  -- create_by: leader_pham (user_id 4)
    GETDATE(),
    N'Giải test luồng setup - 8 người đã đăng ký đủ.'
);

SET IDENTITY_INSERT Tournaments OFF;

-- 2. Thêm 8 người chơi (user_id 9-16: các player có sẵn trong seed), đã thanh toán, Active
INSERT INTO Participants (tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date, notes) VALUES
(@Tid,  9,  'CM',       1, 'Active', 1, '2026-03-01 10:00:00', '2026-02-28 09:00:00', NULL),
(@Tid, 10,  'WIM',      2, 'Active', 1, '2026-03-01 11:00:00', '2026-02-28 10:00:00', NULL),
(@Tid, 11,  'FM',       3, 'Active', 1, '2026-03-01 12:00:00', '2026-02-28 11:00:00', NULL),
(@Tid, 12,  'WCM',      4, 'Active', 1, '2026-03-01 14:00:00', '2026-02-28 14:00:00', NULL),
(@Tid, 13,  'NM',       5, 'Active', 1, '2026-03-01 15:00:00', '2026-02-28 15:00:00', NULL),
(@Tid, 14,  'WFM',      6, 'Active', 1, '2026-03-01 16:00:00', '2026-02-28 16:00:00', NULL),
(@Tid, 15,  'CM',       7, 'Active', 1, '2026-03-01 17:00:00', '2026-02-28 17:00:00', NULL),
(@Tid, 16,  'Unrated',  8, 'Active', 1, '2026-03-01 18:00:00', '2026-02-28 18:00:00', NULL);

-- 3. Trạng thái setup: bắt đầu từ bước STRUCTURE (để test đủ luồng)
INSERT INTO Tournament_Setup_State (tournament_id, current_step, updated_at) VALUES
(@Tid, 'STRUCTURE', GETDATE());

-- 4. Ảnh đại diện giải (tùy chọn)
INSERT INTO Tournament_Images (tournament_id, image_url, display_order) VALUES
(@Tid, '/tournaments/hybrid-setup-test.jpg', 1);

-- 5. Seed ranking cho 8 người (phục vụ bracket khi setup)
INSERT INTO Tournament_Seed (tournament_id, user_id, seed_number, source, created_at, updated_at) VALUES
(@Tid,  9, 1, 'AUTO', GETDATE(), GETDATE()),
(@Tid, 10, 2, 'AUTO', GETDATE(), GETDATE()),
(@Tid, 11, 3, 'AUTO', GETDATE(), GETDATE()),
(@Tid, 12, 4, 'AUTO', GETDATE(), GETDATE()),
(@Tid, 13, 5, 'AUTO', GETDATE(), GETDATE()),
(@Tid, 14, 6, 'AUTO', GETDATE(), GETDATE()),
(@Tid, 15, 7, 'AUTO', GETDATE(), GETDATE()),
(@Tid, 16, 8, 'AUTO', GETDATE(), GETDATE());

PRINT N'Đã thêm giải Hybrid (tournament_id = ' + CAST(@Tid AS NVARCHAR(10)) + N') với 8 người chơi và Tournament_Setup_State = STRUCTURE.';
PRINT N'Vào trang setup giải để test luồng: STRUCTURE -> PLAYERS -> SCHEDULE -> REFEREE -> COMPLETED.';
GO

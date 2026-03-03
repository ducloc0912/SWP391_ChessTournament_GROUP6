-- ============================================================================
-- Insert trọng tài vào các giải và nhánh đấu (để test tính năng thêm trọng tài)
-- Chạy trên database SWP391 sau khi đã có dữ liệu Users, Tournaments, Bracket, Matches
-- Referee: user_id 7 (referee_dang), 8 (referee_bui)
-- ============================================================================

USE SWP391;
GO

-- 1) Tournament_Referee: gán trọng tài vào các giải 4, 5, 6, 7, 8 (các giải đang chưa có hoặc ít trọng tài)
-- Tránh trùng PK: chỉ insert nếu chưa tồn tại (tournament_id, referee_id)
INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by, note)
SELECT 4, 7, 'Chief', 4, N'Trọng tài trưởng - test Vietnam National Rapid'
WHERE NOT EXISTS (SELECT 1 FROM Tournament_Referee WHERE tournament_id = 4 AND referee_id = 7);

INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by, note)
SELECT 4, 8, 'Assistant', 4, N'Trọng tài phụ'
WHERE NOT EXISTS (SELECT 1 FROM Tournament_Referee WHERE tournament_id = 4 AND referee_id = 8);

INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by, note)
SELECT 5, 7, 'Chief', 4, N'Trọng tài trưởng Cần Thơ Open 2026'
WHERE NOT EXISTS (SELECT 1 FROM Tournament_Referee WHERE tournament_id = 5 AND referee_id = 7);

INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by, note)
SELECT 5, 8, 'Assistant', 4, N'Trọng tài phụ Cần Thơ Open'
WHERE NOT EXISTS (SELECT 1 FROM Tournament_Referee WHERE tournament_id = 5 AND referee_id = 8);

INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by, note)
SELECT 6, 7, 'Assistant', 5, N'Trọng tài phụ Hải Phòng Blitz'
WHERE NOT EXISTS (SELECT 1 FROM Tournament_Referee WHERE tournament_id = 6 AND referee_id = 7);

INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by, note)
SELECT 6, 8, 'Chief', 5, N'Trọng tài trưởng Hải Phòng Blitz'
WHERE NOT EXISTS (SELECT 1 FROM Tournament_Referee WHERE tournament_id = 6 AND referee_id = 8);

INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by, note)
SELECT 7, 7, 'Chief', 6, N'Trọng tài trưởng Bình Dương Hybrid Masters'
WHERE NOT EXISTS (SELECT 1 FROM Tournament_Referee WHERE tournament_id = 7 AND referee_id = 7);

INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by, note)
SELECT 7, 8, 'Assistant', 6, N'Trọng tài phụ Bình Dương'
WHERE NOT EXISTS (SELECT 1 FROM Tournament_Referee WHERE tournament_id = 7 AND referee_id = 8);

INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by, note)
SELECT 8, 7, 'Chief', 4, N'Trọng tài trưởng Nha Trang Summer Rapid'
WHERE NOT EXISTS (SELECT 1 FROM Tournament_Referee WHERE tournament_id = 8 AND referee_id = 7);

INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by, note)
SELECT 8, 8, 'Assistant', 4, N'Trọng tài phụ Nha Trang'
WHERE NOT EXISTS (SELECT 1 FROM Tournament_Referee WHERE tournament_id = 8 AND referee_id = 8);

GO

-- 2) Match_Referee: gán trọng tài vào các trận trong nhánh đấu (bracket)
-- Trận 17 (Chung kết T2) chưa có trọng tài trong seed gốc -> thêm để test
IF EXISTS (SELECT 1 FROM Matches WHERE match_id = 17)
   AND NOT EXISTS (SELECT 1 FROM Match_Referee WHERE match_id = 17 AND referee_id = 7)
BEGIN
    INSERT INTO Match_Referee (match_id, referee_id, role) VALUES (17, 7, 'Main');
END
IF EXISTS (SELECT 1 FROM Matches WHERE match_id = 17)
   AND NOT EXISTS (SELECT 1 FROM Match_Referee WHERE match_id = 17 AND referee_id = 8)
BEGIN
    INSERT INTO Match_Referee (match_id, referee_id, role) VALUES (17, 8, 'Assistant');
END
GO

-- 3) (Tùy chọn) Nếu bạn đã tạo thêm Bracket/Matches cho giải 5, 6, 7 - có thể thêm Match_Referee
--    sau khi có round_id và match_id. Ví dụ khi đã generate bracket cho T5:
-- INSERT INTO Match_Referee (match_id, referee_id, role)
-- SELECT m.match_id, 7, 'Main'
-- FROM Matches m
-- JOIN Round r ON m.round_id = r.round_id
-- JOIN Bracket b ON r.bracket_id = b.bracket_id
-- WHERE b.tournament_id = 5 AND NOT EXISTS (SELECT 1 FROM Match_Referee mr WHERE mr.match_id = m.match_id);

PRINT N'Đã insert trọng tài vào Tournament_Referee (giải 4,5,6,7,8) và Match_Referee (trận 17).';
GO

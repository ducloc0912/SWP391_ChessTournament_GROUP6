/* =====================================================================
   INSERT THÊM: 1 giải KnockOut đang diễn ra (Ongoing) để test Referee Matches.
   Chạy script này SAU khi đã chạy ctms_full_schema_and_seed.sql (hoặc DB đã có Users, Tournaments 1-5).

   Giải: 8 người, KnockOut, 3 vòng (Tứ kết → Bán kết → Chung kết), 7 trận.
   Trọng tài 7 và 8 được gán vào giải; một số trận gán referee 7, một số gán 8 để test.
   ===================================================================== */
USE SWP391;
GO

-- Tournament 6: KnockOut, Ongoing
SET IDENTITY_INSERT Tournaments ON;
INSERT INTO Tournaments (tournament_id, tournament_name, description, location, format, categories, max_player, min_player, entry_fee, prize_pool, status, registration_deadline, start_date, end_date, create_by) VALUES
(6, N'Giải KnockOut Đang diễn ra 2026', N'Giải loại trực tiếp đang diễn ra để test điều hành trận.', N'Hà Nội', 'KnockOut', 'Open', 8, 4, 100000, 4000000, 'Ongoing', '2026-03-01 23:59:00', '2026-03-05 08:00:00', '2026-03-15 18:00:00', 4);
SET IDENTITY_INSERT Tournaments OFF;
GO

-- Participants: 8 players (user_id 9-16)
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

-- Tournament_Referee: referee 7 (Chief), 8 (Assistant)
INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by) VALUES
(6,7,'Chief',4),(6,8,'Assistant',4);
GO

-- Tournament_Setup_State: setup đã hoàn tất
INSERT INTO Tournament_Setup_State (tournament_id, current_step, bracket_status, players_status, schedule_status, referees_status) VALUES
(6, 'COMPLETED', 'FINALIZED', 'FINALIZED', 'FINALIZED', 'FINALIZED');
GO

-- Bracket: 1 bracket KnockOut
SET IDENTITY_INSERT Bracket ON;
INSERT INTO Bracket (bracket_id, bracket_name, tournament_id, type, status) VALUES
(3, N'KnockOut Bracket', 6, 'KnockOut', 'Ongoing');
SET IDENTITY_INSERT Bracket OFF;
GO

-- Round: 3 vòng (1=Tứ kết, 2=Bán kết, 3=Chung kết)
SET IDENTITY_INSERT Round ON;
INSERT INTO Round (round_id, bracket_id, tournament_id, name, round_index, start_time, end_time, is_completed) VALUES
(8, 3, 6, N'Tứ kết', 1, '2026-03-05 08:00:00', '2026-03-05 12:00:00', 1),
(9, 3, 6, N'Bán kết', 2, '2026-03-08 08:00:00', '2026-03-08 12:00:00', 0),
(10, 3, 6, N'Chung kết', 3, '2026-03-12 09:00:00', '2026-03-12 14:00:00', 0);
SET IDENTITY_INSERT Round OFF;
GO

-- Matches: 4 tứ kết (2 đã xong, 2 Scheduled), 2 bán kết (Scheduled), 1 chung kết (Scheduled)
-- Round 1 (Tứ kết): 9vs10, 11vs12, 13vs14, 15vs16. Match 17,18 completed; 19,20 Scheduled.
-- Round 2 (Bán kết): 21,22 Scheduled (winner 17 vs winner 18, winner 19 vs winner 20) - đặt tạm 9,11 và 13,15
-- Round 3 (Chung kết): 23 Scheduled - đặt tạm 9,13
SET IDENTITY_INSERT Matches ON;
INSERT INTO Matches (match_id, tournament_id, round_id, board_number, white_player_id, black_player_id, result, status, start_time) VALUES
-- Tứ kết (Round 8)
(17, 6, 8, 1, 9, 10, '1-0', 'Completed', '2026-03-05 08:00:00'),
(18, 6, 8, 2, 11, 12, '0-1', 'Completed', '2026-03-05 08:30:00'),
(19, 6, 8, 3, 13, 14, NULL, 'Scheduled', '2026-03-05 09:00:00'),
(20, 6, 8, 4, 15, 16, NULL, 'Scheduled', '2026-03-05 09:30:00'),
-- Bán kết (Round 9): winner 17=9, winner 18=12; winner 19/20 tạm 13,15
(21, 6, 9, 1, 9, 12, NULL, 'Scheduled', '2026-03-08 08:00:00'),
(22, 6, 9, 2, 13, 15, NULL, 'Scheduled', '2026-03-08 08:30:00'),
-- Chung kết (Round 10)
(23, 6, 10, 1, 9, 13, NULL, 'Scheduled', '2026-03-12 09:00:00');
SET IDENTITY_INSERT Matches OFF;
GO

-- Match_Referee: gán trọng tài 7 và 8 vào các trận (để test Referee Matches)
INSERT INTO Match_Referee (match_id, referee_id, role) VALUES
(17, 7, 'Main'),
(18, 8, 'Main'),
(19, 7, 'Main'),
(20, 8, 'Main'),
(21, 7, 'Main'),
(22, 8, 'Main'),
(23, 7, 'Main');
GO

-- Prize_Template (tùy chọn)
INSERT INTO Prize_Template (tournament_id, rank_position, percentage, label) VALUES
(6,1,60,'Vô địch'),(6,2,30,'Á quân'),(6,3,10,'Hạng ba');
GO

PRINT N'Đã insert xong giải KnockOut đang diễn ra (tournament_id = 6).';
PRINT N'Referee 7 (referee1@gmail.com) và 8 (referee2@gmail.com) có trận được phân công.';
PRINT N'Trận 19, 20, 21, 22, 23 đang Scheduled – có thể test Bắt đầu trận / Nhập kết quả.';
GO

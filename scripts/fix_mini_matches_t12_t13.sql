/* =====================================================================
   FIX: Insert Mini_matches cho T12 (match 24-31) và T13 (match 32-38)
   Dùng khi referee view hiện "Trắng: — / Đen: —" vì mini_matches bị thiếu.
   Safe to run nhiều lần – chỉ insert khi chưa có dữ liệu cho match đó.
   ===================================================================== */

USE SWP391;
GO

/* ---- T12 Round 1 Completed ---- */

-- Match 24: player1=19(Phong) vs player2=18(Vy) → 19 thắng 1.5-0.5
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 24 AND game_number = 1 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (24,1,0,19,18,'1-0',NULL,'Completed','2026-03-05 08:00:00','2026-03-05 08:30:00');
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 24 AND game_number = 2 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (24,2,0,18,19,'1/2-1/2',NULL,'Completed','2026-03-05 08:30:00','2026-03-05 09:00:00');

-- Match 25: 23 vs 24 → 23 thắng 2-0
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 25 AND game_number = 1 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (25,1,0,23,24,'1-0',NULL,'Completed','2026-03-05 08:00:00','2026-03-05 08:30:00');
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 25 AND game_number = 2 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (25,2,0,24,23,'0-1',NULL,'Completed','2026-03-05 08:30:00','2026-03-05 09:00:00');

-- Match 26: 17 vs 22 → hòa 1-1
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 26 AND game_number = 1 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (26,1,0,17,22,'1/2-1/2',NULL,'Completed','2026-03-05 08:00:00','2026-03-05 08:30:00');
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 26 AND game_number = 2 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (26,2,0,22,17,'1/2-1/2',NULL,'Completed','2026-03-05 08:30:00','2026-03-05 09:00:00');

-- Match 27: 20 vs 21 → 21 thắng 0.5-1.5
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 27 AND game_number = 1 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (27,1,0,20,21,'0-1',NULL,'Completed','2026-03-05 08:00:00','2026-03-05 08:30:00');
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 27 AND game_number = 2 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (27,2,0,21,20,'1/2-1/2',NULL,'Completed','2026-03-05 08:30:00','2026-03-05 09:00:00');
GO

/* ---- T12 Round 2 Scheduled ---- */

IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 28 AND game_number = 1 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (28,1,0,18,23,'*',NULL,'Scheduled','2026-03-07 08:00:00',NULL);
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 28 AND game_number = 2 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (28,2,0,23,18,'*',NULL,'Scheduled','2026-03-07 08:30:00',NULL);

IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 29 AND game_number = 1 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (29,1,0,24,19,'*',NULL,'Scheduled','2026-03-07 08:00:00',NULL);
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 29 AND game_number = 2 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (29,2,0,19,24,'*',NULL,'Scheduled','2026-03-07 08:30:00',NULL);

IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 30 AND game_number = 1 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (30,1,0,22,21,'*',NULL,'Scheduled','2026-03-07 08:00:00',NULL);
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 30 AND game_number = 2 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (30,2,0,21,22,'*',NULL,'Scheduled','2026-03-07 08:30:00',NULL);

IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 31 AND game_number = 1 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (31,1,0,17,20,'*',NULL,'Scheduled','2026-03-07 08:00:00',NULL);
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 31 AND game_number = 2 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (31,2,0,20,17,'*',NULL,'Scheduled','2026-03-07 08:30:00',NULL);
GO

/* ---- T13 Tứ kết Completed ---- */

-- Match 32: 19(Phong) trắng vs 18(Vy) đen → 19 thắng 1.5-0.5
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 32 AND game_number = 1 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (32,1,0,19,18,'1-0',NULL,'Completed','2026-03-10 08:00:00','2026-03-10 08:30:00');
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 32 AND game_number = 2 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (32,2,0,18,19,'1/2-1/2',NULL,'Completed','2026-03-10 08:30:00','2026-03-10 09:00:00');

-- Match 33: 23(Long) vs 24(Anh) → 23 thắng 2-0
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 33 AND game_number = 1 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (33,1,0,23,24,'1-0',NULL,'Completed','2026-03-10 08:30:00','2026-03-10 09:00:00');
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 33 AND game_number = 2 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (33,2,0,24,23,'0-1',NULL,'Completed','2026-03-10 09:00:00','2026-03-10 09:30:00');
GO

/* ---- T13 Tứ kết Scheduled ---- */

-- Match 34: 17(Khải) vs 22(Yến)
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 34 AND game_number = 1 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (34,1,0,17,22,'*',NULL,'Scheduled','2026-03-10 09:00:00',NULL);
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 34 AND game_number = 2 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (34,2,0,22,17,'*',NULL,'Scheduled','2026-03-10 09:30:00',NULL);

-- Match 35: 20(Hoa) vs 21(Bình)
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 35 AND game_number = 1 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (35,1,0,20,21,'*',NULL,'Scheduled','2026-03-10 09:30:00',NULL);
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 35 AND game_number = 2 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (35,2,0,21,20,'*',NULL,'Scheduled','2026-03-10 10:00:00',NULL);
GO

/* ---- T13 Bán kết Scheduled ---- */

-- Match 36: 19(Phong) vs 22(Yến)
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 36 AND game_number = 1 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (36,1,0,19,22,'*',NULL,'Scheduled','2026-03-14 08:00:00',NULL);
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 36 AND game_number = 2 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (36,2,0,22,19,'*',NULL,'Scheduled','2026-03-14 08:30:00',NULL);

-- Match 37: 23(Long) vs 20(Hoa)
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 37 AND game_number = 1 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (37,1,0,23,20,'*',NULL,'Scheduled','2026-03-14 08:30:00',NULL);
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 37 AND game_number = 2 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (37,2,0,20,23,'*',NULL,'Scheduled','2026-03-14 09:00:00',NULL);
GO

/* ---- T13 Chung kết Scheduled ---- */

-- Match 38: 19(Phong) vs 23(Long)
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 38 AND game_number = 1 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (38,1,0,19,23,'*',NULL,'Scheduled','2026-03-18 09:00:00',NULL);
IF NOT EXISTS (SELECT 1 FROM Mini_matches WHERE match_id = 38 AND game_number = 2 AND is_tiebreak = 0)
    INSERT INTO Mini_matches (match_id,game_number,is_tiebreak,white_player_id,black_player_id,result,termination,status,start_time,end_time)
    VALUES (38,2,0,23,19,'*',NULL,'Scheduled','2026-03-18 09:30:00',NULL);
GO

/* ========================= VERIFICATION ========================= */
PRINT N'';
PRINT N'=== Kiểm tra Mini_matches theo tournament ===';
SELECT
    m.tournament_id,
    t.tournament_name,
    m.match_id,
    m.board_number,
    COUNT(mm.mini_match_id) AS so_van
FROM Matches m
JOIN Tournaments t ON t.tournament_id = m.tournament_id
LEFT JOIN Mini_matches mm ON mm.match_id = m.match_id
WHERE m.tournament_id IN (12, 13)
GROUP BY m.tournament_id, t.tournament_name, m.match_id, m.board_number
ORDER BY m.tournament_id, m.match_id;
GO

/* =====================================================================
   CTMS - SEED: 2 giải Ongoing mới (T12 + T13) – players 17-24
   Chạy sau khi đã có database SWP391 với full schema + seed gốc.

   T12: Giải RoundRobin Ongoing – Đà Nẵng (create_by leader3, id=6)
   T13: Giải KnockOut  Ongoing – Cần Thơ  (create_by leader2, id=5)

   Players 17-24 (player9–player16), chưa tham gia giải Ongoing nào.
   Seeds theo ELO: 19(2200)→1, 23(1780)→2, 17(1680)→3, 22(1650)→4,
                   20(1580)→5, 21(1520)→6, 24(1420)→7, 18(1350)→8

   IDs đã dùng trong seed gốc:
     Tournaments     : 1-11
     Participants    : 1-96
     Bracket         : 1-3
     Round           : 1-10
     Matches         : 1-23
   ===================================================================== */

USE SWP391;
GO

/* ========================= TOURNAMENTS ========================= */
SET IDENTITY_INSERT Tournaments ON;

INSERT INTO Tournaments
    (tournament_id, tournament_name, description, location, format,
     max_player, min_player, entry_fee, prize_pool, status,
     registration_deadline, start_date, end_date, create_by)
SELECT 12,
    N'Giải RoundRobin Ongoing 2026 – Đà Nẵng',
    N'Giải vòng tròn 8 người đang diễn ra tại Đà Nẵng.',
    N'Đà Nẵng', 'RoundRobin', 8, 4, 100000, 4000000, 'Ongoing',
    '2026-03-01 23:59:00', '2026-03-05 08:00:00', '2026-03-15 18:00:00', 6
WHERE NOT EXISTS (SELECT 1 FROM Tournaments WHERE tournament_id = 12);

INSERT INTO Tournaments
    (tournament_id, tournament_name, description, location, format,
     max_player, min_player, entry_fee, prize_pool, status,
     registration_deadline, start_date, end_date, create_by)
SELECT 13,
    N'Giải KnockOut Ongoing 2026 – Cần Thơ',
    N'Giải loại trực tiếp 8 người đang diễn ra tại Cần Thơ.',
    N'Cần Thơ', 'KnockOut', 8, 4, 120000, 5000000, 'Ongoing',
    '2026-03-05 23:59:00', '2026-03-10 08:00:00', '2026-03-20 18:00:00', 5
WHERE NOT EXISTS (SELECT 1 FROM Tournaments WHERE tournament_id = 13);

SET IDENTITY_INSERT Tournaments OFF;
GO

/* ========================= PARTICIPANTS ========================= */
/* T12: ids 97-104 | T13: ids 105-112 */
SET IDENTITY_INSERT Participants ON;

-- T12 (tournament_id=12, 8 người, participant_ids 97-104)
INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date)
SELECT  97, 12, 19, 'NM',      1, 'Active', 1, '2026-03-02 10:00:00', '2026-03-01 08:00:00' WHERE NOT EXISTS (SELECT 1 FROM Participants WHERE participant_id =  97);
INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date)
SELECT  98, 12, 23, 'Unrated', 2, 'Active', 1, '2026-03-02 11:00:00', '2026-03-01 09:00:00' WHERE NOT EXISTS (SELECT 1 FROM Participants WHERE participant_id =  98);
INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date)
SELECT  99, 12, 17, 'Unrated', 3, 'Active', 1, '2026-03-02 12:00:00', '2026-03-01 10:00:00' WHERE NOT EXISTS (SELECT 1 FROM Participants WHERE participant_id =  99);
INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date)
SELECT 100, 12, 22, 'Unrated', 4, 'Active', 1, '2026-03-02 13:00:00', '2026-03-01 11:00:00' WHERE NOT EXISTS (SELECT 1 FROM Participants WHERE participant_id = 100);
INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date)
SELECT 101, 12, 20, 'Unrated', 5, 'Active', 1, '2026-03-02 14:00:00', '2026-03-01 12:00:00' WHERE NOT EXISTS (SELECT 1 FROM Participants WHERE participant_id = 101);
INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date)
SELECT 102, 12, 21, 'Unrated', 6, 'Active', 1, '2026-03-02 15:00:00', '2026-03-01 13:00:00' WHERE NOT EXISTS (SELECT 1 FROM Participants WHERE participant_id = 102);
INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date)
SELECT 103, 12, 24, 'Unrated', 7, 'Active', 1, '2026-03-02 16:00:00', '2026-03-01 14:00:00' WHERE NOT EXISTS (SELECT 1 FROM Participants WHERE participant_id = 103);
INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date)
SELECT 104, 12, 18, 'Unrated', 8, 'Active', 1, '2026-03-02 17:00:00', '2026-03-01 15:00:00' WHERE NOT EXISTS (SELECT 1 FROM Participants WHERE participant_id = 104);

-- T13 (tournament_id=13, 8 người, participant_ids 105-112)
INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date)
SELECT 105, 13, 19, 'NM',      1, 'Active', 1, '2026-03-06 10:00:00', '2026-03-05 08:00:00' WHERE NOT EXISTS (SELECT 1 FROM Participants WHERE participant_id = 105);
INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date)
SELECT 106, 13, 23, 'Unrated', 2, 'Active', 1, '2026-03-06 11:00:00', '2026-03-05 09:00:00' WHERE NOT EXISTS (SELECT 1 FROM Participants WHERE participant_id = 106);
INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date)
SELECT 107, 13, 17, 'Unrated', 3, 'Active', 1, '2026-03-06 12:00:00', '2026-03-05 10:00:00' WHERE NOT EXISTS (SELECT 1 FROM Participants WHERE participant_id = 107);
INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date)
SELECT 108, 13, 22, 'Unrated', 4, 'Active', 1, '2026-03-06 13:00:00', '2026-03-05 11:00:00' WHERE NOT EXISTS (SELECT 1 FROM Participants WHERE participant_id = 108);
INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date)
SELECT 109, 13, 20, 'Unrated', 5, 'Active', 1, '2026-03-06 14:00:00', '2026-03-05 12:00:00' WHERE NOT EXISTS (SELECT 1 FROM Participants WHERE participant_id = 109);
INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date)
SELECT 110, 13, 21, 'Unrated', 6, 'Active', 1, '2026-03-06 15:00:00', '2026-03-05 13:00:00' WHERE NOT EXISTS (SELECT 1 FROM Participants WHERE participant_id = 110);
INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date)
SELECT 111, 13, 24, 'Unrated', 7, 'Active', 1, '2026-03-06 16:00:00', '2026-03-05 14:00:00' WHERE NOT EXISTS (SELECT 1 FROM Participants WHERE participant_id = 111);
INSERT INTO Participants (participant_id, tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, registration_date)
SELECT 112, 13, 18, 'Unrated', 8, 'Active', 1, '2026-03-06 17:00:00', '2026-03-05 15:00:00' WHERE NOT EXISTS (SELECT 1 FROM Participants WHERE participant_id = 112);

SET IDENTITY_INSERT Participants OFF;
GO

/* ========================= TOURNAMENT_REFEREE ========================= */
INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by)
SELECT 12, 7, 'Chief',     6 WHERE NOT EXISTS (SELECT 1 FROM Tournament_Referee WHERE tournament_id=12 AND referee_id=7);
INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by)
SELECT 12, 8, 'Assistant', 6 WHERE NOT EXISTS (SELECT 1 FROM Tournament_Referee WHERE tournament_id=12 AND referee_id=8);
INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by)
SELECT 13, 7, 'Chief',     5 WHERE NOT EXISTS (SELECT 1 FROM Tournament_Referee WHERE tournament_id=13 AND referee_id=7);
INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by)
SELECT 13, 8, 'Assistant', 5 WHERE NOT EXISTS (SELECT 1 FROM Tournament_Referee WHERE tournament_id=13 AND referee_id=8);
GO

/* ========================= TOURNAMENT_SETUP_STATE ========================= */
INSERT INTO Tournament_Setup_State (tournament_id, current_step, bracket_status, players_status, schedule_status, referees_status)
SELECT 12, 'COMPLETED', 'FINALIZED', 'FINALIZED', 'FINALIZED', 'FINALIZED'
WHERE NOT EXISTS (SELECT 1 FROM Tournament_Setup_State WHERE tournament_id = 12);

INSERT INTO Tournament_Setup_State (tournament_id, current_step, bracket_status, players_status, schedule_status, referees_status)
SELECT 13, 'COMPLETED', 'FINALIZED', 'FINALIZED', 'FINALIZED', 'FINALIZED'
WHERE NOT EXISTS (SELECT 1 FROM Tournament_Setup_State WHERE tournament_id = 13);
GO

/* ========================= BRACKET ========================= */
SET IDENTITY_INSERT Bracket ON;

INSERT INTO Bracket (bracket_id, bracket_name, tournament_id, type, status)
SELECT 4, N'Bảng chính',   12, 'RoundRobin', 'Ongoing'
WHERE NOT EXISTS (SELECT 1 FROM Bracket WHERE bracket_id = 4);

INSERT INTO Bracket (bracket_id, bracket_name, tournament_id, type, status)
SELECT 5, N'KnockOut Bracket', 13, 'KnockOut', 'Ongoing'
WHERE NOT EXISTS (SELECT 1 FROM Bracket WHERE bracket_id = 5);

SET IDENTITY_INSERT Bracket OFF;
GO

/* ========================= ROUND ========================= */
SET IDENTITY_INSERT Round ON;

-- T12 RoundRobin: Round 1 đã xong, Round 2 chưa bắt đầu
INSERT INTO Round (round_id, bracket_id, tournament_id, name, round_index, start_time, end_time, is_completed)
SELECT 11, 4, 12, 'Round 1', 1, '2026-03-05 08:00:00', '2026-03-05 12:00:00', 1
WHERE NOT EXISTS (SELECT 1 FROM Round WHERE round_id = 11);

INSERT INTO Round (round_id, bracket_id, tournament_id, name, round_index, start_time, end_time, is_completed)
SELECT 12, 4, 12, 'Round 2', 2, '2026-03-07 08:00:00', '2026-03-07 12:00:00', 0
WHERE NOT EXISTS (SELECT 1 FROM Round WHERE round_id = 12);

-- T13 KnockOut: Tứ kết (2 trận xong / 2 chờ), Bán kết + Chung kết chờ
INSERT INTO Round (round_id, bracket_id, tournament_id, name, round_index, start_time, end_time, is_completed)
SELECT 13, 5, 13, N'Tứ kết',   1, '2026-03-10 08:00:00', '2026-03-10 14:00:00', 0
WHERE NOT EXISTS (SELECT 1 FROM Round WHERE round_id = 13);

INSERT INTO Round (round_id, bracket_id, tournament_id, name, round_index, start_time, end_time, is_completed)
SELECT 14, 5, 13, N'Bán kết',  2, '2026-03-14 08:00:00', '2026-03-14 14:00:00', 0
WHERE NOT EXISTS (SELECT 1 FROM Round WHERE round_id = 14);

INSERT INTO Round (round_id, bracket_id, tournament_id, name, round_index, start_time, end_time, is_completed)
SELECT 15, 5, 13, N'Chung kết',3, '2026-03-18 09:00:00', '2026-03-18 14:00:00', 0
WHERE NOT EXISTS (SELECT 1 FROM Round WHERE round_id = 15);

SET IDENTITY_INSERT Round OFF;
GO

/* ========================= MATCHES ========================= */
/* T12 Round 1 – Completed:
     24: 19 vs 18 → 1.5-0.5 (19 thắng)
     25: 23 vs 24 → 2.0-0.0 (23 thắng)
     26: 17 vs 22 → 1.0-1.0 (hòa)
     27: 20 vs 21 → 0.5-1.5 (21 thắng)
   T12 Round 2 – Scheduled (đổi cặp):
     28: 18 vs 23
     29: 24 vs 19
     30: 22 vs 21
     31: 17 vs 20
   T13 Tứ kết – 2 Completed + 2 Scheduled:
     32: 19 vs 18 → 1.5-0.5 (19 thắng)
     33: 23 vs 24 → 2.0-0.0 (23 thắng)
     34: 17 vs 22 → Scheduled
     35: 20 vs 21 → Scheduled
   T13 Bán kết – Scheduled:
     36: 19 vs 22  (seed-based expectation)
     37: 23 vs 20
   T13 Chung kết – Scheduled:
     38: 19 vs 23  (seed-based expectation)
*/
SET IDENTITY_INSERT Matches ON;

-- T12 Round 1 Completed
INSERT INTO Matches (match_id,tournament_id,round_id,group_id,board_number,player1_id,player2_id,player1_score,player2_score,winner_id,result,status,start_time,end_time)
SELECT 24,12,11,NULL,1,19,18,1.5,0.5,19,'player1','Completed','2026-03-05 08:00:00','2026-03-05 09:00:00' WHERE NOT EXISTS (SELECT 1 FROM Matches WHERE match_id=24);
INSERT INTO Matches (match_id,tournament_id,round_id,group_id,board_number,player1_id,player2_id,player1_score,player2_score,winner_id,result,status,start_time,end_time)
SELECT 25,12,11,NULL,2,23,24,2.0,0.0,23,'player1','Completed','2026-03-05 08:00:00','2026-03-05 09:00:00' WHERE NOT EXISTS (SELECT 1 FROM Matches WHERE match_id=25);
INSERT INTO Matches (match_id,tournament_id,round_id,group_id,board_number,player1_id,player2_id,player1_score,player2_score,winner_id,result,status,start_time,end_time)
SELECT 26,12,11,NULL,3,17,22,1.0,1.0,NULL,'draw','Completed','2026-03-05 08:00:00','2026-03-05 09:00:00' WHERE NOT EXISTS (SELECT 1 FROM Matches WHERE match_id=26);
INSERT INTO Matches (match_id,tournament_id,round_id,group_id,board_number,player1_id,player2_id,player1_score,player2_score,winner_id,result,status,start_time,end_time)
SELECT 27,12,11,NULL,4,20,21,0.5,1.5,21,'player2','Completed','2026-03-05 08:00:00','2026-03-05 09:00:00' WHERE NOT EXISTS (SELECT 1 FROM Matches WHERE match_id=27);

-- T12 Round 2 Scheduled
INSERT INTO Matches (match_id,tournament_id,round_id,group_id,board_number,player1_id,player2_id,player1_score,player2_score,winner_id,result,status,start_time,end_time)
SELECT 28,12,12,NULL,1,18,23,0,0,NULL,'pending','Scheduled','2026-03-07 08:00:00',NULL WHERE NOT EXISTS (SELECT 1 FROM Matches WHERE match_id=28);
INSERT INTO Matches (match_id,tournament_id,round_id,group_id,board_number,player1_id,player2_id,player1_score,player2_score,winner_id,result,status,start_time,end_time)
SELECT 29,12,12,NULL,2,24,19,0,0,NULL,'pending','Scheduled','2026-03-07 08:00:00',NULL WHERE NOT EXISTS (SELECT 1 FROM Matches WHERE match_id=29);
INSERT INTO Matches (match_id,tournament_id,round_id,group_id,board_number,player1_id,player2_id,player1_score,player2_score,winner_id,result,status,start_time,end_time)
SELECT 30,12,12,NULL,3,22,21,0,0,NULL,'pending','Scheduled','2026-03-07 08:00:00',NULL WHERE NOT EXISTS (SELECT 1 FROM Matches WHERE match_id=30);
INSERT INTO Matches (match_id,tournament_id,round_id,group_id,board_number,player1_id,player2_id,player1_score,player2_score,winner_id,result,status,start_time,end_time)
SELECT 31,12,12,NULL,4,17,20,0,0,NULL,'pending','Scheduled','2026-03-07 08:00:00',NULL WHERE NOT EXISTS (SELECT 1 FROM Matches WHERE match_id=31);

-- T13 Tứ kết: 2 Completed
INSERT INTO Matches (match_id,tournament_id,round_id,group_id,board_number,player1_id,player2_id,player1_score,player2_score,winner_id,result,status,start_time,end_time)
SELECT 32,13,13,NULL,1,19,18,1.5,0.5,19,'player1','Completed','2026-03-10 08:00:00','2026-03-10 09:00:00' WHERE NOT EXISTS (SELECT 1 FROM Matches WHERE match_id=32);
INSERT INTO Matches (match_id,tournament_id,round_id,group_id,board_number,player1_id,player2_id,player1_score,player2_score,winner_id,result,status,start_time,end_time)
SELECT 33,13,13,NULL,2,23,24,2.0,0.0,23,'player1','Completed','2026-03-10 08:30:00','2026-03-10 09:30:00' WHERE NOT EXISTS (SELECT 1 FROM Matches WHERE match_id=33);

-- T13 Tứ kết: 2 Scheduled
INSERT INTO Matches (match_id,tournament_id,round_id,group_id,board_number,player1_id,player2_id,player1_score,player2_score,winner_id,result,status,start_time,end_time)
SELECT 34,13,13,NULL,3,17,22,0,0,NULL,'pending','Scheduled','2026-03-10 09:00:00',NULL WHERE NOT EXISTS (SELECT 1 FROM Matches WHERE match_id=34);
INSERT INTO Matches (match_id,tournament_id,round_id,group_id,board_number,player1_id,player2_id,player1_score,player2_score,winner_id,result,status,start_time,end_time)
SELECT 35,13,13,NULL,4,20,21,0,0,NULL,'pending','Scheduled','2026-03-10 09:30:00',NULL WHERE NOT EXISTS (SELECT 1 FROM Matches WHERE match_id=35);

-- T13 Bán kết: Scheduled
INSERT INTO Matches (match_id,tournament_id,round_id,group_id,board_number,player1_id,player2_id,player1_score,player2_score,winner_id,result,status,start_time,end_time)
SELECT 36,13,14,NULL,1,19,22,0,0,NULL,'pending','Scheduled','2026-03-14 08:00:00',NULL WHERE NOT EXISTS (SELECT 1 FROM Matches WHERE match_id=36);
INSERT INTO Matches (match_id,tournament_id,round_id,group_id,board_number,player1_id,player2_id,player1_score,player2_score,winner_id,result,status,start_time,end_time)
SELECT 37,13,14,NULL,2,23,20,0,0,NULL,'pending','Scheduled','2026-03-14 08:30:00',NULL WHERE NOT EXISTS (SELECT 1 FROM Matches WHERE match_id=37);

-- T13 Chung kết: Scheduled
INSERT INTO Matches (match_id,tournament_id,round_id,group_id,board_number,player1_id,player2_id,player1_score,player2_score,winner_id,result,status,start_time,end_time)
SELECT 38,13,15,NULL,1,19,23,0,0,NULL,'pending','Scheduled','2026-03-18 09:00:00',NULL WHERE NOT EXISTS (SELECT 1 FROM Matches WHERE match_id=38);

SET IDENTITY_INSERT Matches OFF;
GO

/* ========================= MATCH_REFEREE ========================= */
/* Referee 7 = bàn lẻ, Referee 8 = bàn chẵn */
INSERT INTO Match_Referee (match_id, referee_id, role)
SELECT 24, 7, 'Main' WHERE NOT EXISTS (SELECT 1 FROM Match_Referee WHERE match_id=24 AND referee_id=7);
INSERT INTO Match_Referee (match_id, referee_id, role)
SELECT 25, 8, 'Main' WHERE NOT EXISTS (SELECT 1 FROM Match_Referee WHERE match_id=25 AND referee_id=8);
INSERT INTO Match_Referee (match_id, referee_id, role)
SELECT 26, 7, 'Main' WHERE NOT EXISTS (SELECT 1 FROM Match_Referee WHERE match_id=26 AND referee_id=7);
INSERT INTO Match_Referee (match_id, referee_id, role)
SELECT 27, 8, 'Main' WHERE NOT EXISTS (SELECT 1 FROM Match_Referee WHERE match_id=27 AND referee_id=8);
INSERT INTO Match_Referee (match_id, referee_id, role)
SELECT 28, 7, 'Main' WHERE NOT EXISTS (SELECT 1 FROM Match_Referee WHERE match_id=28 AND referee_id=7);
INSERT INTO Match_Referee (match_id, referee_id, role)
SELECT 29, 8, 'Main' WHERE NOT EXISTS (SELECT 1 FROM Match_Referee WHERE match_id=29 AND referee_id=8);
INSERT INTO Match_Referee (match_id, referee_id, role)
SELECT 30, 7, 'Main' WHERE NOT EXISTS (SELECT 1 FROM Match_Referee WHERE match_id=30 AND referee_id=7);
INSERT INTO Match_Referee (match_id, referee_id, role)
SELECT 31, 8, 'Main' WHERE NOT EXISTS (SELECT 1 FROM Match_Referee WHERE match_id=31 AND referee_id=8);
INSERT INTO Match_Referee (match_id, referee_id, role)
SELECT 32, 7, 'Main' WHERE NOT EXISTS (SELECT 1 FROM Match_Referee WHERE match_id=32 AND referee_id=7);
INSERT INTO Match_Referee (match_id, referee_id, role)
SELECT 33, 8, 'Main' WHERE NOT EXISTS (SELECT 1 FROM Match_Referee WHERE match_id=33 AND referee_id=8);
INSERT INTO Match_Referee (match_id, referee_id, role)
SELECT 34, 7, 'Main' WHERE NOT EXISTS (SELECT 1 FROM Match_Referee WHERE match_id=34 AND referee_id=7);
INSERT INTO Match_Referee (match_id, referee_id, role)
SELECT 35, 8, 'Main' WHERE NOT EXISTS (SELECT 1 FROM Match_Referee WHERE match_id=35 AND referee_id=8);
INSERT INTO Match_Referee (match_id, referee_id, role)
SELECT 36, 7, 'Main' WHERE NOT EXISTS (SELECT 1 FROM Match_Referee WHERE match_id=36 AND referee_id=7);
INSERT INTO Match_Referee (match_id, referee_id, role)
SELECT 37, 8, 'Main' WHERE NOT EXISTS (SELECT 1 FROM Match_Referee WHERE match_id=37 AND referee_id=8);
INSERT INTO Match_Referee (match_id, referee_id, role)
SELECT 38, 7, 'Main' WHERE NOT EXISTS (SELECT 1 FROM Match_Referee WHERE match_id=38 AND referee_id=7);
GO

/* ========================= MINI_MATCHES ========================= */
/* T12 Round 1 – Completed
   Match 24 (19 vs 18): ván1: 19 trắng 1-0; ván2: 18 trắng 1/2-1/2 → 19 thắng 1.5-0.5
   Match 25 (23 vs 24): ván1: 23 trắng 1-0; ván2: 24 trắng 0-1 → 23 thắng 2-0
   Match 26 (17 vs 22): ván1: 17 trắng 1/2-1/2; ván2: 22 trắng 1/2-1/2 → hòa 1-1
   Match 27 (20 vs 21): ván1: 20 trắng 0-1; ván2: 21 trắng 1/2-1/2 → 21 thắng 1.5-0.5
   T13 Tứ kết – Completed
   Match 32 (19 vs 18): ván1: 19 trắng 1-0; ván2: 18 trắng 1/2-1/2 → 19 thắng 1.5-0.5
   Match 33 (23 vs 24): ván1: 23 trắng 1-0; ván2: 24 trắng 0-1 → 23 thắng 2-0
*/
INSERT INTO Mini_matches (match_id, game_number, is_tiebreak, white_player_id, black_player_id, result, termination, status, start_time, end_time) VALUES
-- Match 24
(24,1,0,19,18,'1-0',    NULL,'Completed','2026-03-05 08:00:00','2026-03-05 08:30:00'),
(24,2,0,18,19,'1/2-1/2',NULL,'Completed','2026-03-05 08:30:00','2026-03-05 09:00:00'),
-- Match 25
(25,1,0,23,24,'1-0',    NULL,'Completed','2026-03-05 08:00:00','2026-03-05 08:30:00'),
(25,2,0,24,23,'0-1',    NULL,'Completed','2026-03-05 08:30:00','2026-03-05 09:00:00'),
-- Match 26
(26,1,0,17,22,'1/2-1/2',NULL,'Completed','2026-03-05 08:00:00','2026-03-05 08:30:00'),
(26,2,0,22,17,'1/2-1/2',NULL,'Completed','2026-03-05 08:30:00','2026-03-05 09:00:00'),
-- Match 27
(27,1,0,20,21,'0-1',    NULL,'Completed','2026-03-05 08:00:00','2026-03-05 08:30:00'),
(27,2,0,21,20,'1/2-1/2',NULL,'Completed','2026-03-05 08:30:00','2026-03-05 09:00:00'),
-- T12 Round 2 Scheduled
(28,1,0,18,23,'*',NULL,'Scheduled','2026-03-07 08:00:00',NULL),
(28,2,0,23,18,'*',NULL,'Scheduled','2026-03-07 08:30:00',NULL),
(29,1,0,24,19,'*',NULL,'Scheduled','2026-03-07 08:00:00',NULL),
(29,2,0,19,24,'*',NULL,'Scheduled','2026-03-07 08:30:00',NULL),
(30,1,0,22,21,'*',NULL,'Scheduled','2026-03-07 08:00:00',NULL),
(30,2,0,21,22,'*',NULL,'Scheduled','2026-03-07 08:30:00',NULL),
(31,1,0,17,20,'*',NULL,'Scheduled','2026-03-07 08:00:00',NULL),
(31,2,0,20,17,'*',NULL,'Scheduled','2026-03-07 08:30:00',NULL),
-- Match 32
(32,1,0,19,18,'1-0',    NULL,'Completed','2026-03-10 08:00:00','2026-03-10 08:30:00'),
(32,2,0,18,19,'1/2-1/2',NULL,'Completed','2026-03-10 08:30:00','2026-03-10 09:00:00'),
-- Match 33
(33,1,0,23,24,'1-0',    NULL,'Completed','2026-03-10 08:30:00','2026-03-10 09:00:00'),
(33,2,0,24,23,'0-1',    NULL,'Completed','2026-03-10 09:00:00','2026-03-10 09:30:00'),
-- T13 Tứ kết Scheduled
(34,1,0,17,22,'*',NULL,'Scheduled','2026-03-10 09:00:00',NULL),
(34,2,0,22,17,'*',NULL,'Scheduled','2026-03-10 09:30:00',NULL),
(35,1,0,20,21,'*',NULL,'Scheduled','2026-03-10 09:30:00',NULL),
(35,2,0,21,20,'*',NULL,'Scheduled','2026-03-10 10:00:00',NULL),
-- T13 Bán kết Scheduled
(36,1,0,19,22,'*',NULL,'Scheduled','2026-03-14 08:00:00',NULL),
(36,2,0,22,19,'*',NULL,'Scheduled','2026-03-14 08:30:00',NULL),
(37,1,0,23,20,'*',NULL,'Scheduled','2026-03-14 08:30:00',NULL),
(37,2,0,20,23,'*',NULL,'Scheduled','2026-03-14 09:00:00',NULL),
-- T13 Chung kết Scheduled
(38,1,0,19,23,'*',NULL,'Scheduled','2026-03-18 09:00:00',NULL),
(38,2,0,23,19,'*',NULL,'Scheduled','2026-03-18 09:30:00',NULL);
GO

/* ========================= STANDING (T12 sau Round 1) ========================= */
/* Kết quả Round 1:
   Match 24: 19 thắng (won=1, pt=1.0) | 18 thua (lost=1, pt=0.0)
   Match 25: 23 thắng (won=1, pt=1.0) | 24 thua (lost=1, pt=0.0)
   Match 26: 17 hòa  (draw=1, pt=0.5) | 22 hòa  (draw=1, pt=0.5)
   Match 27: 21 thắng (won=1, pt=1.0) | 20 thua  (lost=1, pt=0.0)
*/
INSERT INTO Standing (tournament_id, user_id, matches_played, won, drawn, lost, point, current_rank)
SELECT 12, 19, 1, 1, 0, 0, 1.0, NULL WHERE NOT EXISTS (SELECT 1 FROM Standing WHERE tournament_id=12 AND user_id=19);
INSERT INTO Standing (tournament_id, user_id, matches_played, won, drawn, lost, point, current_rank)
SELECT 12, 23, 1, 1, 0, 0, 1.0, NULL WHERE NOT EXISTS (SELECT 1 FROM Standing WHERE tournament_id=12 AND user_id=23);
INSERT INTO Standing (tournament_id, user_id, matches_played, won, drawn, lost, point, current_rank)
SELECT 12, 21, 1, 1, 0, 0, 1.0, NULL WHERE NOT EXISTS (SELECT 1 FROM Standing WHERE tournament_id=12 AND user_id=21);
INSERT INTO Standing (tournament_id, user_id, matches_played, won, drawn, lost, point, current_rank)
SELECT 12, 17, 1, 0, 1, 0, 0.5, NULL WHERE NOT EXISTS (SELECT 1 FROM Standing WHERE tournament_id=12 AND user_id=17);
INSERT INTO Standing (tournament_id, user_id, matches_played, won, drawn, lost, point, current_rank)
SELECT 12, 22, 1, 0, 1, 0, 0.5, NULL WHERE NOT EXISTS (SELECT 1 FROM Standing WHERE tournament_id=12 AND user_id=22);
INSERT INTO Standing (tournament_id, user_id, matches_played, won, drawn, lost, point, current_rank)
SELECT 12, 20, 1, 0, 0, 1, 0.0, NULL WHERE NOT EXISTS (SELECT 1 FROM Standing WHERE tournament_id=12 AND user_id=20);
INSERT INTO Standing (tournament_id, user_id, matches_played, won, drawn, lost, point, current_rank)
SELECT 12, 24, 1, 0, 0, 1, 0.0, NULL WHERE NOT EXISTS (SELECT 1 FROM Standing WHERE tournament_id=12 AND user_id=24);
INSERT INTO Standing (tournament_id, user_id, matches_played, won, drawn, lost, point, current_rank)
SELECT 12, 18, 1, 0, 0, 1, 0.0, NULL WHERE NOT EXISTS (SELECT 1 FROM Standing WHERE tournament_id=12 AND user_id=18);

/* T13 KnockOut standing (2 trận tứ kết đã xong) */
INSERT INTO Standing (tournament_id, user_id, matches_played, won, drawn, lost, point, current_rank)
SELECT 13, 19, 1, 1, 0, 0, 1.0, NULL WHERE NOT EXISTS (SELECT 1 FROM Standing WHERE tournament_id=13 AND user_id=19);
INSERT INTO Standing (tournament_id, user_id, matches_played, won, drawn, lost, point, current_rank)
SELECT 13, 23, 1, 1, 0, 0, 1.0, NULL WHERE NOT EXISTS (SELECT 1 FROM Standing WHERE tournament_id=13 AND user_id=23);
INSERT INTO Standing (tournament_id, user_id, matches_played, won, drawn, lost, point, current_rank)
SELECT 13, 18, 1, 0, 0, 1, 0.0, NULL WHERE NOT EXISTS (SELECT 1 FROM Standing WHERE tournament_id=13 AND user_id=18);
INSERT INTO Standing (tournament_id, user_id, matches_played, won, drawn, lost, point, current_rank)
SELECT 13, 24, 1, 0, 0, 1, 0.0, NULL WHERE NOT EXISTS (SELECT 1 FROM Standing WHERE tournament_id=13 AND user_id=24);
GO

/* ========================= PRIZE_TEMPLATE ========================= */
INSERT INTO Prize_Template (tournament_id, rank_position, percentage, label)
SELECT 12, 1, 50, N'Vô địch'  WHERE NOT EXISTS (SELECT 1 FROM Prize_Template WHERE tournament_id=12 AND rank_position=1);
INSERT INTO Prize_Template (tournament_id, rank_position, percentage, label)
SELECT 12, 2, 30, N'Á quân'   WHERE NOT EXISTS (SELECT 1 FROM Prize_Template WHERE tournament_id=12 AND rank_position=2);
INSERT INTO Prize_Template (tournament_id, rank_position, percentage, label)
SELECT 12, 3, 20, N'Hạng ba'  WHERE NOT EXISTS (SELECT 1 FROM Prize_Template WHERE tournament_id=12 AND rank_position=3);

INSERT INTO Prize_Template (tournament_id, rank_position, percentage, label)
SELECT 13, 1, 60, N'Vô địch'  WHERE NOT EXISTS (SELECT 1 FROM Prize_Template WHERE tournament_id=13 AND rank_position=1);
INSERT INTO Prize_Template (tournament_id, rank_position, percentage, label)
SELECT 13, 2, 30, N'Á quân'   WHERE NOT EXISTS (SELECT 1 FROM Prize_Template WHERE tournament_id=13 AND rank_position=2);
INSERT INTO Prize_Template (tournament_id, rank_position, percentage, label)
SELECT 13, 3, 10, N'Hạng ba'  WHERE NOT EXISTS (SELECT 1 FROM Prize_Template WHERE tournament_id=13 AND rank_position=3);
GO

/* ========================= VERIFICATION ========================= */
PRINT N'';
PRINT N'=== 2 giải Ongoing mới đã thêm thành công ===';
SELECT tournament_id, tournament_name, format, status,
       (SELECT COUNT(*) FROM Participants p WHERE p.tournament_id = t.tournament_id) AS so_nguoi
FROM Tournaments t WHERE tournament_id IN (12, 13);
GO

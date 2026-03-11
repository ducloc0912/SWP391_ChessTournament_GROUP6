-- Insert 6 blog posts (run when Blog_Post table already exists)
-- Author IDs: 2,3,4 = staff/leader users from ctms_full_schema_and_seed

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

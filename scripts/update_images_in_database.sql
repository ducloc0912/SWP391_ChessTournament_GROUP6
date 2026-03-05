-- =============================================================================
-- Cập nhật ảnh trong database cho:
--   1. Avatar của player (Users.avatar)  -> hiển thị ở TOP PLAYERS trên trang chủ
--   2. Thumbnail/banner của bài viết (Blog_Post.thumbnail_url) -> hiển thị ở Latest Blog
-- =============================================================================
-- Định dạng lưu trong DB:
--   - Đường dẫn tương đối: bắt đầu bằng / (vd: /ctms/uploads/avatars/xxx.jpg).
--     App chạy với context path /ctms thì dùng /ctms/uploads/avatars/... hoặc
--     /ctms/uploads/blog/... để FE resolve đúng thành URL đầy đủ.
--   - URL đầy đủ: https://... hoặc http://... thì giữ nguyên.
-- =============================================================================

USE SWP391;
GO

-- ----- 1. AVATAR CỦA PLAYER (bảng Users, cột avatar) -----
-- Cột: Users.avatar (NVARCHAR(500))
-- Ví dụ (context path /ctms, dùng luôn các ảnh đang có trong thư mục FE `assets/image`):
--   -> Copy các file sau sang thư mục deploy:  ctms/src/main/webapp/uploads/avatars/
--      952792579ca4f9e0836ceca4cc253c01.jpg
--      08118f77077fd9e6795319a2c6428cbc.jpg
--      96ef486bfb872c9ed5624c7763e55ea4.jpg
--      487c55215d12b2b7275d13526ab0c844.jpg
--      09ab0a288e7cf90b3e94f8e5f4c8921d.jpg
--   -> Sau đó chạy các lệnh (ví dụ):
-- UPDATE Users SET avatar = N'/ctms/uploads/avatars/952792579ca4f9e0836ceca4cc253c01.jpg' WHERE user_id = 1;
-- UPDATE Users SET avatar = N'/ctms/uploads/avatars/08118f77077fd9e6795319a2c6428cbc.jpg' WHERE user_id = 2;
-- UPDATE Users SET avatar = N'/ctms/uploads/avatars/96ef486bfb872c9ed5624c7763e55ea4.jpg' WHERE user_id = 3;

-- Cập nhật nhiều user (sửa user_id và đường dẫn ảnh):
/*
UPDATE Users SET avatar = N'/ctms/uploads/avatars/952792579ca4f9e0836ceca4cc253c01.jpg' WHERE user_id = 1;
UPDATE Users SET avatar = N'/ctms/uploads/avatars/08118f77077fd9e6795319a2c6428cbc.jpg' WHERE user_id = 2;
UPDATE Users SET avatar = N'/ctms/uploads/avatars/96ef486bfb872c9ed5624c7763e55ea4.jpg' WHERE user_id = 3;
*/


-- ----- 2. THUMBNAIL/BANNER CỦA BÀI VIẾT (bảng Blog_Post, cột thumbnail_url) -----
-- Cột: Blog_Post.thumbnail_url
-- Ví dụ: dùng lại các ảnh trong `assets/image` làm thumbnail cho blog.
--   -> Copy file 08118f77077fd9e6795319a2c6428cbc.jpg sang ctms/src/main/webapp/uploads/blog/
--   -> Sau đó:
-- UPDATE Blog_Post SET thumbnail_url = N'/ctms/uploads/blog/08118f77077fd9e6795319a2c6428cbc.jpg' WHERE blog_post_id = 1;

-- Cập nhật nhiều bài viết:
/*
UPDATE Blog_Post SET thumbnail_url = N'/ctms/uploads/blog/08118f77077fd9e6795319a2c6428cbc.jpg' WHERE blog_post_id = 1;
UPDATE Blog_Post SET thumbnail_url = N'/ctms/uploads/blog/96ef486bfb872c9ed5624c7763e55ea4.jpg' WHERE blog_post_id = 2;
UPDATE Blog_Post SET thumbnail_url = N'/ctms/uploads/blog/487c55215d12b2b7275d13526ab0c844.jpg' WHERE blog_post_id = 3;
*/


-- ----- Kiểm tra sau khi cập nhật -----
-- SELECT user_id, first_name, last_name, avatar FROM Users WHERE avatar IS NOT NULL;
-- SELECT blog_post_id, title, thumbnail_url FROM Blog_Post WHERE thumbnail_url IS NOT NULL;

PRINT N'Bỏ comment các lệnh UPDATE trên, thay user_id/blog_post_id và đường dẫn ảnh của bạn.';
GO

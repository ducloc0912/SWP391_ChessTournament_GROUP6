package com.example.DAO;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import com.example.model.dto.TournamentDTO;
import com.example.model.entity.BlogPost;
import com.example.model.entity.User;
import com.example.model.enums.BlogStatus;
import com.example.util.DBContext;

public class HomeDAO extends DBContext {

    // 1. Lấy 3 giải đấu sắp tới (Ngày bắt đầu > Hiện tại)
    public List<TournamentDTO> getUpcomingTournaments() {
        List<TournamentDTO> list = new ArrayList<>();
        String sql = "SELECT TOP 3 * FROM Tournaments " +
                     "WHERE start_date > GETDATE() " +
                     "ORDER BY start_date ASC";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                TournamentDTO t = new TournamentDTO();
                t.setTournamentId(rs.getInt("tournament_id"));
                t.setTournamentName(rs.getString("tournament_name"));
                t.setDescription(rs.getString("description"));
                t.setLocation(rs.getString("location"));
                t.setFormat(rs.getString("format"));
                t.setMaxPlayer(rs.getInt("max_player"));
                t.setMinPlayer(rs.getInt("min_player"));
                t.setEntryFee(rs.getBigDecimal("entry_fee"));
                t.setPrizePool(rs.getBigDecimal("prize_pool"));
                t.setStatus(rs.getString("status"));
                // Cột trong DB hiện tại là registration_deadline
                t.setRegistrationDeadline(rs.getTimestamp("registration_deadline"));
                t.setStartDate(rs.getTimestamp("start_date"));
                t.setEndDate(rs.getTimestamp("end_date"));
                t.setCreateBy(rs.getInt("create_by"));
                t.setCreateAt(rs.getTimestamp("create_at"));

                list.add(t);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // 2. Lấy Top 5 người chơi có Rank cao nhất
    public List<User> getTopPlayers() {
        List<User> list = new ArrayList<>();
        String sql = "SELECT TOP 5 user_id, first_name, last_name, avatar, rank FROM Users ORDER BY rank DESC";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                User u = new User();
                u.setUserId(rs.getInt("user_id"));
                u.setFirstName(rs.getString("first_name"));
                u.setLastName(rs.getString("last_name"));
                u.setAvatar(rs.getString("avatar"));
                u.setRank((Integer) rs.getObject("rank"));

                list.add(u);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // 3. Lấy các blog public mới nhất cho trang chủ
    public List<BlogPost> getLatestPublicBlogs() {
        List<BlogPost> list = new ArrayList<>();
        String sql = "SELECT TOP 5 * FROM Blog_Post " +
                     "WHERE status = ? " +
                     "ORDER BY ISNULL(publish_at, create_at) DESC";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, BlogStatus.Public.name());

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    BlogPost b = new BlogPost();
                    b.setBlogPostId(rs.getInt("blog_post_id"));
                    b.setTitle(rs.getString("title"));
                    b.setSummary(rs.getString("summary"));
                    b.setContent(rs.getString("content"));
                    b.setThumbnailUrl(rs.getString("thumbnail_url"));
                    b.setAuthorId(rs.getInt("author_id"));
                    // Để đơn giản, không parse category/status chi tiết ở đây
                    b.setViews(rs.getInt("views"));
                    b.setPublishAt(rs.getTimestamp("publish_at"));
                    b.setCreateAt(rs.getTimestamp("create_at"));
                    b.setUpdateAt(rs.getTimestamp("update_at"));
                    list.add(b);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }
}
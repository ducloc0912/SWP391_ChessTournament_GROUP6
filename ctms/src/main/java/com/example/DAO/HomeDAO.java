package com.example.DAO;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import com.example.model.entity.*;
import com.example.model.enums.TournamentFormat;
import com.example.model.enums.TournamentStatus;
import com.example.util.DBContext;

public class HomeDAO extends DBContext {

    // 1. Lấy 3 giải đấu sắp tới (Ngày bắt đầu > Hiện tại)
    public List<Tournament> getUpcomingTournaments() {
        List<Tournament> list = new ArrayList<>();
        // SQL Server syntax: TOP 3
        String sql = "SELECT TOP 3 * FROM Tournaments " +
                "WHERE start_date > GETDATE() " +
                "ORDER BY start_date ASC";

        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Tournament t = new Tournament();
                t.setTournamentId(rs.getInt("tournament_id"));
                t.setTournamentName(rs.getString("tournament_name"));
                t.setDescription(rs.getString("description"));
                t.setLocation(rs.getString("location"));
                if (rs.getString("format") != null)
                    t.setFormat(TournamentFormat.valueOf(rs.getString("format")));
                t.setCategories(rs.getString("categories"));
                t.setMaxPlayer(rs.getInt("max_player"));
                t.setMinPlayer(rs.getInt("min_player"));

                // BigDecimal
                t.setEntryFee(rs.getBigDecimal("entry_fee"));
                t.setPrizePool(rs.getBigDecimal("prize_pool"));

                if (rs.getString("status") != null)
                    t.setStatus(TournamentStatus.valueOf(rs.getString("status")));
                if (rs.getTimestamp("registration_dealine") != null)
                    t.setRegistrationDeadline(rs.getTimestamp("registration_dealine").toLocalDateTime());
                if (rs.getTimestamp("start_date") != null)
                    t.setStartDate(rs.getTimestamp("start_date").toLocalDateTime());
                if (rs.getTimestamp("end_date") != null)
                    t.setEndDate(rs.getTimestamp("end_date").toLocalDateTime());
                t.setCreateBy(rs.getInt("create_by"));
                if (rs.getTimestamp("create_at") != null)
                    t.setCreateAt(rs.getTimestamp("create_at").toLocalDateTime());

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
        String sql = "SELECT TOP 5 user_id, first_name, last_name, avarta, rank FROM Users ORDER BY rank DESC";

        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                User u = new User();
                u.setUserId(rs.getInt("user_id"));
                u.setFirstName(rs.getString("first_name"));
                u.setLastName(rs.getString("last_name"));
                // Chú ý: avarta trong DB
                u.setAvatar(rs.getString("avarta"));
                // Chú ý: rank object
                u.setRank((Integer) rs.getObject("rank"));

                list.add(u);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // 3. Lấy 3 blog mới nhất được publish
    public List<BlogPost> getLatestPublicBlogs() {
        List<BlogPost> list = new ArrayList<>();
        String sql = "SELECT TOP 3 * FROM Blog_Post WHERE status = 'Public' ORDER BY publish_at DESC, create_at DESC";

        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                BlogPost b = new BlogPost();
                b.setBlogPostId(rs.getInt("blog_post_id"));
                b.setTitle(rs.getString("title"));
                b.setSummary(rs.getString("summary"));
                b.setThumbnailUrl(rs.getString("thumbnail_url"));
                b.setAuthorId(rs.getInt("author_id"));
                // status / category
                b.setPublishAt(rs.getTimestamp("publish_at"));
                b.setCreateAt(rs.getTimestamp("create_at"));
                list.add(b);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }
}
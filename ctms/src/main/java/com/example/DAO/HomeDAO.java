package com.example.DAO;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

import com.example.model.entity.BlogPost;
import com.example.model.entity.Tournament;
import com.example.model.entity.User;
import com.example.model.enums.BlogCategory;
import com.example.model.enums.BlogStatus;
import com.example.model.enums.TournamentFormat;
import com.example.model.enums.TournamentStatus;
import com.example.util.DBContext;
import com.example.util.EncodingUtil;

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
                t.setTournamentName(EncodingUtil.fixUtf8Mojibake(rs.getString("tournament_name")));
                t.setDescription(EncodingUtil.fixUtf8Mojibake(rs.getString("description")));
                t.setLocation(rs.getString("location"));
                String formatStr = rs.getString("format");
                if (formatStr != null) {
                    try {
                        t.setFormat(TournamentFormat.valueOf(formatStr));
                    } catch (Exception ignored) { }
                }
                t.setCategories(rs.getString("categories"));
                t.setMaxPlayer(rs.getInt("max_player"));
                t.setMinPlayer(rs.getInt("min_player"));
                t.setEntryFee(rs.getBigDecimal("entry_fee"));
                t.setPrizePool(rs.getBigDecimal("prize_pool"));
                String statusStr = rs.getString("status");
                if (statusStr != null) {
                    try {
                        t.setStatus(TournamentStatus.valueOf(statusStr));
                    } catch (Exception ignored) { }
                }
                Timestamp tsReg = rs.getTimestamp("registration_deadline");
                t.setRegistrationDeadline(tsReg != null ? tsReg.toLocalDateTime() : null);
                Timestamp tsStart = rs.getTimestamp("start_date");
                t.setStartDate(tsStart != null ? tsStart.toLocalDateTime() : null);
                Timestamp tsEnd = rs.getTimestamp("end_date");
                t.setEndDate(tsEnd != null ? tsEnd.toLocalDateTime() : null);
                t.setCreateBy(rs.getInt("create_by"));
                Timestamp tsCreate = rs.getTimestamp("create_at");
                t.setCreateAt(tsCreate != null ? tsCreate.toLocalDateTime() : null);
                t.setNotes(rs.getString("notes"));
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
                u.setFirstName(EncodingUtil.fixUtf8Mojibake(rs.getString("first_name")));
                u.setLastName(EncodingUtil.fixUtf8Mojibake(rs.getString("last_name")));
                u.setAvatar(rs.getString("avatar"));
                // Chú ý: rank object
                u.setRank((Integer) rs.getObject("rank"));
                
                list.add(u);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // 3. Lấy 3 blog public mới nhất cho trang home (không yêu cầu đăng nhập)
    public List<BlogPost> getLatestPublicBlogs() {
        List<BlogPost> list = new ArrayList<>();
        String sql = """
                SELECT TOP 3 *
                FROM Blog_Post
                WHERE status = 'Public'
                ORDER BY ISNULL(publish_at, create_at) DESC
                """;

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                BlogPost b = new BlogPost();
                b.setBlogPostId(rs.getInt("blog_post_id"));
                b.setTitle(EncodingUtil.fixUtf8Mojibake(rs.getString("title")));
                b.setSummary(EncodingUtil.fixUtf8Mojibake(rs.getString("summary")));
                b.setContent(EncodingUtil.fixUtf8Mojibake(rs.getString("content")));
                b.setThumbnailUrl(rs.getString("thumbnail_url"));
                b.setAuthorId(rs.getInt("author_id"));
                b.setCategories(parseCategory(rs.getString("categories")));
                b.setStatus(parseStatus(rs.getString("status")));
                b.setViews(rs.getInt("views"));
                b.setPublishAt(rs.getTimestamp("publish_at"));
                b.setCreateAt(rs.getTimestamp("create_at"));
                b.setUpdateAt(rs.getTimestamp("update_at"));
                list.add(b);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return list;
    }

    private BlogCategory parseCategory(String value) {
        if (value == null) return null;
        for (BlogCategory category : BlogCategory.values()) {
            if (category.name().equalsIgnoreCase(value)) {
                return category;
            }
        }
        return null;
    }

    private BlogStatus parseStatus(String value) {
        if (value == null) return null;
        for (BlogStatus status : BlogStatus.values()) {
            if (status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }
        return null;
    }
}
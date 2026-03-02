package com.example.DAO;

import com.example.model.dto.FeedbackDTO;
import com.example.util.DBContext;
import com.example.util.EncodingUtil;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class FeedbackDAO {

    // 1. Lấy tất cả feedback (có phân trang)
    public List<FeedbackDTO> getAllFeedbacksWithUsers(int page, int pageSize) throws SQLException {
        List<FeedbackDTO> feedbacks = new ArrayList<>();
        String sql = "SELECT f.feedback_id, f.user_id, f.tournament_id, f.match_id, " +
                "f.star_rating, f.comment, f.status, f.reply, f.create_at, " +
                "u.first_name, u.last_name, u.avatar, u.email " +
                "FROM Feedback f " +
                "LEFT JOIN Users u ON f.user_id = u.user_id " +
                "WHERE f.status = 'approved' " + // Chỉ lấy feedback đã được duyệt
                "ORDER BY f.create_at DESC " +
                "OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";

        try (Connection conn = DBContext.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, (page - 1) * pageSize);
            stmt.setInt(2, pageSize);

            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                FeedbackDTO feedback = mapResultSetToFeedbackDTO(rs);
                feedbacks.add(feedback);
            }
        }
        return feedbacks;
    }

    // 2. Lấy feedback cho trang chủ (top đánh giá cao)
    public List<FeedbackDTO> getTopFeedbacksForHomepage(int limit) throws SQLException {
        List<FeedbackDTO> feedbacks = new ArrayList<>();
        String sql = "SELECT TOP " + limit + " f.feedback_id, f.user_id, f.tournament_id, f.match_id, " +
                "f.star_rating, f.comment, f.status, f.reply, f.create_at, " +
                "u.first_name, u.last_name, u.avatar, u.email " +
                "FROM Feedback f " +
                "LEFT JOIN Users u ON f.user_id = u.user_id " +
                "WHERE f.status = 'approved' AND f.star_rating >= 4 " +
                "ORDER BY f.star_rating DESC, f.create_at DESC";

        try (Connection conn = DBContext.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                FeedbackDTO feedback = mapResultSetToFeedbackDTO(rs);
                feedbacks.add(feedback);
            }
        }
        return feedbacks;
    }

    // 3. Thêm feedback mới
    public int addFeedback(FeedbackDTO feedback) throws SQLException {
        String sql = "INSERT INTO Feedback (user_id, tournament_id, match_id, " +
                "star_rating, comment, status) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = DBContext.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setInt(1, feedback.getUserId());
            stmt.setObject(2, feedback.getTournamentId());
            stmt.setObject(3, feedback.getMatchId());
            stmt.setInt(4, feedback.getStarRating());
            stmt.setString(5, feedback.getComment());
            stmt.setString(6, "pending"); // Mặc định là pending chờ duyệt

            int affectedRows = stmt.executeUpdate();

            if (affectedRows > 0) {
                try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        return generatedKeys.getInt(1);
                    }
                }
            }
            return -1;
        }
    }

    // 4. Lấy feedback theo user
    public List<FeedbackDTO> getFeedbacksByUserId(int userId) throws SQLException {
        List<FeedbackDTO> feedbacks = new ArrayList<>();
        String sql = "SELECT f.feedback_id, f.user_id, f.tournament_id, f.match_id, " +
                "f.star_rating, f.comment, f.status, f.reply, f.create_at, " +
                "u.first_name, u.last_name, u.avatar, u.email " +
                "FROM Feedback f " +
                "LEFT JOIN Users u ON f.user_id = u.user_id " +
                "WHERE f.user_id = ? " +
                "ORDER BY f.create_at DESC";

        try (Connection conn = DBContext.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, userId);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                FeedbackDTO feedback = mapResultSetToFeedbackDTO(rs);
                feedbacks.add(feedback);
            }
        }
        return feedbacks;
    }

    // 5. Cập nhật status feedback (duyệt/từ chối)
    public boolean updateFeedbackStatus(int feedbackId, String status, String reply) throws SQLException {
        String sql = "UPDATE Feedback SET status = ?, reply = ? WHERE feedback_id = ?";

        try (Connection conn = DBContext.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, status);
            stmt.setString(2, reply);
            stmt.setInt(3, feedbackId);

            return stmt.executeUpdate() > 0;
        }
    }

    // 6. Lấy tổng số feedback
    public int getTotalFeedbackCount() throws SQLException {
        String sql = "SELECT COUNT(*) as total FROM Feedback WHERE status = 'approved'";

        try (Connection conn = DBContext.getConnection();
                Statement stmt = conn.createStatement();
                ResultSet rs = stmt.executeQuery(sql)) {

            if (rs.next()) {
                return rs.getInt("total");
            }
            return 0;
        }
    }

    // Helper method: Map ResultSet to FeedbackDTO
    private FeedbackDTO mapResultSetToFeedbackDTO(ResultSet rs) throws SQLException {
        FeedbackDTO feedback = new FeedbackDTO();

        feedback.setFeedbackId(rs.getInt("feedback_id"));
        feedback.setUserId(rs.getInt("user_id"));
        feedback.setTournamentId(rs.getObject("tournament_id") != null ? rs.getInt("tournament_id") : null);
        feedback.setMatchId(rs.getObject("match_id") != null ? rs.getInt("match_id") : null);
        feedback.setStarRating(rs.getInt("star_rating"));
        feedback.setComment(EncodingUtil.fixUtf8Mojibake(rs.getString("comment")));
        feedback.setStatus(rs.getString("status"));
        feedback.setReply(EncodingUtil.fixUtf8Mojibake(rs.getString("reply")));
        feedback.setCreateAt(rs.getTimestamp("create_at"));
        feedback.setFirstName(EncodingUtil.fixUtf8Mojibake(rs.getString("first_name")));
        feedback.setLastName(EncodingUtil.fixUtf8Mojibake(rs.getString("last_name")));
        feedback.setAvatar(rs.getString("avatar"));
        feedback.setEmail(EncodingUtil.fixUtf8Mojibake(rs.getString("email")));

        return feedback;
    }
}
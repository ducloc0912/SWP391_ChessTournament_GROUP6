// FeedbackService.java
package com.example.service.user;

import com.example.DAO.FeedbackDAO;
import com.example.DAO.ParticipantDAO;
import com.example.DAO.TournamentDAO;
import com.example.model.dto.FeedbackDTO;
import com.example.model.dto.TournamentDTO;

import java.util.List;

public class FeedbackService {
    private FeedbackDAO feedbackDAO;
    private ParticipantDAO participantDAO;
    private TournamentDAO tournamentDAO;

    public FeedbackService() {
        this.feedbackDAO = new FeedbackDAO();
        this.participantDAO = new ParticipantDAO();
        this.tournamentDAO = new TournamentDAO();
    }
    
    // 1. Lấy feedback cho trang chủ
    public  List<FeedbackDTO> getHomepageFeedbacks(int limit) {
        try {
            return feedbackDAO.getTopFeedbacksForHomepage(limit);
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }
    
    // 2. Lấy tất cả feedback (có phân trang)
    public List<FeedbackDTO> getAllFeedbacks(int page, int pageSize) {
        try {
            return feedbackDAO.getAllFeedbacksWithUsers(page, pageSize);
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }
    
    // 3. Thêm feedback mới
    public boolean addFeedback(FeedbackDTO feedback) {
        // Validate dữ liệu cơ bản
        if (feedback.getUserId() == null) {
            throw new IllegalArgumentException("User ID is required");
        }
        if (feedback.getTournamentId() == null) {
            throw new IllegalArgumentException("Tournament ID is required");
        }
        if (feedback.getStarRating() == null || feedback.getStarRating() < 1 || feedback.getStarRating() > 5) {
            throw new IllegalArgumentException("Star rating must be between 1 and 5");
        }
        if (feedback.getComment() == null || feedback.getComment().trim().isEmpty()) {
            throw new IllegalArgumentException("Không được để rỗng comment");
        }

        try {
            // Chỉ cho phép feedback khi giải đang thi đấu hoặc đã kết thúc
            TournamentDTO tournament = tournamentDAO.getTournamentById(feedback.getTournamentId());
            if (tournament == null) {
                throw new IllegalArgumentException("Tournament not found");
            }
            String status = tournament.getStatus() != null ? tournament.getStatus().trim() : "";
            if (!"Ongoing".equalsIgnoreCase(status) && !"Completed".equalsIgnoreCase(status)) {
                throw new IllegalArgumentException("Bạn chỉ có thể đánh giá khi giải đang diễn ra hoặc đã kết thúc.");
            }

            // Chỉ cho phép user đã tham gia (Participant Active) đánh giá giải
            boolean joined = participantDAO.existsActiveByTournamentAndUser(
                    feedback.getTournamentId(),
                    feedback.getUserId()
            );
            if (!joined) {
                throw new IllegalArgumentException("Bạn cần tham gia giải đấu trước khi viết đánh giá.");
            }

            // Mỗi người chơi chỉ được feedback một lần cho mỗi giải đấu
            boolean alreadySubmitted = feedbackDAO.hasUserFeedbackForTournament(
                    feedback.getUserId(),
                    feedback.getTournamentId()
            );
            if (alreadySubmitted) {
                throw new IllegalArgumentException("Bạn đã gửi đánh giá cho giải đấu này rồi.");
            }

            feedbackDAO.addFeedback(feedback);
            return true;
        } catch (IllegalArgumentException e) {
            // Đẩy tiếp IllegalArgumentException để servlet xử lý và trả message cụ thể cho client
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    // 4. Lấy feedback theo user
    public List<FeedbackDTO> getUserFeedbacks(int userId) {
        try {
            return feedbackDAO.getFeedbacksByUserId(userId);
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }
    
    // 5. Cập nhật status feedback
    public boolean updateFeedbackStatus(int feedbackId, String status, String reply) {
        try {
            if (!status.matches("approved|rejected|pending")) {
                throw new IllegalArgumentException("Invalid status");
            }
            
            return feedbackDAO.updateFeedbackStatus(feedbackId, status, reply);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // 8. Cập nhật nội dung feedback (starRating + comment) của user
    public boolean updateFeedbackContent(int feedbackId, int userId, int starRating, String comment) {
        try {
            if (starRating < 1 || starRating > 5) {
                throw new IllegalArgumentException("Star rating must be between 1 and 5");
            }
            if (comment == null || comment.trim().isEmpty()) {
                throw new IllegalArgumentException("Comment cannot be empty");
            }
            return feedbackDAO.updateFeedbackContent(feedbackId, userId, starRating, comment.trim());
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // 9. Cập nhật reply của tournament leader
    public boolean updateFeedbackReply(int feedbackId, String reply) {
        if (reply == null || reply.trim().isEmpty()) {
            throw new IllegalArgumentException("Nội dung phản hồi không được để trống.");
        }
        try {
            return feedbackDAO.updateFeedbackReply(feedbackId, reply.trim());
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // 6. Lấy số lượng feedback
    public int getTotalFeedbackCount() {
        try {
            return feedbackDAO.getTotalFeedbackCount();
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }
    
    // 7. Lấy thống kê rating
    public double getAverageRating() {
        try {
            List<FeedbackDTO> feedbacks = feedbackDAO.getAllFeedbacksWithUsers(1, 1000);
            if (feedbacks.isEmpty()) {
                return 0.0;
            }
            
            double total = 0;
            int count = 0;
            for (FeedbackDTO feedback : feedbacks) {
                if (feedback.getStarRating() != null) {
                    total += feedback.getStarRating();
                    count++;
                }
            }
            
            return count > 0 ? total / count : 0.0;
        } catch (Exception e) {
            e.printStackTrace();
            return 0.0;
        }
    }
}
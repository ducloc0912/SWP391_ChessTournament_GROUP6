// FeedbackService.java
package com.example.service.user;
import com.example.DAO.FeedbackDAO;
import com.example.model.dto.FeedbackDTO;
import java.util.List;

public class FeedbackService {
    private  FeedbackDAO feedbackDAO;
    
    public  FeedbackService() {
        this.feedbackDAO = new FeedbackDAO();
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
        try {
            // Validate dữ liệu
            if (feedback.getUserId() == null) {
                throw new IllegalArgumentException("User ID is required");
            }
            if (feedback.getStarRating() == null || feedback.getStarRating() < 1 || feedback.getStarRating() > 5) {
                throw new IllegalArgumentException("Star rating must be between 1 and 5");
            }
            if (feedback.getComment() == null || feedback.getComment().trim().isEmpty()) {
                throw new IllegalArgumentException("Comment cannot be empty");
            }
            
            feedbackDAO.addFeedback(feedback);
            return true;
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
// FeedbackDTO.java - Model mới chứa thông tin feedback kết hợp với user
package com.example.model.dto;

import java.sql.Timestamp;

public class FeedbackDTO {
    private Integer feedbackId;
    private Integer userId;
    private Integer tournamentId;
    private Integer matchId;
    private Integer starRating;
    private String comment;
    private String status;
    private String reply;
    private Timestamp createAt;
    
    // Thông tin từ bảng Users
    private String firstName;
    private String lastName;
    private String avatar;
    private String email;
    
    // Thông tin thêm (nếu cần)
    private String tournamentName;
    private String matchTitle;
    
    public FeedbackDTO() {}
    
    public FeedbackDTO(Integer feedbackId, Integer userId, Integer tournamentId, Integer matchId,
                      Integer starRating, String comment, String status, String reply, Timestamp createAt,
                      String firstName, String lastName, String avatar, String email) {
        this.feedbackId = feedbackId;
        this.userId = userId;
        this.tournamentId = tournamentId;
        this.matchId = matchId;
        this.starRating = starRating;
        this.comment = comment;
        this.status = status;
        this.reply = reply;
        this.createAt = createAt;
        this.firstName = firstName;
        this.lastName = lastName;
        this.avatar = avatar;
        this.email = email;
    }
    
    // Getters và Setters cho tất cả các trường
    public Integer getFeedbackId() { return feedbackId; }
    public void setFeedbackId(Integer feedbackId) { this.feedbackId = feedbackId; }
    
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    
    public Integer getTournamentId() { return tournamentId; }
    public void setTournamentId(Integer tournamentId) { this.tournamentId = tournamentId; }
    
    public Integer getMatchId() { return matchId; }
    public void setMatchId(Integer matchId) { this.matchId = matchId; }
    
    public Integer getStarRating() { return starRating; }
    public void setStarRating(Integer starRating) { 
        if (starRating != null && (starRating < 1 || starRating > 5)) {
            throw new IllegalArgumentException("Star rating must be between 1 and 5");
        }
        this.starRating = starRating; 
    }
    
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }
    
    public Timestamp getCreateAt() { return createAt; }
    public void setCreateAt(Timestamp createAt) { this.createAt = createAt; }
    
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getTournamentName() { return tournamentName; }
    public void setTournamentName(String tournamentName) { this.tournamentName = tournamentName; }
    
    public String getMatchTitle() { return matchTitle; }
    public void setMatchTitle(String matchTitle) { this.matchTitle = matchTitle; }
    
    // Helper method
    public String getFullName() {
        return (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "");
    }
}
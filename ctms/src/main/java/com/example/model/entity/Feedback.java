package com.example.model.entity;

import java.sql.Timestamp;

public class Feedback {
    private Integer feedbackId;
    private Integer userId;
    private Integer tournamentId;
    private Integer matchId;
    public Integer getFeedbackId() {
        return feedbackId;
    }

    public void setFeedbackId(Integer feedbackId) {
        this.feedbackId = feedbackId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getTournamentId() {
        return tournamentId;
    }

    public void setTournamentId(Integer tournamentId) {
        this.tournamentId = tournamentId;
    }

    public Integer getMatchId() {
        return matchId;
    }

    public void setMatchId(Integer matchId) {
        this.matchId = matchId;
    }

    public Integer getStarRating() {
        return starRating;
    }

    public void setStarRating(Integer starRating) {
        this.starRating = starRating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public Timestamp getCreateAt() {
        return createAt;
    }

    public void setCreateAt(Timestamp createAt) {
        this.createAt = createAt;
    }

    private Integer starRating;
    private String comment;
    private String status;
    private String reply;
    private Timestamp createAt;

    public Feedback() {}

    public Feedback(Integer feedbackId, Integer userId, Integer tournamentId, Integer matchId,
                    Integer starRating, String comment, String status, String reply, Timestamp createAt) {
        this.feedbackId = feedbackId;
        this.userId = userId;
        this.tournamentId = tournamentId;
        this.matchId = matchId;
        this.starRating = starRating;
        this.comment = comment;
        this.status = status;
        this.reply = reply;
        this.createAt = createAt;
    }
}
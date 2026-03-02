package com.example.model.entity;


import com.example.model.enums.MatchRefereeRole;

import java.sql.Timestamp;

public class MatchReferee {
    private Integer matchId;
    private Integer refereeId;
    private MatchRefereeRole role;
    private Timestamp assignedAt;

    public Integer getMatchId() {
        return matchId;
    }

    public void setMatchId(Integer matchId) {
        this.matchId = matchId;
    }

    public Integer getRefereeId() {
        return refereeId;
    }

    public void setRefereeId(Integer refereeId) {
        this.refereeId = refereeId;
    }

    public MatchRefereeRole getRole() {
        return role;
    }

    public void setRole(MatchRefereeRole role) {
        this.role = role;
    }

    public Timestamp getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(Timestamp assignedAt) {
        this.assignedAt = assignedAt;
    }

    public MatchReferee() {}

    public MatchReferee(Integer matchId, Integer refereeId, MatchRefereeRole role, Timestamp assignedAt) {
        this.matchId = matchId;
        this.refereeId = refereeId;
        this.role = role;
        this.assignedAt = assignedAt;
    }
}
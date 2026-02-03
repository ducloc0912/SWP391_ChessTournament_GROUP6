package com.example.model.entity;

import java.math.BigDecimal;

public class Standing {
    private Integer tournamentId;
    private Integer userId;
    private Integer matchesPlayed;
    private Integer won;
    public Integer getTournamentId() {
        return tournamentId;
    }

    public void setTournamentId(Integer tournamentId) {
        this.tournamentId = tournamentId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getMatchesPlayed() {
        return matchesPlayed;
    }

    public void setMatchesPlayed(Integer matchesPlayed) {
        this.matchesPlayed = matchesPlayed;
    }

    public Integer getWon() {
        return won;
    }

    public void setWon(Integer won) {
        this.won = won;
    }

    public Integer getDrawn() {
        return drawn;
    }

    public void setDrawn(Integer drawn) {
        this.drawn = drawn;
    }

    public Integer getLost() {
        return lost;
    }

    public void setLost(Integer lost) {
        this.lost = lost;
    }

    public BigDecimal getPoint() {
        return point;
    }

    public void setPoint(BigDecimal point) {
        this.point = point;
    }

    public BigDecimal getTieBreak() {
        return tieBreak;
    }

    public void setTieBreak(BigDecimal tieBreak) {
        this.tieBreak = tieBreak;
    }

    public Integer getCurrentRank() {
        return currentRank;
    }

    public void setCurrentRank(Integer currentRank) {
        this.currentRank = currentRank;
    }

    private Integer drawn;
    private Integer lost;
    private BigDecimal point;
    private BigDecimal tieBreak;
    private Integer currentRank;

    public Standing() {}

    public Standing(Integer tournamentId, Integer userId, Integer matchesPlayed, Integer won, Integer drawn,
                    Integer lost, BigDecimal point, BigDecimal tieBreak, Integer currentRank) {
        this.tournamentId = tournamentId;
        this.userId = userId;
        this.matchesPlayed = matchesPlayed;
        this.won = won;
        this.drawn = drawn;
        this.lost = lost;
        this.point = point;
        this.tieBreak = tieBreak;
        this.currentRank = currentRank;
    }
}
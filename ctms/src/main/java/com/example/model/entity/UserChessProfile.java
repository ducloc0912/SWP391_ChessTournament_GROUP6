package com.example.model.entity;

import java.sql.Timestamp;

public class UserChessProfile {
    private Integer userId;
    private Integer titleId;
    private Integer eloRating;
    private Integer highestElo;
    private Integer totalGames;
    private Integer totalWins;
    private Integer totalDraws;
    private Integer totalLosses;
    private Timestamp lastGameAt;
    private Timestamp updateAt;

    public UserChessProfile() {}

    public UserChessProfile(Integer userId, Integer titleId, Integer eloRating, Integer highestElo,
                            Integer totalGames, Integer totalWins, Integer totalDraws,
                            Integer totalLosses, Timestamp lastGameAt, Timestamp updateAt) {
        this.userId = userId;
        this.titleId = titleId;
        this.eloRating = eloRating;
        this.highestElo = highestElo;
        this.totalGames = totalGames;
        this.totalWins = totalWins;
        this.totalDraws = totalDraws;
        this.totalLosses = totalLosses;
        this.lastGameAt = lastGameAt;
        this.updateAt = updateAt;
    }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getTitleId() { return titleId; }
    public void setTitleId(Integer titleId) { this.titleId = titleId; }

    public Integer getEloRating() { return eloRating; }
    public void setEloRating(Integer eloRating) { this.eloRating = eloRating; }

    public Integer getHighestElo() { return highestElo; }
    public void setHighestElo(Integer highestElo) { this.highestElo = highestElo; }

    public Integer getTotalGames() { return totalGames; }
    public void setTotalGames(Integer totalGames) { this.totalGames = totalGames; }

    public Integer getTotalWins() { return totalWins; }
    public void setTotalWins(Integer totalWins) { this.totalWins = totalWins; }

    public Integer getTotalDraws() { return totalDraws; }
    public void setTotalDraws(Integer totalDraws) { this.totalDraws = totalDraws; }

    public Integer getTotalLosses() { return totalLosses; }
    public void setTotalLosses(Integer totalLosses) { this.totalLosses = totalLosses; }

    public Timestamp getLastGameAt() { return lastGameAt; }
    public void setLastGameAt(Timestamp lastGameAt) { this.lastGameAt = lastGameAt; }

    public Timestamp getUpdateAt() { return updateAt; }
    public void setUpdateAt(Timestamp updateAt) { this.updateAt = updateAt; }
}

package com.example.model.entity;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class PrizeDistribution {
    private Integer id;
    private Integer tournamentId;
    private Integer userId;
    private Integer rankPosition;
    private BigDecimal prizeAmount;
    private Boolean isDistributed;
    private Timestamp distributedAt;
    private String note;

    public PrizeDistribution() {}

    public PrizeDistribution(Integer id, Integer tournamentId, Integer userId, Integer rankPosition,
                             BigDecimal prizeAmount, Boolean isDistributed,
                             Timestamp distributedAt, String note) {
        this.id = id;
        this.tournamentId = tournamentId;
        this.userId = userId;
        this.rankPosition = rankPosition;
        this.prizeAmount = prizeAmount;
        this.isDistributed = isDistributed;
        this.distributedAt = distributedAt;
        this.note = note;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getTournamentId() { return tournamentId; }
    public void setTournamentId(Integer tournamentId) { this.tournamentId = tournamentId; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getRankPosition() { return rankPosition; }
    public void setRankPosition(Integer rankPosition) { this.rankPosition = rankPosition; }

    public BigDecimal getPrizeAmount() { return prizeAmount; }
    public void setPrizeAmount(BigDecimal prizeAmount) { this.prizeAmount = prizeAmount; }

    public Boolean getIsDistributed() { return isDistributed; }
    public void setIsDistributed(Boolean isDistributed) { this.isDistributed = isDistributed; }

    public Timestamp getDistributedAt() { return distributedAt; }
    public void setDistributedAt(Timestamp distributedAt) { this.distributedAt = distributedAt; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}

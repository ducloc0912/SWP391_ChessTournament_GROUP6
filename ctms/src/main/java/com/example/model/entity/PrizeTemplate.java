package com.example.model.entity;

import java.math.BigDecimal;

public class PrizeTemplate {
    private Integer id;
    private Integer tournamentId;
    private Integer rankPosition;       // 1 = Champion, 2 = Runner-up, 3 = 3rd Place
    private BigDecimal percentage;      // % of prize_pool (e.g. 50.00 = 50%)
    private BigDecimal fixedAmount;     // Fixed amount (if not using %)
    private String label;               // "Champion", "Runner-up", "3rd Place"

    public PrizeTemplate() {}

    public PrizeTemplate(Integer id, Integer tournamentId, Integer rankPosition,
                         BigDecimal percentage, BigDecimal fixedAmount, String label) {
        this.id = id;
        this.tournamentId = tournamentId;
        this.rankPosition = rankPosition;
        this.percentage = percentage;
        this.fixedAmount = fixedAmount;
        this.label = label;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getTournamentId() { return tournamentId; }
    public void setTournamentId(Integer tournamentId) { this.tournamentId = tournamentId; }

    public Integer getRankPosition() { return rankPosition; }
    public void setRankPosition(Integer rankPosition) { this.rankPosition = rankPosition; }

    public BigDecimal getPercentage() { return percentage; }
    public void setPercentage(BigDecimal percentage) { this.percentage = percentage; }

    public BigDecimal getFixedAmount() { return fixedAmount; }
    public void setFixedAmount(BigDecimal fixedAmount) { this.fixedAmount = fixedAmount; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
}

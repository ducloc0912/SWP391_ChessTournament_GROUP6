package com.example.model;

import java.math.BigDecimal;

public class Standing {
    private int tournamentId;
    private int userId;
    private int matchesPlayed;
    private int won;
    private int drawn;
    private int lost;
    
    // Trong DB là decimal(5,1) và decimal(10,2) nên dùng BigDecimal là chuẩn nhất
    private BigDecimal point;    
    private BigDecimal tieBreak; 
    
    private int currentRank;

    public Standing() {
    }

    public Standing(int tournamentId, int userId, int matchesPlayed, int won, int drawn, int lost, 
                    BigDecimal point, BigDecimal tieBreak, int currentRank) {
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

    // Getters and Setters
    public int getTournamentId() { return tournamentId; }
    public void setTournamentId(int tournamentId) { this.tournamentId = tournamentId; }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public int getMatchesPlayed() { return matchesPlayed; }
    public void setMatchesPlayed(int matchesPlayed) { this.matchesPlayed = matchesPlayed; }

    public int getWon() { return won; }
    public void setWon(int won) { this.won = won; }

    public int getDrawn() { return drawn; }
    public void setDrawn(int drawn) { this.drawn = drawn; }

    public int getLost() { return lost; }
    public void setLost(int lost) { this.lost = lost; }

    public BigDecimal getPoint() { return point; }
    public void setPoint(BigDecimal point) { this.point = point; }

    public BigDecimal getTieBreak() { return tieBreak; }
    public void setTieBreak(BigDecimal tieBreak) { this.tieBreak = tieBreak; }

    public int getCurrentRank() { return currentRank; }
    public void setCurrentRank(int currentRank) { this.currentRank = currentRank; }
}
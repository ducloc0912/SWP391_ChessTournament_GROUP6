package com.example.model.entity;

public class MatchPGN {
    private Integer matchId;
    private String pgnText;
    private String fenFinal;
    private Integer totalMoves;
    private Integer durationSeconds;

    public MatchPGN() {}

    public MatchPGN(Integer matchId, String pgnText, String fenFinal,
                    Integer totalMoves, Integer durationSeconds) {
        this.matchId = matchId;
        this.pgnText = pgnText;
        this.fenFinal = fenFinal;
        this.totalMoves = totalMoves;
        this.durationSeconds = durationSeconds;
    }

    public Integer getMatchId() { return matchId; }
    public void setMatchId(Integer matchId) { this.matchId = matchId; }

    public String getPgnText() { return pgnText; }
    public void setPgnText(String pgnText) { this.pgnText = pgnText; }

    public String getFenFinal() { return fenFinal; }
    public void setFenFinal(String fenFinal) { this.fenFinal = fenFinal; }

    public Integer getTotalMoves() { return totalMoves; }
    public void setTotalMoves(Integer totalMoves) { this.totalMoves = totalMoves; }

    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }
}

package com.example.model.dto;

import java.sql.Timestamp;

public class TournamentSetupMatchDTO {
    private Integer matchId;
    private String stage;
    private String roundName;
    private Integer roundIndex;
    private Integer boardNumber;
    private Integer whitePlayerId;
    private String whitePlayerName;
    private Integer blackPlayerId;
    private String blackPlayerName;
    private Timestamp startTime;

    public Integer getMatchId() {
        return matchId;
    }

    public void setMatchId(Integer matchId) {
        this.matchId = matchId;
    }

    public String getStage() {
        return stage;
    }

    public void setStage(String stage) {
        this.stage = stage;
    }

    public String getRoundName() {
        return roundName;
    }

    public void setRoundName(String roundName) {
        this.roundName = roundName;
    }

    public Integer getRoundIndex() {
        return roundIndex;
    }

    public void setRoundIndex(Integer roundIndex) {
        this.roundIndex = roundIndex;
    }

    public Integer getBoardNumber() {
        return boardNumber;
    }

    public void setBoardNumber(Integer boardNumber) {
        this.boardNumber = boardNumber;
    }

    public Integer getWhitePlayerId() {
        return whitePlayerId;
    }

    public void setWhitePlayerId(Integer whitePlayerId) {
        this.whitePlayerId = whitePlayerId;
    }

    public String getWhitePlayerName() {
        return whitePlayerName;
    }

    public void setWhitePlayerName(String whitePlayerName) {
        this.whitePlayerName = whitePlayerName;
    }

    public Integer getBlackPlayerId() {
        return blackPlayerId;
    }

    public void setBlackPlayerId(Integer blackPlayerId) {
        this.blackPlayerId = blackPlayerId;
    }

    public String getBlackPlayerName() {
        return blackPlayerName;
    }

    public void setBlackPlayerName(String blackPlayerName) {
        this.blackPlayerName = blackPlayerName;
    }

    public Timestamp getStartTime() {
        return startTime;
    }

    public void setStartTime(Timestamp startTime) {
        this.startTime = startTime;
    }
}

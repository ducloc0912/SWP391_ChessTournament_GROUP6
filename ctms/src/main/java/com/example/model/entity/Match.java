package com.example.model.entity;

import java.sql.Timestamp;

public class Match {
    private Integer matchId;
    private Integer tournamentId;
    private Integer roundId;
    private Integer boardNumber;
    private Integer player1Id;
    private Integer player2Id;
    private String result;
    private String termination;
    private String status;
    private Timestamp startTime;
    private Timestamp endTime;

    public Integer getMatchId() {
        return matchId;
    }

    public void setMatchId(Integer matchId) {
        this.matchId = matchId;
    }

    public Integer getTournamentId() {
        return tournamentId;
    }

    public void setTournamentId(Integer tournamentId) {
        this.tournamentId = tournamentId;
    }

    public Integer getRoundId() {
        return roundId;
    }

    public void setRoundId(Integer roundId) {
        this.roundId = roundId;
    }

    public Integer getBoardNumber() {
        return boardNumber;
    }

    public void setBoardNumber(Integer boardNumber) {
        this.boardNumber = boardNumber;
    }

    public Integer getPlayer1Id() {
        return player1Id;
    }

    public void setPlayer1Id(Integer player1Id) {
        this.player1Id = player1Id;
    }

    public Integer getPlayer2Id() {
        return player2Id;
    }

    public void setPlayer2Id(Integer player2Id) {
        this.player2Id = player2Id;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public String getTermination() {
        return termination;
    }

    public void setTermination(String termination) {
        this.termination = termination;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Timestamp getStartTime() {
        return startTime;
    }

    public void setStartTime(Timestamp startTime) {
        this.startTime = startTime;
    }

    public Timestamp getEndTime() {
        return endTime;
    }

    public void setEndTime(Timestamp endTime) {
        this.endTime = endTime;
    }

    public Match() {}

    public Match(Integer matchId, Integer tournamentId, Integer roundId, Integer boardNumber,
                 Integer player1Id, Integer player2Id, String result, String termination,
                 String status, Timestamp startTime, Timestamp endTime) {
        this.matchId = matchId;
        this.tournamentId = tournamentId;
        this.roundId = roundId;
        this.boardNumber = boardNumber;
        this.player1Id = player1Id;
        this.player2Id = player2Id;
        this.result = result;
        this.termination = termination;
        this.status = status;
        this.startTime = startTime;
        this.endTime = endTime;
    }
}

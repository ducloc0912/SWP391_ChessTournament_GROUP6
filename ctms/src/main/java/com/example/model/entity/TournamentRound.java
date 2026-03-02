package com.example.model.entity;

import java.sql.Timestamp;

public class TournamentRound {
    private Integer roundId;
    private Integer bracketId;
    private Integer tournamentId;
    private String name;
    private Integer roundIndex;
    private Timestamp startTime;
    private Timestamp endTime;
    private Boolean isCompleted;

    public Integer getRoundId() {
        return roundId;
    }

    public void setRoundId(Integer roundId) {
        this.roundId = roundId;
    }

    public Integer getBracketId() {
        return bracketId;
    }

    public void setBracketId(Integer bracketId) {
        this.bracketId = bracketId;
    }

    public Integer getTournamentId() {
        return tournamentId;
    }

    public void setTournamentId(Integer tournamentId) {
        this.tournamentId = tournamentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getRoundIndex() {
        return roundIndex;
    }

    public void setRoundIndex(Integer roundIndex) {
        this.roundIndex = roundIndex;
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

    public Boolean getIsCompleted() {
        return isCompleted;
    }

    public void setIsCompleted(Boolean isCompleted) {
        this.isCompleted = isCompleted;
    }

    public TournamentRound() {}

    public TournamentRound(Integer roundId, Integer bracketId, Integer tournamentId, String name,
                           Integer roundIndex, Timestamp startTime, Timestamp endTime,
                           Boolean isCompleted) {
        this.roundId = roundId;
        this.bracketId = bracketId;
        this.tournamentId = tournamentId;
        this.name = name;
        this.roundIndex = roundIndex;
        this.startTime = startTime;
        this.endTime = endTime;
        this.isCompleted = isCompleted;
    }
}
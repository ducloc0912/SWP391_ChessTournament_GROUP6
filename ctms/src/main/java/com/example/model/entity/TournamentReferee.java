package com.example.model.entity;

import com.example.model.enums.TournamentRefereeRole;

import java.sql.Timestamp;

public class TournamentReferee {
    private Integer tournamentId;
    private Integer refereeId;
    private TournamentRefereeRole refereeRole;
    private Integer assignedBy;
    private Timestamp assignedAt;
    private String note;

    public Integer getTournamentId() {
        return tournamentId;
    }

    public void setTournamentId(Integer tournamentId) {
        this.tournamentId = tournamentId;
    }

    public Integer getRefereeId() {
        return refereeId;
    }

    public void setRefereeId(Integer refereeId) {
        this.refereeId = refereeId;
    }

    public TournamentRefereeRole getRefereeRole() {
        return refereeRole;
    }

    public void setRefereeRole(TournamentRefereeRole refereeRole) {
        this.refereeRole = refereeRole;
    }

    public Integer getAssignedBy() {
        return assignedBy;
    }

    public void setAssignedBy(Integer assignedBy) {
        this.assignedBy = assignedBy;
    }

    public Timestamp getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(Timestamp assignedAt) {
        this.assignedAt = assignedAt;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public TournamentReferee() {}

    public TournamentReferee(Integer tournamentId, Integer refereeId, TournamentRefereeRole refereeRole,
                             Integer assignedBy, Timestamp assignedAt, String note) {
        this.tournamentId = tournamentId;
        this.refereeId = refereeId;
        this.refereeRole = refereeRole;
        this.assignedBy = assignedBy;
        this.assignedAt = assignedAt;
        this.note = note;
    }
}
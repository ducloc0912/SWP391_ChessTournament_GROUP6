package com.example.model.entity;

import java.sql.Timestamp;

import com.example.model.enums.TournamentStaffRole;

public class TournamentStaff {
    private Integer tournamentId;
    private Integer staffId;
    private TournamentStaffRole staffRole;
    private Integer assignedBy;
    private Timestamp assignedAt;
    public Integer getTournamentId() {
        return tournamentId;
    }

    public void setTournamentId(Integer tournamentId) {
        this.tournamentId = tournamentId;
    }

    public Integer getStaffId() {
        return staffId;
    }

    public void setStaffId(Integer staffId) {
        this.staffId = staffId;
    }

    public TournamentStaffRole getStaffRole() {
        return staffRole;
    }

    public void setStaffRole(TournamentStaffRole staffRole) {
        this.staffRole = staffRole;
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

    private String note;

    public TournamentStaff() {}

    public TournamentStaff(Integer tournamentId, Integer staffId, TournamentStaffRole staffRole,
                           Integer assignedBy, Timestamp assignedAt, String note) {
        this.tournamentId = tournamentId;
        this.staffId = staffId;
        this.staffRole = staffRole;
        this.assignedBy = assignedBy;
        this.assignedAt = assignedAt;
        this.note = note;
    }
}
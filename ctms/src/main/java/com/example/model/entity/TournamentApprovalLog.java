package com.example.model.entity;

import com.example.model.enums.ApprovalAction;
import com.example.model.enums.TournamentStatus;

import java.time.LocalDateTime;

public class TournamentApprovalLog {
    private Integer approvalId;
    private Integer tournamentId;
    private Integer staffId;
    private ApprovalAction action;
    private TournamentStatus fromStatus;
    private TournamentStatus toStatus;
    private String note;
    private LocalDateTime createdAt;

    public Integer getApprovalId() {
        return approvalId;
    }

    public void setApprovalId(Integer approvalId) {
        this.approvalId = approvalId;
    }

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

    public ApprovalAction getAction() {
        return action;
    }

    public void setAction(ApprovalAction action) {
        this.action = action;
    }

    public TournamentStatus getFromStatus() {
        return fromStatus;
    }

    public void setFromStatus(TournamentStatus fromStatus) {
        this.fromStatus = fromStatus;
    }

    public TournamentStatus getToStatus() {
        return toStatus;
    }

    public void setToStatus(TournamentStatus toStatus) {
        this.toStatus = toStatus;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public TournamentApprovalLog() {}

    public TournamentApprovalLog(Integer approvalId, Integer tournamentId, Integer staffId,
                                 ApprovalAction action, TournamentStatus fromStatus, TournamentStatus toStatus,
                                 String note, LocalDateTime createdAt) {
        this.approvalId = approvalId;
        this.tournamentId = tournamentId;
        this.staffId = staffId;
        this.action = action;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.note = note;
        this.createdAt = createdAt;
    }
}
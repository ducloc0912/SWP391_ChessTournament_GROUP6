package com.example.model.entity;

import java.sql.Timestamp;

public class WaitingList {
    private Integer waitingId;
    private Integer tournamentId;
    private Integer userId;
    private Integer rankAtRegistration;
    private String status;
    private String note;
    private Integer approvedBy;
    private Timestamp approvedAt;
    private Timestamp registrationDate;

    // snapshot for this registration only
    private String registrationFullName;
    private String registrationUsername;
    private String registrationEmail;
    private String registrationPhone;

    public Integer getWaitingId() { return waitingId; }
    public void setWaitingId(Integer waitingId) { this.waitingId = waitingId; }

    public Integer getTournamentId() { return tournamentId; }
    public void setTournamentId(Integer tournamentId) { this.tournamentId = tournamentId; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getRankAtRegistration() { return rankAtRegistration; }
    public void setRankAtRegistration(Integer rankAtRegistration) { this.rankAtRegistration = rankAtRegistration; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public Integer getApprovedBy() { return approvedBy; }
    public void setApprovedBy(Integer approvedBy) { this.approvedBy = approvedBy; }

    public Timestamp getApprovedAt() { return approvedAt; }
    public void setApprovedAt(Timestamp approvedAt) { this.approvedAt = approvedAt; }

    public Timestamp getRegistrationDate() { return registrationDate; }
    public void setRegistrationDate(Timestamp registrationDate) { this.registrationDate = registrationDate; }

    public String getRegistrationFullName() { return registrationFullName; }
    public void setRegistrationFullName(String registrationFullName) { this.registrationFullName = registrationFullName; }

    public String getRegistrationUsername() { return registrationUsername; }
    public void setRegistrationUsername(String registrationUsername) { this.registrationUsername = registrationUsername; }

    public String getRegistrationEmail() { return registrationEmail; }
    public void setRegistrationEmail(String registrationEmail) { this.registrationEmail = registrationEmail; }

    public String getRegistrationPhone() { return registrationPhone; }
    public void setRegistrationPhone(String registrationPhone) { this.registrationPhone = registrationPhone; }
}
package com.example.model.dto;

import java.sql.Timestamp;

public class TournamentRefereeDTO {
    private int refereeId;
    private String firstName;
    private String lastName;
    private String email;
    private String avatar;
    private String refereeRole;
    private Timestamp assignedAt;
    private String note;
    private int matchCount;

    public int getRefereeId() { return refereeId; }
    public void setRefereeId(int refereeId) { this.refereeId = refereeId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getRefereeRole() { return refereeRole; }
    public void setRefereeRole(String refereeRole) { this.refereeRole = refereeRole; }

    public Timestamp getAssignedAt() { return assignedAt; }
    public void setAssignedAt(Timestamp assignedAt) { this.assignedAt = assignedAt; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public int getMatchCount() { return matchCount; }
    public void setMatchCount(int matchCount) { this.matchCount = matchCount; }
}

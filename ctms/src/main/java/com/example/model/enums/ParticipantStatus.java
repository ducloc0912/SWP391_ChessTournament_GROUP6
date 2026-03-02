package com.example.model.enums;

public enum ParticipantStatus {
    Active, Withdrawn, Disqualified;
    
    public static ParticipantStatus getActive() {
        return Active;
    }

    public static ParticipantStatus getWithdrawn() {
        return Withdrawn;
    }

    public static ParticipantStatus getDisqualified() {
        return Disqualified;
    }
    
}

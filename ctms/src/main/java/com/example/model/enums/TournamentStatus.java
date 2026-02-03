package com.example.model.enums;

public enum TournamentStatus {
    Pending, Rejected, Delayed, Ongoing, Completed, Cancelled;
    
    public static TournamentStatus getPending() {
        return Pending;
    }

    public static TournamentStatus getRejected() {
        return Rejected;
    }

    public static TournamentStatus getDelayed() {
        return Delayed;
    }

    public static TournamentStatus getOngoing() {
        return Ongoing;
    }

    public static TournamentStatus getCompleted() {
        return Completed;
    }

    public static TournamentStatus getCancelled() {
        return Cancelled;
    }
}
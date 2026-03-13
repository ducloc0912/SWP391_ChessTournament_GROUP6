package com.example.model.enums;

public enum TournamentStatus {
    Pending, Rejected, Delayed, Ongoing, Completed, Cancelled, Upcoming;

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

    public static TournamentStatus getUpcoming() {
        return Upcoming;
    }
}
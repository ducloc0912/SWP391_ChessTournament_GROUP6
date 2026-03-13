package com.example.model.enums;

public enum TournamentStatus {
    Pending, Upcoming, Rejected, Delayed, Ongoing, Completed, Cancelled;

    public static TournamentStatus getPending() {
        return Pending;
    }

    public static TournamentStatus getUpcoming() {
        return Upcoming;
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

    public static TournamentStatus fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim();
        for (TournamentStatus status : TournamentStatus.values()) {
            if (status.name().equalsIgnoreCase(normalized)) {
                return status;
            }
        }

        if ("up-coming".equalsIgnoreCase(normalized) || "comingsoon".equalsIgnoreCase(normalized)) {
            return Upcoming;
        }

        throw new IllegalArgumentException("Unknown tournament status: " + value);
    }
}

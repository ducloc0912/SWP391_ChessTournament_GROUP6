package com.example.model.enums;

public enum TournamentFormat {
    RoundRobin, KnockOut, Hybrid;

    public static TournamentFormat getRoundRobin() {
        return RoundRobin;
    }

    public static TournamentFormat getKnockOut() {
        return KnockOut;
    }

    public static TournamentFormat getHybrid() {
        return Hybrid;
    }

    private TournamentFormat() {
    }

    
}
package com.example.model.enums;

public enum TournamentRefereeRole {
    Chief, Assistant;
    
    public static TournamentRefereeRole getChief() {
        return Chief;
    }

    public static TournamentRefereeRole getAssistant() {
        return Assistant;
    }
}
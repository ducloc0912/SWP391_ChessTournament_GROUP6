package com.example.model.enums;

public enum MatchRefereeRole {
    Main, Assistant;

    public static MatchRefereeRole getMain() {
        return Main;
    }

    public static MatchRefereeRole getAssistant() {
        return Assistant;
    }
}

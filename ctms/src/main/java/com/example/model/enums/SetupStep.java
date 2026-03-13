package com.example.model.enums;

/**
 * Wizard steps in order. COMPLETED = all four steps finalized.
 */
public enum SetupStep {
    BRACKET,   // Step 1: Structure Bracket
    PLAYERS,   // Step 2: Add Player
    SCHEDULE,  // Step 3: Schedule
    REFEREES,  // Step 4: Add Referee
    COMPLETED;

    public static SetupStep fromString(String value) {
        if (value == null) return null;
        String v = value.trim().toUpperCase();
        if ("STRUCTURE".equals(v)) return BRACKET;
        if ("REFEREE".equals(v)) return REFEREES;
        for (SetupStep s : values()) {
            if (s.name().equals(v)) return s;
        }
        return null;
    }

    /** DB column value: STRUCTURE/REFEREE for compatibility with DB CHECK constraint (STRUCTURE, PLAYERS, SCHEDULE, REFEREE, COMPLETED). */
    public String toDbValue() {
        if (this == BRACKET) return "STRUCTURE";
        if (this == REFEREES) return "REFEREE";
        return name();
    }

    public static SetupStep fromDbValue(String db) {
        return fromString(db == null ? null : "STRUCTURE".equals(db) ? "BRACKET" : db);
    }

    public int order() {
        switch (this) {
            case BRACKET: return 1;
            case PLAYERS: return 2;
            case SCHEDULE: return 3;
            case REFEREES: return 4;
            case COMPLETED: return 5;
            default: return 0;
        }
    }

    public SetupStep next() {
        switch (this) {
            case BRACKET: return PLAYERS;
            case PLAYERS: return SCHEDULE;
            case SCHEDULE: return REFEREES;
            case REFEREES: return COMPLETED;
            default: return null;
        }
    }
}

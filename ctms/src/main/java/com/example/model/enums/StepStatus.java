package com.example.model.enums;

public enum StepStatus {
    DRAFT,
    FINALIZED;

    public static StepStatus fromString(String value) {
        if (value == null) return null;
        String v = value.trim().toUpperCase();
        for (StepStatus s : values()) {
            if (s.name().equals(v)) return s;
        }
        return null;
    }
}

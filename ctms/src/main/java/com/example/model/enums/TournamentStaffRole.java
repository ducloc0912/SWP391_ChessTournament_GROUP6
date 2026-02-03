package com.example.model.enums;

public enum TournamentStaffRole {
    Manager, Approver, Support;
    
    public static TournamentStaffRole getManager() {
        return Manager;
    }

    public static TournamentStaffRole getApprover() {
        return Approver;
    }

    public static TournamentStaffRole getSupport() {
        return Support;
    }
}

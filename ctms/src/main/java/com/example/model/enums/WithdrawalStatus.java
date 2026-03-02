package com.example.model.enums;

public enum WithdrawalStatus {
    Pending, Approved, Rejected, Completed;

    public static WithdrawalStatus getPending() {
        return Pending;
    }

    public static WithdrawalStatus getApproved() {
        return Approved;
    }

    public static WithdrawalStatus getRejected() {
        return Rejected;
    }

    public static WithdrawalStatus getCompleted() {
        return Completed;
    }
}
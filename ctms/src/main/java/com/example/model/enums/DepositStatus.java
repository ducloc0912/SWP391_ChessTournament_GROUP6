package com.example.model.enums;

public enum DepositStatus {
    Pending, Success, Failed, Cancelled;

    public static DepositStatus getPending() {
        return Pending;
    }

    public static DepositStatus getSuccess() {
        return Success;
    }

    public static DepositStatus getFailed() {
        return Failed;
    }

    public static DepositStatus getCancelled() {
        return Cancelled;
    }
}
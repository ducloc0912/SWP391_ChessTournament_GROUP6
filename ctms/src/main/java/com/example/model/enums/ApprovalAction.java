package com.example.model.enums;

public enum ApprovalAction {
    Approve, Reject, Delay, Start, Complete, Cancel;
    
    public static ApprovalAction getApprove() {
        return Approve;
    }

    public static ApprovalAction getReject() {
        return Reject;
    }

    public static ApprovalAction getDelay() {
        return Delay;
    }

    public static ApprovalAction getStart() {
        return Start;
    }

    public static ApprovalAction getComplete() {
        return Complete;
    }

    public static ApprovalAction getCancel() {
        return Cancel;
    }
}
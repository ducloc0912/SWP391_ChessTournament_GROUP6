package com.example.model.enums;

public enum ParticipantStatus {
    /** Đã xác nhận tham gia (miễn phí hoặc đã thanh toán xong). */
    Active,
    /** Đăng ký giải có phí, chưa thanh toán – chỉ coi là "đã đăng ký" sau khi thanh toán thành công. */
    PendingPayment,
    Withdrawn,
    Disqualified;

    public static ParticipantStatus getActive() {
        return Active;
    }

    public static ParticipantStatus getWithdrawn() {
        return Withdrawn;
    }

    public static ParticipantStatus getDisqualified() {
        return Disqualified;
    }
}

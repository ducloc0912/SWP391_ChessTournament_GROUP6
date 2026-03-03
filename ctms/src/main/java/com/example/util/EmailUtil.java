package com.example.util;

import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

import java.util.Properties;

public class EmailUtil {

    // ⚠️ ĐỔI THÀNH EMAIL + APP PASSWORD CỦA MÀY
    private static final String FROM_EMAIL = "ducloc0912@gmail.com";
    private static final String APP_PASSWORD = "pefd ooky crbe puvi";

    private static Session getMailSession() {

        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");

        return Session.getInstance(props,
            new Authenticator() {
                @Override
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(FROM_EMAIL, APP_PASSWORD);
                }
            }
        );
    }

    // =========================
    // SEND EMAIL (GENERIC)
    // =========================
    public static void sendEmail(String toEmail, String subject, String content) {

        try {
            Message message = new MimeMessage(getMailSession());
            message.setFrom(new InternetAddress(FROM_EMAIL));
            message.setRecipients(
                Message.RecipientType.TO,
                InternetAddress.parse(toEmail)
            );
            message.setSubject(subject);
            message.setText(content);

            Transport.send(message);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // =========================
    // SEND OTP RESET PASSWORD
    // =========================
    public static void sendOTP(String toEmail, String otp) {

        String subject = "Your OTP Code";
        String content = """
            Your OTP code is: %s

            This OTP will expire in 1 minutes.
            Do not share this code with anyone.
        """.formatted(otp);

        sendEmail(toEmail, subject, content);
    }

    /** Gửi reminder cho lời mời trọng tài (24h hoặc 48h) */
    public static void sendRefereeInviteReminder(String toEmail, String tournamentName, String inviterName, boolean is48h) {
        String subject = is48h ? "[Nhắc lần 2] Lời mời trọng tài sắp hết hạn" : "[Nhắc nhở] Bạn có lời mời làm trọng tài";
        String content = """
            Xin chào,

            %s

            Giải đấu: %s
            Người mời: %s

            Vui lòng đăng nhập và kiểm tra lời mời để chấp nhận hoặc từ chối.
            Lời mời sẽ hết hạn sau 7 ngày kể từ khi gửi.

            Trân trọng,
            Chess Tournament Management System
            """.formatted(
                is48h ? "Đây là lời nhắc lần 2: Bạn vẫn chưa phản hồi lời mời làm trọng tài." : "Bạn đã nhận được lời mời làm trọng tài cho giải đấu sau.",
                tournamentName != null ? tournamentName : "—",
                inviterName != null ? inviterName : "—"
            );
        sendEmail(toEmail, subject, content);
    }
}

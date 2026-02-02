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
}

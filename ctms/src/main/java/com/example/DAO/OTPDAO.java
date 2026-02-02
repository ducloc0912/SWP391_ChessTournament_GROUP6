package com.example.DAO;

import com.example.util.DBContext;
import java.sql.*;

public class OTPDAO {

    // =========================
    // SAVE OTP (XÓA CŨ TRƯỚC)
    // =========================
    public void saveOTP(String email, String otp) {

        String deleteSql = "DELETE FROM password_reset_otp WHERE email = ?";
        String insertSql = """
            INSERT INTO password_reset_otp(email, otp, expired_at)
            VALUES (?, ?, DATEADD(MINUTE, 1, GETDATE()))
        """;

        try (Connection conn = DBContext.getConnection()) {

            PreparedStatement psDelete = conn.prepareStatement(deleteSql);
            psDelete.setString(1, email);
            psDelete.executeUpdate();

            PreparedStatement psInsert = conn.prepareStatement(insertSql);
            psInsert.setString(1, email);
            psInsert.setString(2, otp);
            psInsert.executeUpdate();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // =========================
    // VERIFY OTP
    // =========================
    public boolean verifyOTP(String email, String otp) {

        String sql = """
            SELECT 1 FROM password_reset_otp
            WHERE email = ?
              AND otp = ?
              AND expired_at > GETDATE()
        """;

        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email);
            ps.setString(2, otp);

            return ps.executeQuery().next();

        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    // =========================
    // DELETE OTP (SAU KHI VERIFY OK)
    // =========================
    public void deleteOTP(String email) {
        String sql = "DELETE FROM password_reset_otp WHERE email = ?";
        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email);
            ps.executeUpdate();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

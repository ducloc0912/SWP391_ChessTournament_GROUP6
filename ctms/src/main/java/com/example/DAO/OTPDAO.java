package com.example.DAO;

import com.example.util.DBContext;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class OTPDAO {

    // =========================
    // SAVE OTP (XÓA CŨ + INSERT MỚI)
    // =========================
    public void saveOTP(String email, String otp) {

        String deleteSql = """
            DELETE FROM password_reset_otp
            WHERE email = ?
        """;

        String insertSql = """
            INSERT INTO password_reset_otp (email, otp, expire_at, is_used)
            VALUES (?, ?, DATEADD(MINUTE, 1, GETDATE()), 0)
        """;

        try (Connection conn = DBContext.getConnection()) {

            try (PreparedStatement psDelete = conn.prepareStatement(deleteSql)) {
                psDelete.setString(1, email);
                psDelete.executeUpdate();
            }

            try (PreparedStatement psInsert = conn.prepareStatement(insertSql)) {
                psInsert.setString(1, email);
                psInsert.setString(2, otp);
                psInsert.executeUpdate();
            }

        } catch (Exception e) {
            System.err.println("[OTPDAO] Error saving OTP");
            e.printStackTrace();
        }
    }

    // =========================
    // VERIFY OTP + MARK USED
    // =========================
    public boolean verifyOTP(String email, String otp) {

        String selectSql = """
            SELECT id
            FROM password_reset_otp
            WHERE email = ?
              AND otp = ?
              AND is_used = 0
              AND expire_at > GETDATE()
        """;

        String updateSql = """
            UPDATE password_reset_otp
            SET is_used = 1
            WHERE id = ?
        """;

        try (Connection conn = DBContext.getConnection();
             PreparedStatement psSelect = conn.prepareStatement(selectSql)) {

            psSelect.setString(1, email);
            psSelect.setString(2, otp);

            ResultSet rs = psSelect.executeQuery();

            if (!rs.next()) {
                return false; // OTP sai / hết hạn / đã dùng
            }

            int otpId = rs.getInt("id");

            try (PreparedStatement psUpdate = conn.prepareStatement(updateSql)) {
                psUpdate.setInt(1, otpId);
                psUpdate.executeUpdate();
            }

            return true;

        } catch (Exception e) {
            System.err.println("[OTPDAO] Error verifying OTP");
            e.printStackTrace();
        }

        return false;
    }

    // =========================
    // DELETE OTP (OPTIONAL CLEANUP)
    // =========================
    public void deleteOTPByEmail(String email) {

        String sql = """
            DELETE FROM password_reset_otp
            WHERE email = ?
        """;

        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email);
            ps.executeUpdate();

        } catch (Exception e) {
            System.err.println("[OTPDAO] Error deleting OTP");
            e.printStackTrace();
        }
    }
}

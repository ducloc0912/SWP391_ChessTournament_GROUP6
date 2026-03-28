package com.example.DAO;

import com.example.util.DBContext;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class TournamentSchedulerDAO extends DBContext {

    /**
     * Tự động chuyển các giải Upcoming → Ongoing khi start_date <= hiện tại.
     * @return danh sách tournament_id đã được cập nhật
     */
    public List<Integer> autoStartTournaments() {
        List<Integer> updatedIds = new ArrayList<>();

        String selectSql = "SELECT tournament_id FROM Tournaments " +
                "WHERE status = 'Upcoming' AND start_date <= GETDATE()";
        String updateSql = "UPDATE Tournaments SET status = 'Ongoing' " +
                "WHERE tournament_id = ?";

        Connection conn = null;
        try {
            conn = getConnection();
            conn.setAutoCommit(false);

            // Lấy danh sách giải cần chuyển
            List<Integer> ids = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(selectSql);
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ids.add(rs.getInt("tournament_id"));
                }
            }

            for (int tournamentId : ids) {
                // Cập nhật status
                try (PreparedStatement psUpdate = conn.prepareStatement(updateSql)) {
                    psUpdate.setInt(1, tournamentId);
                    psUpdate.executeUpdate();
                }

                updatedIds.add(tournamentId);
            }

            conn.commit();
        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            }
            e.printStackTrace();
        } finally {
            if (conn != null) {
                try { conn.setAutoCommit(true); conn.close(); } catch (SQLException e) { e.printStackTrace(); }
            }
        }

        return updatedIds;
    }

    /**
     * Tự động chuyển các giải Ongoing → Completed khi end_date <= hiện tại.
     * @return danh sách tournament_id đã được cập nhật
     */
    public List<Integer> autoCompleteTournaments() {
        List<Integer> updatedIds = new ArrayList<>();

        String selectSql = "SELECT tournament_id FROM Tournaments " +
                "WHERE status = 'Ongoing' AND end_date <= GETDATE()";
        String updateSql = "UPDATE Tournaments SET status = 'Completed' " +
                "WHERE tournament_id = ?";


        Connection conn = null;
        try {
            conn = getConnection();
            conn.setAutoCommit(false);

            List<Integer> ids = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(selectSql);
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ids.add(rs.getInt("tournament_id"));
                }
            }

            for (int tournamentId : ids) {
                try (PreparedStatement psUpdate = conn.prepareStatement(updateSql)) {
                    psUpdate.setInt(1, tournamentId);
                    psUpdate.executeUpdate();
                }

                updatedIds.add(tournamentId);
            }

            conn.commit();
        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            }
            e.printStackTrace();
        } finally {
            if (conn != null) {
                try { conn.setAutoCommit(true); conn.close(); } catch (SQLException e) { e.printStackTrace(); }
            }
        }

        return updatedIds;
    }
}

package com.example.DAO;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

import com.example.model.Participant;
import com.example.util.DBContext;

public class ParticipantDAO extends DBContext {

    // Map ResultSet to Participant
    private Participant mapRow(ResultSet rs) throws SQLException {
        Participant p = new Participant();
        p.setParticipantId(rs.getInt("participant_id"));
        p.setTournamentId(rs.getInt("tournament_id"));
        p.setUserId(rs.getInt("user_id"));
        p.setTitleAtRegistration(rs.getString("title_at_registration"));
        p.setSeed((Integer) rs.getObject("seed"));
        p.setStatus(rs.getString("status"));
        p.setPaid(rs.getBoolean("is_paid"));
        p.setPaymentDate(rs.getTimestamp("payment_date"));
        p.setRegistrationDate(rs.getTimestamp("registration_date"));
        p.setNotes(rs.getString("notes"));
        return p;
    }

    // 1) GET by ID
    public Participant getParticipantById(int participantId) {
        String sql = "SELECT * FROM Participants WHERE participant_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, participantId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return mapRow(rs);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    // 2) GET by Tournament ID
    public List<Participant> getParticipantsByTournamentId(int tournamentId) {
        List<Participant> list = new ArrayList<>();
        String sql = "SELECT * FROM Participants WHERE tournament_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // 3) GET by User ID
    public List<Participant> getParticipantsByUserId(int userId) {
        List<Participant> list = new ArrayList<>();
        String sql = "SELECT * FROM Participants WHERE user_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // 4) CREATE
    public boolean createParticipant(Participant p) {
        String sql = """
            INSERT INTO Participants
            (tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """;
try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, p.getTournamentId());
            ps.setInt(2, p.getUserId());
            ps.setString(3, p.getTitleAtRegistration());
            if (p.getSeed() != null) {
                ps.setInt(4, p.getSeed());
            } else {
                ps.setNull(4, Types.INTEGER);
            }
            ps.setString(5, p.getStatus());
            ps.setBoolean(6, p.isPaid());
            ps.setTimestamp(7, p.getPaymentDate());
            ps.setString(8, p.getNotes());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 5) UPDATE
    public boolean updateParticipant(Participant p) {
        String sql = """
            UPDATE Participants SET
                title_at_registration = ?, seed = ?, status = ?, is_paid = ?, payment_date = ?, notes = ?
            WHERE participant_id = ?
        """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, p.getTitleAtRegistration());
            if (p.getSeed() != null) {
                ps.setInt(2, p.getSeed());
            } else {
                ps.setNull(2, Types.INTEGER);
            }
            ps.setString(3, p.getStatus());
            ps.setBoolean(4, p.isPaid());
            ps.setTimestamp(5, p.getPaymentDate());
            ps.setString(6, p.getNotes());
            ps.setInt(7, p.getParticipantId());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 6) DELETE
    public boolean deleteParticipant(int participantId) {
        String sql = "DELETE FROM Participants WHERE participant_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, participantId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 7) COUNT by Tournament
    public int countParticipantsByTournament(int tournamentId) {
        String sql = "SELECT COUNT(*) AS total FROM Participants WHERE tournament_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return rs.getInt("total");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }
}
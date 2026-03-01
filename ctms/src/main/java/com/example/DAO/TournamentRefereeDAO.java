package com.example.DAO;

import com.example.model.dto.TournamentRefereeDTO;
import com.example.util.DBContext;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class TournamentRefereeDAO extends DBContext {

    public List<TournamentRefereeDTO> getRefereesByTournament(int tournamentId) {
        List<TournamentRefereeDTO> list = new ArrayList<>();
        String sql = """
            SELECT tr.referee_id, u.first_name, u.last_name, u.email, u.avatar,
                   tr.referee_role, tr.assigned_at, tr.note,
                   (SELECT COUNT(*) FROM Match_Referee mr
                    INNER JOIN Matches m ON mr.match_id = m.match_id
                    WHERE mr.referee_id = tr.referee_id
                      AND m.tournament_id = tr.tournament_id) AS match_count
            FROM Tournament_Referee tr
            JOIN Users u ON tr.referee_id = u.user_id
            WHERE tr.tournament_id = ?
            ORDER BY tr.referee_role, u.first_name
        """;

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, tournamentId);
            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                TournamentRefereeDTO dto = new TournamentRefereeDTO();
                dto.setRefereeId(rs.getInt("referee_id"));
                dto.setFirstName(rs.getString("first_name"));
                dto.setLastName(rs.getString("last_name"));
                dto.setEmail(rs.getString("email"));
                dto.setAvatar(rs.getString("avatar"));
                dto.setRefereeRole(rs.getString("referee_role"));
                dto.setAssignedAt(rs.getTimestamp("assigned_at"));
                dto.setNote(rs.getString("note"));
                dto.setMatchCount(rs.getInt("match_count"));
                list.add(dto);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<TournamentRefereeDTO> getAllRefereeUsers() {
        List<TournamentRefereeDTO> list = new ArrayList<>();
        String sql = """
            SELECT u.user_id, u.first_name, u.last_name, u.email, u.avatar
            FROM Users u
            JOIN User_Role ur ON u.user_id = ur.user_id
            JOIN Roles r ON ur.role_id = r.role_id
            WHERE r.role_name = 'Referee'
            ORDER BY u.first_name
        """;

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                TournamentRefereeDTO dto = new TournamentRefereeDTO();
                dto.setRefereeId(rs.getInt("user_id"));
                dto.setFirstName(rs.getString("first_name"));
                dto.setLastName(rs.getString("last_name"));
                dto.setEmail(rs.getString("email"));
                dto.setAvatar(rs.getString("avatar"));
                list.add(dto);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public boolean assignReferee(int tournamentId, int refereeId, String refereeRole, Integer assignedBy, String note) {
        String checkSql = "SELECT 1 FROM Tournament_Referee WHERE tournament_id = ? AND referee_id = ?";
        String insertSql = """
            INSERT INTO Tournament_Referee (tournament_id, referee_id, referee_role, assigned_by, note)
            VALUES (?, ?, ?, ?, ?)
        """;
        String updateSql = """
            UPDATE Tournament_Referee
            SET referee_role = ?, assigned_by = ?, assigned_at = GETDATE(), note = ?
            WHERE tournament_id = ? AND referee_id = ?
        """;

        try (Connection conn = getConnection()) {
            boolean exists;
            try (PreparedStatement cps = conn.prepareStatement(checkSql)) {
                cps.setInt(1, tournamentId);
                cps.setInt(2, refereeId);
                try (ResultSet crs = cps.executeQuery()) {
                    exists = crs.next();
                }
            }

            if (exists) {
                try (PreparedStatement ups = conn.prepareStatement(updateSql)) {
                    ups.setString(1, refereeRole);
                    if (assignedBy == null) ups.setNull(2, java.sql.Types.INTEGER);
                    else ups.setInt(2, assignedBy);
                    ups.setString(3, note);
                    ups.setInt(4, tournamentId);
                    ups.setInt(5, refereeId);
                    return ups.executeUpdate() > 0;
                }
            } else {
                try (PreparedStatement ips = conn.prepareStatement(insertSql)) {
                    ips.setInt(1, tournamentId);
                    ips.setInt(2, refereeId);
                    ips.setString(3, refereeRole);
                    if (assignedBy == null) ips.setNull(4, java.sql.Types.INTEGER);
                    else ips.setInt(4, assignedBy);
                    ips.setString(5, note);
                    return ips.executeUpdate() > 0;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean removeReferee(int tournamentId, int refereeId) {
        String sql = "DELETE FROM Tournament_Referee WHERE tournament_id = ? AND referee_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ps.setInt(2, refereeId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public TournamentRefereeDTO createRefereeUser(
            String firstName,
            String lastName,
            String email,
            String phoneNumber,
            String address,
            String username,
            String password
    ) {
        String checkSql = """
            SELECT 1
            FROM Users
            WHERE email = ? OR phone_number = ?
        """;
        String insertUserSql = """
            INSERT INTO Users (username, first_name, last_name, email, phone_number, address, password, is_active, create_at, balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, GETDATE(), 0)
        """;
        String roleSql = "SELECT role_id FROM Roles WHERE role_name = 'Referee'";
        String insertRoleSql = "INSERT INTO User_Role (user_id, role_id) VALUES (?, ?)";

        try (Connection conn = getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement cps = conn.prepareStatement(checkSql)) {
                    cps.setString(1, email);
                    cps.setString(2, phoneNumber);
                    try (ResultSet rs = cps.executeQuery()) {
                        if (rs.next()) {
                            conn.rollback();
                            return null;
                        }
                    }
                }

                int newUserId;
                try (PreparedStatement ips = conn.prepareStatement(insertUserSql, Statement.RETURN_GENERATED_KEYS)) {
                    ips.setString(1, username);
                    ips.setString(2, firstName);
                    ips.setString(3, lastName);
                    ips.setString(4, email);
                    ips.setString(5, phoneNumber);
                    ips.setString(6, address);
                    ips.setString(7, password);
                    int affected = ips.executeUpdate();
                    if (affected == 0) {
                        conn.rollback();
                        return null;
                    }
                    try (ResultSet rs = ips.getGeneratedKeys()) {
                        if (!rs.next()) {
                            conn.rollback();
                            return null;
                        }
                        newUserId = rs.getInt(1);
                    }
                }

                int refereeRoleId = 0;
                try (PreparedStatement rps = conn.prepareStatement(roleSql);
                     ResultSet rs = rps.executeQuery()) {
                    if (rs.next()) {
                        refereeRoleId = rs.getInt("role_id");
                    }
                }
                if (refereeRoleId <= 0) {
                    conn.rollback();
                    return null;
                }

                try (PreparedStatement urps = conn.prepareStatement(insertRoleSql)) {
                    urps.setInt(1, newUserId);
                    urps.setInt(2, refereeRoleId);
                    if (urps.executeUpdate() == 0) {
                        conn.rollback();
                        return null;
                    }
                }

                conn.commit();

                TournamentRefereeDTO dto = new TournamentRefereeDTO();
                dto.setRefereeId(newUserId);
                dto.setFirstName(firstName);
                dto.setLastName(lastName);
                dto.setEmail(email);
                return dto;
            } catch (SQLException e) {
                conn.rollback();
                e.printStackTrace();
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }
}

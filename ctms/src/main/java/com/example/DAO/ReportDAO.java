package com.example.DAO;

import com.example.model.dto.ReportDTO;
import com.example.model.dto.TournamentReportDTO;
import com.example.util.DBContext;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ReportDAO extends DBContext {

    public int createReport(ReportDTO dto) throws SQLException {
        String sql = """
            INSERT INTO Report (reporter_id, accused_id, match_id, description, evidence_url, type, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, PreparedStatement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, dto.getReporterId());
            if (dto.getAccusedId() != null) {
                ps.setInt(2, dto.getAccusedId());
            } else {
                ps.setNull(2, java.sql.Types.INTEGER);
            }
            if (dto.getMatchId() != null) {
                ps.setInt(3, dto.getMatchId());
            } else {
                ps.setNull(3, java.sql.Types.INTEGER);
            }
            ps.setString(4, dto.getDescription());
            ps.setString(5, dto.getEvidenceUrl());
            ps.setString(6, dto.getType());
            ps.setString(7, dto.getStatus());
            int affected = ps.executeUpdate();
            if (affected <= 0) return -1;
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
            return -1;
        }
    }

    public List<ReportDTO> getReportsByReporter(int reporterId) throws SQLException {
        List<ReportDTO> list = new ArrayList<>();
        String sql = """
            SELECT r.report_id, r.reporter_id, r.accused_id, r.match_id,
                   r.description, r.evidence_url,
                   r.type, r.status, r.note, r.resolved_by, r.create_at, r.resolved_at,
                   rep.username AS reporter_username,
                   acc.username AS accused_username
            FROM Report r
            LEFT JOIN Users rep ON rep.user_id = r.reporter_id
            LEFT JOIN Users acc ON acc.user_id = r.accused_id
            WHERE r.reporter_id = ?
            ORDER BY r.create_at DESC
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, reporterId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        }
        return list;
    }

    public boolean existsByReporterAndMatch(int reporterId, Integer matchId) throws SQLException {
        if (matchId == null) return false;
        String sql = """
            SELECT 1 FROM Report
            WHERE reporter_id = ? AND match_id = ?
              AND type IN ('Cheating','Misconduct')
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, reporterId);
            ps.setInt(2, matchId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    public boolean existsByReporterMatchAndAccused(int reporterId, Integer matchId, Integer accusedId) throws SQLException {
        if (matchId == null || accusedId == null) return false;
        String sql = """
            SELECT 1 FROM Report
            WHERE reporter_id = ? AND match_id = ? AND accused_id = ?
              AND type IN ('Cheating','Misconduct')
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, reporterId);
            ps.setInt(2, matchId);
            ps.setInt(3, accusedId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    public List<ReportDTO> getSystemReportsForStaff(String status) throws SQLException {
        List<ReportDTO> list = new ArrayList<>();
        String sql = """
            SELECT r.report_id, r.reporter_id, r.accused_id, r.match_id,
                   r.description, r.evidence_url,
                   r.type, r.status, r.note, r.resolved_by, r.create_at, r.resolved_at,
                   rep.username AS reporter_username,
                   acc.username AS accused_username
            FROM Report r
            LEFT JOIN Users rep ON rep.user_id = r.reporter_id
            LEFT JOIN Users acc ON acc.user_id = r.accused_id
            WHERE r.type IN ('TechnicalIssue','Other')
              AND (? IS NULL OR r.status = ?)
            ORDER BY r.create_at DESC
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            if (status == null || status.isBlank()) {
                ps.setNull(1, java.sql.Types.VARCHAR);
                ps.setNull(2, java.sql.Types.VARCHAR);
            } else {
                ps.setString(1, status);
                ps.setString(2, status);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        }
        return list;
    }

    public List<ReportDTO> getViolationReportsByTournament(int tournamentId, String status) throws SQLException {
        List<ReportDTO> list = new ArrayList<>();
        String sql = """
            SELECT r.report_id, r.reporter_id, r.accused_id, r.match_id,
                   r.description, r.evidence_url,
                   r.type, r.status, r.note, r.resolved_by, r.create_at, r.resolved_at,
                   rep.username AS reporter_username,
                   acc.username AS accused_username
            FROM Report r
            JOIN Matches m ON r.match_id = m.match_id
            LEFT JOIN Users rep ON rep.user_id = r.reporter_id
            LEFT JOIN Users acc ON acc.user_id = r.accused_id
            WHERE m.tournament_id = ?
              AND r.type IN ('Cheating','Misconduct')
              AND (? IS NULL OR r.status = ?)
            ORDER BY r.create_at DESC
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            if (status == null || status.isBlank()) {
                ps.setNull(2, java.sql.Types.VARCHAR);
                ps.setNull(3, java.sql.Types.VARCHAR);
            } else {
                ps.setString(2, status);
                ps.setString(3, status);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        }
        return list;
    }

    public boolean updateReportDecision(int reportId, String status, String note, int resolvedBy) throws SQLException {
        String sql = """
            UPDATE Report
            SET status = ?, note = ?, resolved_by = ?, resolved_at = GETDATE()
            WHERE report_id = ?
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setString(2, note);
            ps.setInt(3, resolvedBy);
            ps.setInt(4, reportId);
            return ps.executeUpdate() > 0;
        }
    }

    public ReportDTO getById(int reportId) throws SQLException {
        String sql = """
            SELECT report_id, reporter_id, accused_id, match_id, description, evidence_url,
                   type, status, note, resolved_by, create_at, resolved_at
            FROM Report
            WHERE report_id = ?
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, reportId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        }
        return null;
    }

    public List<TournamentReportDTO> getReportsByTournament(int tournamentId) {
        List<TournamentReportDTO> list = new ArrayList<>();
        String sql = """
            SELECT r.report_id,
                   CONCAT(reporter.first_name, ' ', reporter.last_name) AS reporter_name,
                   CONCAT(accused.first_name, ' ', accused.last_name)   AS accused_name,
                   r.match_id, r.description, r.evidence_url,
                   r.type, r.status, r.note,
                   CONCAT(resolver.first_name, ' ', resolver.last_name) AS resolved_by_name,
                   r.create_at, r.resolved_at
            FROM Report r
            JOIN Users reporter ON r.reporter_id = reporter.user_id
            LEFT JOIN Users accused  ON r.accused_id  = accused.user_id
            LEFT JOIN Users resolver ON r.resolved_by = resolver.user_id
            JOIN Matches m ON r.match_id = m.match_id
            WHERE m.tournament_id = ?
            ORDER BY r.create_at DESC
        """;

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, tournamentId);
            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                TournamentReportDTO dto = new TournamentReportDTO();
                dto.setReportId(rs.getInt("report_id"));
                dto.setReporterName(rs.getString("reporter_name"));
                dto.setAccusedName(rs.getString("accused_name"));
                dto.setMatchId(rs.getInt("match_id"));
                dto.setDescription(rs.getString("description"));
                dto.setEvidenceUrl(rs.getString("evidence_url"));
                dto.setType(rs.getString("type"));
                dto.setStatus(rs.getString("status"));
                dto.setNote(rs.getString("note"));
                dto.setResolvedByName(rs.getString("resolved_by_name"));
                dto.setCreateAt(rs.getTimestamp("create_at"));
                dto.setResolvedAt(rs.getTimestamp("resolved_at"));
                list.add(dto);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    private ReportDTO mapRow(ResultSet rs) throws SQLException {
        ReportDTO dto = new ReportDTO();
        dto.setReportId(rs.getInt("report_id"));
        dto.setReporterId((Integer) rs.getObject("reporter_id"));
        dto.setAccusedId((Integer) rs.getObject("accused_id"));
        dto.setMatchId((Integer) rs.getObject("match_id"));
        dto.setDescription(rs.getString("description"));
        dto.setEvidenceUrl(rs.getString("evidence_url"));
        dto.setType(rs.getString("type"));
        dto.setStatus(rs.getString("status"));
        dto.setNote(rs.getString("note"));
        dto.setResolvedBy((Integer) rs.getObject("resolved_by"));
        dto.setCreateAt(rs.getTimestamp("create_at"));
        dto.setResolvedAt(rs.getTimestamp("resolved_at"));
        try { dto.setReporterUsername(rs.getString("reporter_username")); } catch (Exception ignored) {}
        try { dto.setAccusedUsername(rs.getString("accused_username")); } catch (Exception ignored) {}
        return dto;
    }
}


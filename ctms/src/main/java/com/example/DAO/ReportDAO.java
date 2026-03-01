package com.example.DAO;

import com.example.model.dto.TournamentReportDTO;
import com.example.util.DBContext;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ReportDAO extends DBContext {

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
}

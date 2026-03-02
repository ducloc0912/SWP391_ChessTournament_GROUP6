package com.example.service.leader;

import com.example.DAO.TournamentDAO;
import com.example.DAO.TournamentRefereeDAO;
import com.example.DAO.ReportDAO;
import com.example.model.dto.TournamentDTO;
import com.example.model.dto.TournamentPlayerDTO;
import com.example.model.dto.TournamentRefereeDTO;
import com.example.model.dto.TournamentReportDTO;
import com.example.DAO.ParticipantDAO;
import com.example.util.PasswordUtil;

import java.math.BigDecimal;
import java.util.List;

public class TournamentService {

    private final TournamentDAO tournamentDAO;
    private final ParticipantDAO participantDAO;
    private final TournamentRefereeDAO refereeDAO;
    private final ReportDAO reportDAO;

    public TournamentService() {
        this.tournamentDAO = new TournamentDAO();
        this.participantDAO = new ParticipantDAO();
        this.refereeDAO = new TournamentRefereeDAO();
        this.reportDAO = new ReportDAO();
    }

    public List<TournamentDTO> getAllTournamentsWithCurrentPlayers() {

        List<TournamentDTO> list = tournamentDAO.getAllTournaments();

        for (TournamentDTO t : list) {
            int count =
                participantDAO.countParticipantsByTournament(
                    t.getTournamentId()
                );

            t.setCurrentPlayers(count);
        }

        return list;
    }

    public TournamentDTO getTournamentByIdWithCurrentPlayers(int id) {
        if (id <= 0) return null;
        TournamentDTO t = tournamentDAO.getTournamentById(id);
        if (t != null) {
            int count = participantDAO.countParticipantsByTournament(id);
            t.setCurrentPlayers(count);
            t.setTournamentImages(tournamentDAO.getTournamentImages(id));
        }
        return t;
    }

    // =========================
    // PLAYERS (JOIN)
    // =========================
    public List<TournamentPlayerDTO> getPlayersByTournament(int tournamentId) {
        if (tournamentId <= 0) return List.of();
        return participantDAO.getPlayersWithUserInfo(tournamentId);
    }

    // =========================
    // REFEREES (JOIN)
    // =========================
    public List<TournamentRefereeDTO> getRefereesByTournament(int tournamentId) {
        if (tournamentId <= 0) return List.of();
        return refereeDAO.getRefereesByTournament(tournamentId);
    }

    public List<TournamentRefereeDTO> getAllRefereeUsers() {
        return refereeDAO.getAllRefereeUsers();
    }

    public boolean assignRefereeToTournament(
            int tournamentId,
            int refereeId,
            String refereeRole,
            Integer assignedBy,
            String note
    ) {
        if (tournamentId <= 0 || refereeId <= 0) return false;
        String role = (refereeRole == null || refereeRole.isBlank()) ? "Assistant" : refereeRole.trim();
        if (!"Chief".equalsIgnoreCase(role) && !"Assistant".equalsIgnoreCase(role)) {
            return false;
        }
        String normalizedRole = "Chief".equalsIgnoreCase(role) ? "Chief" : "Assistant";
        return refereeDAO.assignReferee(tournamentId, refereeId, normalizedRole, assignedBy, note);
    }

    public boolean removeRefereeFromTournament(int tournamentId, int refereeId) {
        if (tournamentId <= 0 || refereeId <= 0) return false;
        return refereeDAO.removeReferee(tournamentId, refereeId);
    }

    public TournamentRefereeDTO createRefereeUser(
            String firstName,
            String lastName,
            String email,
            String phoneNumber,
            String address
    ) {
        if (isBlank(firstName) || isBlank(lastName) || isBlank(email) || isBlank(phoneNumber)) {
            return null;
        }

        String normalizedEmail = email.trim();
        String normalizedPhone = phoneNumber.trim();
        String normalizedAddress = address == null ? null : address.trim();

        // Dung email local-part lam username de tao nhanh tai khoan trong he thong.
        String username = normalizedEmail.contains("@")
                ? normalizedEmail.substring(0, normalizedEmail.indexOf('@'))
                : normalizedEmail;
        if (username.length() > 50) {
            username = username.substring(0, 50);
        }

        // Mat khau mac dinh theo yeu cau, duoc hash theo chuan he thong.
        String temporaryPassword = "12345";
        String hashedPassword = PasswordUtil.hashPassword(temporaryPassword);

        return refereeDAO.createRefereeUser(
                firstName.trim(),
                lastName.trim(),
                normalizedEmail,
                normalizedPhone,
                normalizedAddress,
                username,
                hashedPassword
        );
    }

    // =========================
    // REPORTS (JOIN)
    // =========================
    public List<TournamentReportDTO> getReportsByTournament(int tournamentId) {
        if (tournamentId <= 0) return List.of();
        return reportDAO.getReportsByTournament(tournamentId);
    }

    // =========================
    // COUNT
    // =========================
    public int countAllTournaments() {
        return tournamentDAO.countAllTournaments();
    }

    public int countCancelledTournaments() {
        return tournamentDAO.countCancelledTournaments();
    }

    // =========================
    // CREATE
    // =========================
    public boolean createTournament(TournamentDTO t) {

        if (t == null) return false;

        // ---- REQUIRED FIELDS ----
        if (isBlank(t.getTournamentName())) return false;
        if (isBlank(t.getFormat())) return false;
        if (isBlank(t.getCategories())) return false;

        // ---- PLAYER VALIDATION ----
        if (t.getMinPlayer() < 0 || t.getMaxPlayer() < 0) return false;
        if (t.getMinPlayer() > t.getMaxPlayer()) return false;

        // ---- DEFAULT VALUES ----
        if (t.getEntryFee() == null) {
            t.setEntryFee(BigDecimal.ZERO);
        }

        if (t.getPrizePool() == null) {
            t.setPrizePool(BigDecimal.ZERO);
        }

        // create_at → DB DEFAULT
        // status → DB DEFAULT (Pending)

        return tournamentDAO.createTournament(t);
    }

    // =========================
    // READ
    // =========================
    public TournamentDTO getTournamentById(int id) {
        if (id <= 0) return null;
        return tournamentDAO.getTournamentById(id);
    }

    public List<TournamentDTO> getAllTournaments() {
        return tournamentDAO.getAllTournaments();
    }

    // =========================
    // UPDATE
    // =========================
    public boolean updateTournament(TournamentDTO t) {

        if (t == null) return false;
        if (t.getTournamentId() <= 0) return false;
if (isBlank(t.getTournamentName())) return false;
        if (t.getMinPlayer() > t.getMaxPlayer()) return false;

        return tournamentDAO.updateTournament(t);
    }

    // =========================
    // CANCEL (SOFT DELETE)
    // =========================
    public boolean cancelTournament(int tournamentId, String reason) {
        if (tournamentId <= 0) return false;
        if (reason == null || reason.trim().isEmpty()) return false;
        return tournamentDAO.cancelTournament(tournamentId, reason);
    }

    // =========================
    // DELETE (HARD DELETE)
    // =========================
    public boolean deleteTournament(int tournamentId, String reason) {
        if (tournamentId <= 0) return false;
        if (reason == null || reason.trim().isEmpty()) return false;
        return tournamentDAO.deleteTournament(tournamentId);
    }

    // DELETE - backward compatible
    public boolean deleteTournament(int tournamentId) {
        if (tournamentId <= 0) return false;
        return tournamentDAO.deleteTournament(tournamentId);
    }

    // =========================
    // UTIL
    // =========================
    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}

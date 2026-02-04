package com.example.service.leader;

import com.example.DAO.TournamentDAO;
import com.example.DAO.ParticipantDAO;
import com.example.model.entity.Tournament;
import java.math.BigDecimal;
import java.util.List;

public class TournamentService {

    private final TournamentDAO tournamentDAO;
    private final ParticipantDAO participantDAO;

    public TournamentService() {
        this.tournamentDAO = new TournamentDAO();
        this.participantDAO = new ParticipantDAO();
    }

    public List<Tournament> getAllTournamentsWithCurrentPlayers() {

        List<Tournament> list = tournamentDAO.getAllTournaments();

        for (Tournament t : list) {
            int count =
                participantDAO.countParticipantsByTournament(
                    t.getTournamentId()
                );

            t.setCurrentPlayers(count);
        }

        return list;
    }

    public Tournament getTournamentByIdWithCurrentPlayers(int id) {
        if (id <= 0) return null;
        Tournament t = tournamentDAO.getTournamentById(id);
        if (t != null) {
            int count = participantDAO.countParticipantsByTournament(id);
            t.setCurrentPlayers(count);
        }
        return t;
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
    public boolean createTournament(Tournament t) {

        if (t == null) return false;

        // ---- REQUIRED FIELDS ----
        if (isBlank(t.getTournamentName())) return false;
        if (t.getFormat() == null) return false;
        if (isBlank(t.getCategories())) return false;

        // ---- PLAYER VALIDATION ----
        if (t.getMinPlayer() == null || t.getMaxPlayer() == null) return false;
        if (t.getMinPlayer() < 0 || t.getMaxPlayer() < 0) return false;
        if (t.getMinPlayer() > t.getMaxPlayer()) return false;

        // ---- DEFAULT VALUES ----
        if (t.getEntryFee() == null) {
            t.setEntryFee(BigDecimal.ZERO);
        }

        if (t.getPrizePool() == null) {
            t.setPrizePool(BigDecimal.ZERO);
        }

        return tournamentDAO.createTournament(t);
    }

    // =========================
    // READ
    // =========================
    public Tournament getTournamentById(int id) {
        if (id <= 0) return null;
        return tournamentDAO.getTournamentById(id);
    }

    public List<Tournament> getAllTournaments() {
        return tournamentDAO.getAllTournaments();
    }

    // =========================
    // UPDATE
    // =========================
    public boolean updateTournament(Tournament t) {

        if (t == null) return false;
        if (t.getTournamentId() <= 0) return false;
        if (isBlank(t.getTournamentName())) return false;
        if (isBlank(t.getLocation())) return false;
        if (isBlank(t.getCategories())) return false;
        if (isBlank(t.getDescription())) return false;
        if (t.getFormat() == null) return false;
        if (t.getMinPlayer() == null || t.getMaxPlayer() == null) return false;
        if (t.getMinPlayer() < 0 || t.getMaxPlayer() < 0) return false;
        if (t.getMinPlayer() > t.getMaxPlayer()) return false;

        return tournamentDAO.updateTournament(t);
    }

    // =========================
    // DELETE (SOFT DELETE)
    // =========================
    public boolean deleteTournament(int tournamentId, String reason) {
        if (tournamentId <= 0) return false;
        if (reason == null || reason.trim().isEmpty()) return false;

        return tournamentDAO.deleteTournament(tournamentId, reason);
    }
    // =========================
    // UTIL
    // =========================
    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}

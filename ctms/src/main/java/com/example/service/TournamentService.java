package com.example.service;

import com.example.DAO.TournamentDAO;
import com.example.model.Tournament;

import java.math.BigDecimal;
import java.util.List;

public class TournamentService {

    private final TournamentDAO tournamentDAO;

    public TournamentService() {
        this.tournamentDAO = new TournamentDAO();
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
        if (t.getMinPlayer() > t.getMaxPlayer()) return false;

        return tournamentDAO.updateTournament(t);
    }

    // =========================
    // DELETE (SOFT DELETE)
    // =========================
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

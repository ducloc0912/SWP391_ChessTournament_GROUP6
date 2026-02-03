package com.example.service;

import java.util.List;
import com.example.DAO.TournamentDAO;
import com.example.model.Tournament;

public class TournamentService {
    private TournamentDAO tournamentDAO = new TournamentDAO();

    public List<Tournament> getAllTournaments() {
        return tournamentDAO.getAllTournaments();
    }

    public boolean updateTournamentStatus(int id, String status, String notes) {
        return tournamentDAO.updateStatus(id, status, notes);
    }

    // Legacy wrappers if needed, but we should switch controller to use the above
    public boolean approveTournament(int id) {
        return tournamentDAO.updateStatus(id, "Ongoing", "");
    }

    public boolean rejectTournament(int id) {
        return tournamentDAO.updateStatus(id, "Rejected", "");
    }
}

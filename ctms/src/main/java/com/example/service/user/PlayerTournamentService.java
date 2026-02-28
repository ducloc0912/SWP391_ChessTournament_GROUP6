package com.example.service.user;

import com.example.DAO.TournamentDAO;
import com.example.model.dto.PlayerTournamentDTO;

import java.util.List;

public class PlayerTournamentService {
    private final TournamentDAO tournamentDAO;

    public PlayerTournamentService() {
        this.tournamentDAO = new TournamentDAO();
    }

    public List<PlayerTournamentDTO> getPlayerTournamentCards(
            Integer userId,
            String keyword,
            String format,
            String dbStatus,
            String entryType,
            boolean registeredOnly,
            String sortBy
    ) {
        return tournamentDAO.getPlayerTournamentCards(
                userId,
                keyword,
                format,
                dbStatus,
                entryType,
                registeredOnly,
                sortBy
        );
    }
}

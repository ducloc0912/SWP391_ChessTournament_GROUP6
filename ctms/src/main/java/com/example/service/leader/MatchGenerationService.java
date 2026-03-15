package com.example.service.leader;

import com.example.model.dto.TournamentSetupMatchDTO;

import java.util.ArrayList;
import java.util.List;

/**
 * Generates matches for Round Robin and Knock Out formats.
 * Players are identified by user_id (Integer). Seeding order: index 0 = seed 1, etc.
 */
public class MatchGenerationService {

    /**
     * Single round robin: each player plays each other once.
     * Circle method: for even n use n-1 rounds; for odd n add bye and remove bye matches.
     */
    public static List<TournamentSetupMatchDTO> generateRoundRobinMatches(List<Integer> playerIds, boolean doubleRoundRobin) {
        if (playerIds == null || playerIds.size() < 2) return List.of();
        List<Integer> ids = new ArrayList<>(playerIds);
        boolean odd = (ids.size() % 2 != 0);
        if (odd) ids.add(null);
        int n = ids.size();
        int rounds = n - 1;
        List<TournamentSetupMatchDTO> out = new ArrayList<>();
        for (int r = 0; r < rounds; r++) {
            int roundIndex = r + 1;
            String roundName = "Round " + roundIndex;
            for (int i = 0; i < n / 2; i++) {
                Integer w = ids.get(i);
                Integer b = ids.get(n - 1 - i);
                if (w == null || b == null) continue;
                TournamentSetupMatchDTO m = new TournamentSetupMatchDTO();
                m.setStage("RoundRobin");
                m.setRoundName(roundName);
                m.setRoundIndex(roundIndex);
                m.setBoardNumber(i + 1);
                m.setPlayer1Id(w);
                m.setPlayer2Id(b);
                out.add(m);
            }
            if (n > 2) {
                Integer last = ids.remove(ids.size() - 1);
                ids.add(1, last);
            }
        }
        if (doubleRoundRobin) {
            int baseRounds = rounds;
            for (TournamentSetupMatchDTO m : new ArrayList<>(out)) {
                TournamentSetupMatchDTO m2 = new TournamentSetupMatchDTO();
                m2.setStage("RoundRobin");
                m2.setRoundName("Round " + (m.getRoundIndex() + baseRounds) + " (leg 2)");
                m2.setRoundIndex(m.getRoundIndex() + baseRounds);
                m2.setBoardNumber(m.getBoardNumber());
                m2.setPlayer1Id(m.getPlayer2Id());
                m2.setPlayer2Id(m.getPlayer1Id());
                out.add(m2);
            }
        }
        return out;
    }

    /**
     * Knock out bracket. seeding: list of player ids in seed order (seed 1 first). Size padded to power of 2.
     * Round 1 standard: (1v8, 4v5, 2v7, 3v6) for 8 players.
     */
    public static List<TournamentSetupMatchDTO> generateKnockoutMatches(List<Integer> playerIds, List<Integer> seeding) {
        List<Integer> order = seeding != null && !seeding.isEmpty() ? new ArrayList<>(seeding) : (playerIds != null ? new ArrayList<>(playerIds) : new ArrayList<>());
        if (order.isEmpty()) return List.of();
        int n = order.size();
        int pow = nextPowerOf2(n);
        while (order.size() < pow) order.add(null);
        int matchesInRound = pow / 2;
        int roundIndex = 1;
        List<TournamentSetupMatchDTO> out = new ArrayList<>();
        while (matchesInRound >= 1) {
            String roundName = matchesInRound == 2 ? "Semifinals" : (matchesInRound == 1 ? "Final" : "Round " + roundIndex);
            for (int i = 0; i < matchesInRound; i++) {
                TournamentSetupMatchDTO m = new TournamentSetupMatchDTO();
                m.setStage("KnockOut");
                m.setRoundName(roundName);
                m.setRoundIndex(roundIndex);
                m.setBoardNumber(i + 1);
                if (roundIndex == 1) {
                    int wIdx = bracketLeftSlot(pow, i);
                    int bIdx = bracketRightSlot(pow, i);
                    m.setPlayer1Id(wIdx < order.size() ? order.get(wIdx) : null);
                    m.setPlayer2Id(bIdx < order.size() ? order.get(bIdx) : null);
                }
                out.add(m);
            }
            matchesInRound /= 2;
            roundIndex++;
        }
        return out;
    }

    private static int nextPowerOf2(int n) {
        if (n <= 1) return 1;
        int p = 1;
        while (p < n) p *= 2;
        return p;
    }

    private static int bracketLeftSlot(int size, int matchIndex) {
        if (size == 8) {
            int[] left = { 0, 3, 1, 2 };
            return matchIndex < left.length ? left[matchIndex] : matchIndex * 2;
        }
        if (size == 16) {
            int[] left = { 0, 7, 3, 4, 1, 6, 2, 5 };
            return matchIndex < left.length ? left[matchIndex] : matchIndex * 2;
        }
        return matchIndex * 2;
    }

    private static int bracketRightSlot(int size, int matchIndex) {
        if (size == 8) {
            int[] right = { 7, 4, 6, 5 };
            return matchIndex < right.length ? right[matchIndex] : matchIndex * 2 + 1;
        }
        if (size == 16) {
            int[] right = { 15, 8, 12, 11, 14, 9, 13, 10 };
            return matchIndex < right.length ? right[matchIndex] : matchIndex * 2 + 1;
        }
        return matchIndex * 2 + 1;
    }
}

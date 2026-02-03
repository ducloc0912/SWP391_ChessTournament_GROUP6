
package com.example.service.user;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.DAO.ProfileDAO;

public class ProfileService {

    private final ProfileDAO profileDAO = new ProfileDAO();

    private String normalizeRole(String role) {
        if (role == null) return "Player";
        String r = role.trim();
        if (r.isEmpty()) return "Player";

        // Normalize common variants coming from DB / legacy naming
        String low = r.toLowerCase();
        return switch (low) {
            case "player" -> "Player";
            case "admin" -> "Admin";
            case "staff" -> "Staff";
            case "referee" -> "Referee";
            // common leader variants
            case "leader", "tournamentleader", "tournament_leader", "tournament-leader" -> "TournamentLeader";
            default -> r; // keep as-is (still returned to FE)
        };
    }

    public Map<String, Object> getProfile(int userId, String role) {
        role = normalizeRole(role);

        Map<String, Object> res = new HashMap<>();
        Map<String, Object> data = new HashMap<>();
        res.put("data", data);

        try {
            Map<String, Object> userInfo = profileDAO.getUserBasic(userId);

            if (userInfo == null) {
                res.put("success", false);
                res.put("message", "User not found");
                return res;
            }

            data.put("role", role);
            data.put("user", userInfo);

            switch (role) {
                case "Player" -> {
                    data.put("stats", profileDAO.getPlayerStats(userId));
                    data.put("tournaments", profileDAO.getPlayerTournaments(userId));
                }
                case "TournamentLeader" -> {
                    data.put("stats", profileDAO.getLeaderStats(userId));
                    data.put("tournaments", profileDAO.getLeaderTournaments(userId));
                }
                case "Referee" -> {
                    data.put("stats", profileDAO.getRefereeStats(userId));
                    data.put("tournaments", profileDAO.getRefereeTournaments(userId));
                }
                case "Staff" -> {
                    data.put("stats", profileDAO.getStaffStats(userId));
                    data.put("tournaments", profileDAO.getStaffTournaments(userId));
                }
                default -> {
                    data.put("stats", Map.of());
                    data.put("tournaments", List.of());
                }
            }

            res.put("success", true);
            return res;

        } catch (Exception e) {
            e.printStackTrace();
            res.put("success", false);
            res.put("message", "Server error");
            return res;
        }
    }
     public Map<String, Object> updateProfile(int userId, String role,
                                            String username,
                                            String firstName,
                                            String lastName,
                                            String phoneNumber,
                                            String address,
                                            java.sql.Date birthday,
                                            String avatar) {
        Map<String, Object> res = new HashMap<>();

        try {
            if (username != null && profileDAO.isUsernameTaken(username, userId)) {
                res.put("success", false);
                res.put("message", "Username already exists");
                return res;
            }

            boolean ok = profileDAO.updateUserBasic(userId, username, firstName, lastName, phoneNumber, address, birthday, avatar);
            if (!ok) {
                res.put("success", false);
                res.put("message", "Update failed");
                return res;
            }

            // trả lại profile mới cho FE render lại ngay
            return getProfile(userId, role);

        } catch (Exception e) {
            e.printStackTrace();
            res.put("success", false);
            res.put("message", "Server error");
            return res;
        }
    }

    public Map<String, Object> updateAvatar(int userId, String role, String avatarUrl) {
        Map<String, Object> res = new HashMap<>();
        try {
            boolean ok = profileDAO.updateAvatar(userId, avatarUrl);
            if (!ok) {
                res.put("success", false);
                res.put("message", "Update avatar failed");
                return res;
            }
            return getProfile(userId, role);
        } catch (Exception e) {
            e.printStackTrace();
            res.put("success", false);
            res.put("message", "Server error");
            return res;
        }
    }
}


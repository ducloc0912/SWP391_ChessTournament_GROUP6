
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
    private static final java.util.regex.Pattern USERNAME_PATTERN = java.util.regex.Pattern.compile("^[a-zA-Z0-9_]{3,50}$");
    private static final java.util.regex.Pattern PHONE_VN_PATTERN = java.util.regex.Pattern.compile("^0[0-9]{9}$");

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
            // 1. Username validation
            if (username != null && !username.isBlank()) {
                String u = username.trim();
                if (u.length() < 3 || u.length() > 50) {
                    res.put("success", false);
                    res.put("message", "Username phải từ 3 đến 50 ký tự.");
                    return res;
                }
                if (!USERNAME_PATTERN.matcher(u).matches()) {
                    res.put("success", false);
                    res.put("message", "Username chỉ được dùng chữ cái, số và gạch dưới.");
                    return res;
                }
                if (profileDAO.isUsernameTaken(u, userId)) {
                    res.put("success", false);
                    res.put("message", "Username đã tồn tại.");
                    return res;
                }
            }

            // 2. First name / Last name: not blank when provided
            if (firstName != null && firstName.trim().isBlank()) {
                res.put("success", false);
                res.put("message", "Họ không được để trống.");
                return res;
            }
            if (firstName != null && firstName.trim().length() > 50) {
                res.put("success", false);
                res.put("message", "Họ không được quá 50 ký tự.");
                return res;
            }
            if (lastName != null && lastName.trim().isBlank()) {
                res.put("success", false);
                res.put("message", "Tên không được để trống.");
                return res;
            }
            if (lastName != null && lastName.trim().length() > 50) {
                res.put("success", false);
                res.put("message", "Tên không được quá 50 ký tự.");
                return res;
            }

            // 3. Phone: format VN 10 digits (0xxxxxxxxx) and unique
            if (phoneNumber != null && !phoneNumber.isBlank()) {
                String p = phoneNumber.trim();
                if (!PHONE_VN_PATTERN.matcher(p).matches()) {
                    res.put("success", false);
                    res.put("message", "Số điện thoại không hợp lệ. VD: 0901234567 (10 số, bắt đầu bằng 0).");
                    return res;
                }
                if (profileDAO.isPhoneTaken(p, userId)) {
                    res.put("success", false);
                    res.put("message", "Số điện thoại này đã được đăng ký bởi tài khoản khác.");
                    return res;
                }
            }

            // 4. Address: max length (servlet already limits; double-check)
            if (address != null && address.length() > 255) {
                res.put("success", false);
                res.put("message", "Địa chỉ không được quá 255 ký tự.");
                return res;
            }

            boolean ok = profileDAO.updateUserBasic(userId, username, firstName, lastName, phoneNumber, address, birthday, avatar);
            if (!ok) {
                res.put("success", false);
                res.put("message", "Cập nhật thất bại.");
                return res;
            }

            // trả lại profile mới cho FE render lại ngay
            return getProfile(userId, role);

        } catch (Exception e) {
            Throwable t = e.getCause() != null ? e.getCause() : e;
            String msg = t.getMessage() != null ? t.getMessage().toLowerCase() : "";
            if (msg.contains("unique") || msg.contains("duplicate") || msg.contains("constraint")) {
                if (msg.contains("username")) {
                    res.put("success", false);
                    res.put("message", "Username đã tồn tại.");
                    return res;
                }
                if (msg.contains("phone") || msg.contains("phone_number")) {
                    res.put("success", false);
                    res.put("message", "Số điện thoại này đã được đăng ký.");
                    return res;
                }
            }
            e.printStackTrace();
            res.put("success", false);
            res.put("message", "Lỗi hệ thống. Vui lòng thử lại.");
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


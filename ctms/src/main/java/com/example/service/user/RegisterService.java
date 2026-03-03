package com.example.service.user;

import com.example.DAO.UserDAO;
import com.example.model.entity.User;
import com.example.util.PasswordUtil;
import com.example.util.ValidationUtil;
import java.util.HashMap;

public class RegisterService {

    private static final String DEFAULT_ROLE = "Player";

    public HashMap<String, Object> register(
            String firstName, String lastName, String username,
            String phone, String email, String address,
            String password, String confirmPassword, String role, boolean agree) {

        HashMap<String, String> errors =
                ValidationUtil.validateRegister(
                        firstName, lastName, username,
                        phone, email, password,
                        confirmPassword, agree, address
                );

        HashMap<String, Object> result = new HashMap<>();

        // 1️⃣ Validate
        if (!errors.isEmpty()) {
            result.put("success", false);
            result.put("errors", errors);
            return result;
        }

        // 2️⃣ Hash password
        String hashedPassword = PasswordUtil.hashPassword(password);

        // 3️⃣ Create user
        User user = new User(
                firstName, lastName, username,
                phone, email, address, hashedPassword
        );

        UserDAO dao = new UserDAO();

        // 4️⃣ Insert Users
        if (!dao.insert(user)) {
            result.put("success", false);
            result.put("message", "Register failed");
            return result;
        }

        // 5️⃣ Get user_id
        int userId = dao.getUserIdByEmail(email);
        if (userId <= 0) {
            result.put("success", false);
            result.put("message", "Cannot get user id");
            return result;
        }

        // 6️⃣ Get role_id (Player, TournamentLeader, Referee)
        String roleName = normalizeRole(role);
        int roleId = dao.getRoleIdByName(roleName);
        if (roleId <= 0) {
            result.put("success", false);
            result.put("message", "Default role not found");
            return result;
        }

        // 7️⃣ Assign role
        if (!dao.assignRole(userId, roleId)) {
            result.put("success", false);
            result.put("message", "Assign role failed");
            return result;
        }

        // 8️⃣ Done
        result.put("success", true);
        return result;
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) return DEFAULT_ROLE;
        String r = role.trim();
        if (r.equalsIgnoreCase("TournamentLeader") || r.equalsIgnoreCase("tournament_leader")) return "TournamentLeader";
        if (r.equalsIgnoreCase("Referee")) return "Referee";
        return "Player";
    }
}

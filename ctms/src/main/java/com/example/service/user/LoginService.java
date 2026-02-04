package com.example.service.user;

import com.example.DAO.UserDAO;
import com.example.model.User;
import com.example.model.UserRole;
import com.example.util.PasswordUtil;

import java.util.HashMap;

public class LoginService {

    public HashMap<String, Object> login(String email, String password) {
    HashMap<String, Object> result = new HashMap<>();
    if (email == null || email.isBlank() ||
            password == null || password.isBlank()) {

            result.put("success", false);
            result.put("message", "Email and password are required");
            return result;
        }

    UserDAO dao = new UserDAO();
    String hashedPassword = PasswordUtil.hashPassword(password);
    UserRole user = dao.findUserWithRole(email, hashedPassword);

    if (user == null) {
        result.put("success", false);
        result.put("message", "Invalid email or password");
        return result;
    }

    String role = user.getRoleName().toUpperCase();
    String redirect;

    switch (role) {
        case "ADMIN" -> redirect = "/admin/Dashboard";
        case "STAFF" -> redirect = "/staff";
        case "TOURNAMENTLEADER" -> redirect = "/tournamentLeader";
        case "REFEREE" -> redirect = "/referee";
        case "PLAYER" -> redirect = "/player";
        default -> redirect = "/";
    }

    result.put("success", true);
    result.put("user", user);
    result.put("role", role);
    result.put("redirect", redirect);

    return result;
}

}

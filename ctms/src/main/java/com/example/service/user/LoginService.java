package com.example.service.user;

import com.example.DAO.UserDAO;
import com.example.model.User;
import com.example.util.PasswordUtil;
import java.util.HashMap;

public class LoginService {

    public HashMap<String, Object> login(String email, String password) {
        HashMap<String, Object> result = new HashMap<>();

        UserDAO dao = new UserDAO();
        User user = dao.findByEmail(email);

        if (user == null) {
            result.put("success", false);
            result.put("message", "Invalid email or password");
            return result;
        }

        String hashedInputPassword = PasswordUtil.hashPassword(password);
        if (!hashedInputPassword.equals(user.getPassword())) {
            result.put("success", false);
            result.put("message", "Invalid email or password");
            return result;
        }

        if (!user.isActive()) {
            result.put("success", false);
            result.put("message", "Account is disabled");
            return result;
        }

        String redirect;
        switch (user.getRoleId()) {
            case 1 -> redirect = "/player";
            case 2 -> redirect = "/staff";
            case 3 -> redirect = "/referee";
            case 4 -> redirect = "/tournamentLeader";
            case 5 -> redirect = "/admin";
            default -> redirect = "/";
        }

        result.put("success", true);
        result.put("user", user);
        result.put("roleId", user.getRoleId());
        result.put("redirect", redirect);

        return result;
    }
}

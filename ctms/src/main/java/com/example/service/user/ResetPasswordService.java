package com.example.service.user;

import com.example.DAO.UserDAO;
import com.example.util.PasswordUtil;
import java.util.HashMap;

public class ResetPasswordService {

    public HashMap<String, Object> resetPassword(
            String email, String password, String confirmPassword) {

        HashMap<String, Object> result = new HashMap<>();

        if (email == null || email.trim().isEmpty()) {
            result.put("success", false);
            result.put("message", "Email is required");
            return result;
        }

        if (password == null || password.length() < 6) {
            result.put("success", false);
            result.put("message", "Password must be at least 6 characters");
            return result;
        }

        if (!password.equals(confirmPassword)) {
            result.put("success", false);
            result.put("message", "Passwords do not match");
            return result;
        }

        UserDAO userDAO = new UserDAO();
        String hashedPassword = PasswordUtil.hashPassword(password);

        boolean updated = userDAO.updatePassword(email, hashedPassword);

        if (!updated) {
            result.put("success", false);
            result.put("message", "Reset password failed or user not found");
        } else {
            result.put("success", true);
            result.put("message", "Password reset successfully");
        }

        return result;
    }
}

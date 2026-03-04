package com.example.service.user;

import com.example.DAO.UserDAO;
import com.example.model.entity.User;
import com.example.model.entity.UserRole;
import com.example.util.PasswordUtil;

import java.util.HashMap;

public class LoginService {

    public HashMap<String, Object> login(String email, String password) {
        HashMap<String, Object> result = new HashMap<>();
        if (email == null || email.trim().isEmpty() ) {
            result.put("success", false);
            result.put("message", "Email is required");
            return result;
            }

        if (password == null || password.trim().isEmpty()) {
            result.put("success", false);
            result.put("message", "Password is required");
            return result;
        }
        UserDAO dao = new UserDAO();
        String hashedPassword = PasswordUtil.hashPassword(password);
        UserRole userRole = dao.findUserWithRole(email, hashedPassword);

        if (userRole == null) {
            result.put("success", false);
            result.put("message", "Invalid email or password");
            return result;
        }

        String roleName = userRole.getRoleName();
        String role = (roleName != null && !roleName.isBlank()) ? roleName.toUpperCase() : "PLAYER";

        // Lấy full User để đưa vào token/FE nếu cần thêm field
        User user = dao.getUserById(userRole.getUserId());
        if (user == null) {
            // fallback: map tối thiểu từ UserRole
            user = new User();
            user.setUserId(userRole.getUserId());
            user.setUsername(userRole.getUsername());
            user.setEmail(userRole.getEmail());
            user.setAvatar(userRole.getAvatar());
        }

        result.put("success", true);
        result.put("user", user);
        result.put("role", role);
        result.put("email", user.getEmail());

        return result;
    }

}

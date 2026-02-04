package com.example.controller.admin;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import com.example.DAO.UserDAO;
import com.example.model.User;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/api/admin/user-update/*")
public class AdminUpdateServlet extends HttpServlet {

    private final UserDAO userDAO = new UserDAO();
    private final Gson gson = new GsonBuilder()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX")
            .create();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String pathInfo = req.getPathInfo(); // "/12"
        Map<String, Object> out = new HashMap<>();

        try {
            if (pathInfo == null || pathInfo.isBlank() || "/".equals(pathInfo)) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.put("success", false);
                out.put("message", "Missing userId");
                resp.getWriter().print(gson.toJson(out));
                return;
            }

            String[] parts = pathInfo.split("/");
            if (parts.length < 2 || parts[1].isBlank()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.put("success", false);
                out.put("message", "Invalid userId");
                resp.getWriter().print(gson.toJson(out));
                return;
            }

            int userId = Integer.parseInt(parts[1]);

            // ===== Read body: JSON OR FORM =====
            String contentType = req.getContentType();
            Map body = null;
            if (contentType != null && contentType.toLowerCase().contains("application/json")) {
                body = gson.fromJson(req.getReader(), Map.class);
            }

            String username = readField(req, body, "username");
            String firstName = readField(req, body, "firstName");
            String lastName  = readField(req, body, "lastName");
            String address   = readField(req, body, "address");
            String phoneNumber = readField(req, body, "phoneNumber");
            String roleKey   = readField(req, body, "role");

            // birthday: "yyyy-MM-dd" hoặc "yyyy-MM-ddT...Z"
            java.util.Date birthday = null;
            String bdRaw = readField(req, body, "birthday");
            if (bdRaw != null && !bdRaw.isBlank()) {
                try {
                    String d = bdRaw.length() >= 10 ? bdRaw.substring(0, 10) : bdRaw;
                    birthday = java.sql.Date.valueOf(d);
                } catch (Exception ignore) {}
            }

            boolean ok1 = userDAO.updateUserAdminBasic(
                    userId, username, firstName, lastName, birthday, address, phoneNumber
            );

            boolean ok2 = true;
            if (roleKey != null && !roleKey.isBlank()) {
                ok2 = userDAO.updateUserRoleByKey(userId, roleKey);
            }

            // ===== Password (optional) =====
            String currentPassword = safeTrim(readField(req, body, "currentPassword"));
            String newPassword = safeTrim(readField(req, body, "newPassword"));
            String confirmNewPassword = safeTrim(readField(req, body, "confirmNewPassword"));

            boolean wantsPass = !newPassword.isEmpty() || !confirmNewPassword.isEmpty() || !currentPassword.isEmpty();
            boolean ok3 = true;

            if (wantsPass) {
                // basic validate
                if (newPassword.isEmpty() || confirmNewPassword.isEmpty()) {
                    throw new RuntimeException("Missing password fields");
                }
                if (!newPassword.equals(confirmNewPassword)) {
                    throw new RuntimeException("Confirm password not match");
                }

                // Lấy role + userId đang đăng nhập
                HttpSession session = req.getSession(false);
                String role = session == null ? null : (String) session.getAttribute("role");

                int sessionUserId = -1;
                if (session != null) {
                    Object uObj = session.getAttribute("user");
                    if (uObj instanceof User) {
                        sessionUserId = ((User) uObj).getUserId();
                    } else if (uObj != null) {
                        // fallback nếu bạn lưu kiểu khác
                        try { sessionUserId = Integer.parseInt(String.valueOf(uObj)); } catch (Exception ignore) {}
                    }
                }

                boolean isAdmin = role != null && role.equalsIgnoreCase("Admin");
                boolean changingOtherUser = sessionUserId > 0 && sessionUserId != userId;

                if (isAdmin && changingOtherUser) {
                    // ✅ Admin đổi pass cho user khác: set trực tiếp, KHÔNG cần current
                    userDAO.updatePassword(userId, newPassword);
                    ok3 = true;
                } else {
                    // ✅ user tự đổi pass: bắt buộc verify current
                    if (currentPassword.isEmpty()) {
                        throw new RuntimeException("Missing current password");
                    }
                    ok3 = userDAO.changePasswordWithVerify(userId, currentPassword, newPassword);
                    if (!ok3) throw new RuntimeException("Current password incorrect");
                }
            }

            if (!ok1) throw new RuntimeException("Update user basic failed");
            if (!ok2) throw new RuntimeException("Update role failed");
            if (!ok3) throw new RuntimeException("Update password failed");

            out.put("success", true);
            out.put("message", "Updated");
            resp.setStatus(HttpServletResponse.SC_OK);
            resp.getWriter().print(gson.toJson(out));

        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.put("success", false);
            out.put("message", e.getMessage());
            resp.getWriter().print(gson.toJson(out));
        }
    }

    private String readField(HttpServletRequest req, Map body, String key) {
        String v = req.getParameter(key); // form
        if (v != null) return v;

        if (body != null && body.get(key) != null) return String.valueOf(body.get(key)); // json
        return null;
    }

    private String safeTrim(String s) {
        return s == null ? "" : s.trim();
    }
}

package com.example.controller.user;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import com.example.DAO.UserDAO;
import com.example.model.entity.User;
import com.example.util.PasswordUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/api/change-password")
public class ChangePasswordServlet extends HttpServlet {

    private final UserDAO userDAO = new UserDAO();

    private static String str(Map<String, Object> m, String... keys) {
        if (m == null) return null;
        for (String k : keys) {
            Object v = m.get(k);
            if (v != null && v instanceof String) return (String) v;
            Object vSnake = m.get(k.replaceAll("([A-Z])", "_$1").toLowerCase().replaceFirst("^_", ""));
            if (vSnake != null && vSnake instanceof String) return (String) vSnake;
        }
        return null;
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json; charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            write(resp, HttpServletResponse.SC_UNAUTHORIZED, false, "Vui lòng đăng nhập.", null);
            return;
        }

        User user = (User) session.getAttribute("user");
        int userId = user.getUserId();

        Map<String, Object> res = new HashMap<>();

        try {
            String body = req.getReader().lines().collect(Collectors.joining("\n"));
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = (body == null || body.isBlank())
                    ? new HashMap<>()
                    : new com.google.gson.Gson().fromJson(body, Map.class);

            String oldPassword = str(payload, "oldPassword", "old_password");
            String newPassword = str(payload, "newPassword", "new_password");
            String confirmPassword = str(payload, "confirmPassword", "confirm_password");

            // 1. Mật khẩu cũ bắt buộc
            if (oldPassword == null || oldPassword.isBlank()) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Vui lòng nhập mật khẩu hiện tại.", null);
                return;
            }

            // 2. Mật khẩu mới bắt buộc, tối thiểu 6 ký tự
            if (newPassword == null || newPassword.isBlank()) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Vui lòng nhập mật khẩu mới.", null);
                return;
            }
            if (newPassword.length() < 6) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Mật khẩu mới phải có ít nhất 6 ký tự.", null);
                return;
            }

            // 3. Xác nhận mật khẩu phải khớp
            if (confirmPassword == null || !newPassword.equals(confirmPassword)) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Mật khẩu xác nhận không khớp.", null);
                return;
            }

            // 4. Mật khẩu mới không được trùng mật khẩu cũ
            if (oldPassword.equals(newPassword)) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Mật khẩu mới phải khác mật khẩu hiện tại.", null);
                return;
            }

            String hashedOld = PasswordUtil.hashPassword(oldPassword.trim());
            String hashedNew = PasswordUtil.hashPassword(newPassword.trim());

            boolean ok = userDAO.changePasswordWithVerify(userId, hashedOld, hashedNew);
            if (!ok) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Mật khẩu hiện tại không đúng.", null);
                return;
            }

            res.put("success", true);
            res.put("message", "Đổi mật khẩu thành công.");
            resp.setStatus(HttpServletResponse.SC_OK);
            resp.getWriter().write(new com.google.gson.Gson().toJson(res));

        } catch (com.google.gson.JsonSyntaxException e) {
            write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Dữ liệu không hợp lệ.", null);
        } catch (Exception e) {
            e.printStackTrace();
            write(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Lỗi hệ thống. Vui lòng thử lại.", null);
        }
    }

    private void write(HttpServletResponse resp, int status, boolean success, String message, Object data) throws IOException {
        resp.setStatus(status);
        Map<String, Object> json = new HashMap<>();
        json.put("success", success);
        json.put("message", message);
        if (data != null) json.put("data", data);
        resp.getWriter().write(new com.google.gson.Gson().toJson(json));
    }
}

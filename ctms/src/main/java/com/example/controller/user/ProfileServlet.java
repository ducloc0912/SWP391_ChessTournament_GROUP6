package com.example.controller.user;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import com.example.model.User;
import com.example.service.user.ProfileService;
import com.google.gson.Gson;

import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;

@WebServlet("/api/profile/*")
@MultipartConfig(
        fileSizeThreshold = 1024 * 1024, // 1MB
        maxFileSize = 5 * 1024 * 1024,   // 5MB
        maxRequestSize = 6 * 1024 * 1024 // 6MB
)
public class ProfileServlet extends HttpServlet {

    private final ProfileService profileService = new ProfileService();
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String path = req.getPathInfo();
        if (path == null) path = "";

        // Only support /me
        if (!"/me".equals(path)) {
            write(resp, HttpServletResponse.SC_NOT_FOUND, false, "Invalid endpoint", null);
            return;
        }

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            write(resp, HttpServletResponse.SC_UNAUTHORIZED, false, "Not logged in", null);
            return;
        }

        User user = (User) session.getAttribute("user");
        String role = (String) session.getAttribute("role"); // ensure login sets this

        try {
            Map<String, Object> result = profileService.getProfile(user.getUserId(), role);

            // If service already returns success/message/data
            boolean success = (boolean) result.getOrDefault("success", false);
            resp.setStatus(success ? HttpServletResponse.SC_OK : HttpServletResponse.SC_BAD_REQUEST);

            resp.getWriter().write(gson.toJson(result));
        } catch (Exception e) {
            e.printStackTrace();
            write(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Server error", null);
        }
    }
 @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String path = req.getPathInfo();
        if (path == null) path = "";

        if (!"/me".equals(path)) {
            write(resp, HttpServletResponse.SC_NOT_FOUND, false, "Invalid endpoint", null);
            return;
        }

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            write(resp, HttpServletResponse.SC_UNAUTHORIZED, false, "Not logged in", null);
            return;
        }

        User user = (User) session.getAttribute("user");
        String role = (String) session.getAttribute("role");

        try {
            String body = req.getReader().lines().collect(Collectors.joining("\n"));
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = body == null || body.isBlank()
                    ? new HashMap<>()
                    : gson.fromJson(body, Map.class);

            // nhận camelCase hoặc snake_case đều được
            String username = str(payload, "username");
            String firstName = str(payload, "firstName", "first_name");
            String lastName = str(payload, "lastName", "last_name");
            String phoneNumber = str(payload, "phoneNumber", "phone_number");
            String address = str(payload, "address");
            String avatar = str(payload, "avatar"); // FE mới sẽ không gửi nữa (avatar upload qua endpoint riêng)
            java.sql.Date birthday = toSqlDate(str(payload, "birthday")); // yyyy-MM-dd

            if (username != null && username.length() > 50) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "username too long", null);
                return;
            }

            if (firstName != null && firstName.length() > 50) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "firstName too long", null);
                return;
            }
            if (lastName != null && lastName.length() > 50) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "lastName too long", null);
                return;
            }
            if (phoneNumber != null && phoneNumber.length() > 20) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "phoneNumber too long", null);
                return;
            }
            if (address != null && address.length() > 255) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "address too long", null);
                return;
            }
            if (avatar != null && avatar.length() > 500) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "avatar too long", null);
                return;
            }

            Map<String, Object> result = profileService.updateProfile(
                    user.getUserId(),
                    role,
                    emptyToNull(username),
                    emptyToNull(firstName),
                    emptyToNull(lastName),
                    emptyToNull(phoneNumber),
                    emptyToNull(address),
                    birthday,
                    emptyToNull(avatar)
            );

            boolean success = (boolean) result.getOrDefault("success", false);
            resp.setStatus(success ? HttpServletResponse.SC_OK : HttpServletResponse.SC_BAD_REQUEST);

            // cập nhật session user để các page khác dùng user mới
            if (success) {
                if (username != null) user.setUsername(username);
                if (firstName != null) user.setFirstName(firstName);
                if (lastName != null) user.setLastName(lastName);
                if (phoneNumber != null) user.setPhoneNumber(phoneNumber);
                if (address != null) user.setAddress(address);
                if (avatar != null) user.setAvatar(avatar);
                if (birthday != null) user.setBirthday(birthday);
                session.setAttribute("user", user);
            }

            resp.getWriter().write(gson.toJson(result));

        } catch (IllegalArgumentException bad) {
            write(resp, HttpServletResponse.SC_BAD_REQUEST, false, bad.getMessage(), null);
        } catch (Exception e) {
            e.printStackTrace();
            write(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Server error", null);
        }
    }

    /**
     * Upload avatar (Facebook-style): multipart/form-data with field name "avatar".
     * Endpoint: POST /api/profile/me/avatar
     */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String path = req.getPathInfo();
        if (path == null) path = "";

        if (!"/me/avatar".equals(path)) {
            write(resp, HttpServletResponse.SC_NOT_FOUND, false, "Invalid endpoint", null);
            return;
        }

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            write(resp, HttpServletResponse.SC_UNAUTHORIZED, false, "Not logged in", null);
            return;
        }

        User user = (User) session.getAttribute("user");
        String role = (String) session.getAttribute("role");

        try {
            Part filePart = req.getPart("avatar");
            if (filePart == null || filePart.getSize() <= 0) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "No file uploaded", null);
                return;
            }

            String contentType = filePart.getContentType();
            if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Only image files are allowed", null);
                return;
            }

            // Choose extension from content type
            String ext = switch (contentType.toLowerCase()) {
                case "image/png" -> ".png";
                case "image/webp" -> ".webp";
                case "image/gif" -> ".gif";
                case "image/jpeg", "image/jpg" -> ".jpg";
                default -> ".img";
            };

            // Save under webapp: /uploads/avatars
            String uploadsDir = req.getServletContext().getRealPath("/uploads/avatars");
            if (uploadsDir == null) {
                // fallback: temp dir
                uploadsDir = System.getProperty("java.io.tmpdir") + File.separator + "ctms_uploads" + File.separator + "avatars";
            }

            File dir = new File(uploadsDir);
            if (!dir.exists() && !dir.mkdirs()) {
                write(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Cannot create upload directory", null);
                return;
            }

            String filename = "u" + user.getUserId() + "_" + System.currentTimeMillis() + "_" + UUID.randomUUID() + ext;
            Path target = Path.of(dir.getAbsolutePath(), filename);

            try (InputStream in = filePart.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }

            String publicUrl = req.getContextPath() + "/uploads/avatars/" + filename;

            Map<String, Object> result = profileService.updateAvatar(user.getUserId(), role, publicUrl);
            boolean success = (boolean) result.getOrDefault("success", false);
            resp.setStatus(success ? HttpServletResponse.SC_OK : HttpServletResponse.SC_BAD_REQUEST);

            if (success) {
                user.setAvatar(publicUrl);
                session.setAttribute("user", user);
            }

            resp.getWriter().write(gson.toJson(result));
        } catch (IllegalStateException tooLarge) {
            write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "File too large (max 5MB)", null);
        } catch (Exception e) {
            e.printStackTrace();
            write(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Server error", null);
        }
    }

    private String str(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object value = map.get(key);
            if (value != null) {
                return value.toString();
            }
        }
        return null;
    }

    private String emptyToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }  private java.sql.Date toSqlDate(String v) {
        if (v == null || v.isBlank()) return null;
        try {
            return java.sql.Date.valueOf(v.trim());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid birthday format. Use yyyy-MM-dd");
        }
    }
    private void write(HttpServletResponse resp, int status,
                       boolean success, String message, Object data) throws IOException {
        resp.setStatus(status);
        Map<String, Object> res = new HashMap<>();
        res.put("success", success);
        if (message != null) res.put("message", message);
        if (data != null) res.put("data", data);
        resp.getWriter().write(gson.toJson(res));
    }
}

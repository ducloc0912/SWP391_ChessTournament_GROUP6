package com.example.controller.admin;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import javax.imageio.ImageIO;

import com.example.DAO.UserDAO;
import com.example.model.User;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;

@WebServlet("/api/admin/user-update/*")
@MultipartConfig(
        fileSizeThreshold = 1024 * 1024,      // 1MB buffer
        maxFileSize = 10L * 1024 * 1024,      // 10MB
        maxRequestSize = 12L * 1024 * 1024    // 12MB (room for form fields)
)
public class AdminUpdateServlet extends HttpServlet {

    private static final long MAX_AVATAR_BYTES = 10L * 1024 * 1024;

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

            // ===== Detect content type =====
            String contentType = req.getContentType();
            boolean isJson = contentType != null && contentType.toLowerCase().contains("application/json");
            boolean isMultipart = contentType != null && contentType.toLowerCase().startsWith("multipart/");
            Map body = null;

            // JSON only: read body
            if (isJson) {
                body = gson.fromJson(req.getReader(), Map.class);
            }

            // ===== Read fields: JSON or FORM or MULTIPART =====
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

            // ===== Handle avatar (multipart only) =====
            boolean okAvatar = true;
            if (isMultipart) {
                Part avatarPart = safeGetPart(req, "avatar"); // FE field name must be "avatar"
                if (avatarPart != null && avatarPart.getSize() > 0) {
                    String avatarDataUri = validateAndConvertAvatarToDataUri(avatarPart);
                    // ✅ Bạn cần implement hàm này trong DAO
                    okAvatar = userDAO.updateUserAvatar(userId, avatarDataUri);
                    if (!okAvatar) throw new RuntimeException("Update avatar failed");
                }
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
                if (newPassword.isEmpty() || confirmNewPassword.isEmpty()) {
                    throw new RuntimeException("Missing password fields");
                }
                if (!newPassword.equals(confirmNewPassword)) {
                    throw new RuntimeException("Confirm password not match");
                }

                HttpSession session = req.getSession(false);
                String role = session == null ? null : (String) session.getAttribute("role");

                int sessionUserId = -1;
                if (session != null) {
                    Object uObj = session.getAttribute("user");
                    if (uObj instanceof User) {
                        sessionUserId = ((User) uObj).getUserId();
                    } else if (uObj != null) {
                        try { sessionUserId = Integer.parseInt(String.valueOf(uObj)); } catch (Exception ignore) {}
                    }
                }

                boolean isAdmin = role != null && role.equalsIgnoreCase("Admin");
                boolean changingOtherUser = sessionUserId > 0 && sessionUserId != userId;

                if (isAdmin && changingOtherUser) {
                    userDAO.updatePassword(userId, newPassword);
                    ok3 = true;
                } else {
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
        String v = req.getParameter(key); // form OR multipart text fields
        if (v != null) return v;

        if (body != null && body.get(key) != null) return String.valueOf(body.get(key)); // json
        return null;
    }

    private String safeTrim(String s) {
        return s == null ? "" : s.trim();
    }

    private Part safeGetPart(HttpServletRequest req, String name) {
        try {
            return req.getPart(name);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Validate jpg/png:
     * - <= 10MB
     * - magic bytes match
     * - ImageIO can decode (true image)
     * Return data URI: data:image/png;base64,...
     */
    private String validateAndConvertAvatarToDataUri(Part part) throws IOException, ServletException {
        long size = part.getSize();
        if (size <= 0) throw new RuntimeException("Avatar file is empty");
        if (size > MAX_AVATAR_BYTES) throw new RuntimeException("Avatar must be <= 10MB");

        byte[] bytes;
        try (InputStream is = part.getInputStream()) {
            bytes = is.readAllBytes();
        }

        String type = detectImageTypeByMagic(bytes);
        if (type == null) {
            throw new RuntimeException("Avatar must be JPG or PNG (invalid file signature)");
        }

        // must be decodable image
        BufferedImage img = ImageIO.read(new ByteArrayInputStream(bytes));
        if (img == null) {
            throw new RuntimeException("File is not a valid image");
        }

        // Optional: limit dimension if you want
        // if (img.getWidth() > 4000 || img.getHeight() > 4000) throw new RuntimeException("Image too large");

        String b64 = Base64.getEncoder().encodeToString(bytes);
        return "data:image/" + type + ";base64," + b64;
    }

    /**
     * Return "jpeg" or "png" if magic bytes match; else null.
     */
    private String detectImageTypeByMagic(byte[] b) {
        if (b == null || b.length < 12) return null;

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if ((b[0] & 0xFF) == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
            return "png";
        }

        // JPG/JPEG: FF D8 FF
        if ((b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "jpeg";
        }

        return null;
    }
}

package com.example.controller.user;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Phục vụ file avatar đã upload (GET /uploads/avatars/{filename}).
 * Đọc từ cùng thư mục mà ProfileServlet dùng để lưu.
 */
@WebServlet("/uploads/avatars/*")
public class AvatarFileServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.isEmpty() || pathInfo.equals("/")) {
            resp.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }
        String filename = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        if (filename.contains("..") || filename.contains("/")) {
            resp.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        String uploadsDir = req.getServletContext().getRealPath("/uploads/avatars");
        if (uploadsDir == null) {
            uploadsDir = System.getProperty("java.io.tmpdir") + File.separator + "ctms_uploads" + File.separator + "avatars";
        }
        Path file = Path.of(uploadsDir, filename);
        if (!Files.isRegularFile(file)) {
            resp.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        String contentType = getServletContext().getMimeType(filename);
        if (contentType == null) contentType = "image/jpeg";
        resp.setContentType(contentType);
        resp.setHeader("Cache-Control", "private, max-age=3600");
        Files.copy(file, resp.getOutputStream());
    }
}

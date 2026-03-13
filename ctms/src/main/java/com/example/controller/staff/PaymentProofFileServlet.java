package com.example.controller.staff;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@WebServlet("/uploads/payment-proofs/*")
public class PaymentProofFileServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.isBlank() || "/".equals(pathInfo)) {
            resp.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        String filename = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            resp.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        String projectDir = System.getProperty("user.dir");
        Path file = Path.of(projectDir, "uploads", "payment-proofs", filename).normalize();
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

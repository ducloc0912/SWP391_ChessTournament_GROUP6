package com.example.filter;

import com.example.model.User;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.util.Set;

@WebFilter("/api/*") // 🔥 CHỈ FILTER API
public class AuthFilter implements Filter {

    // ===== API PUBLIC (KHÔNG CẦN LOGIN) =====
    private static final Set<String> PUBLIC_APIS = Set.of(
            "/api/login",
            "/api/register",
            "/api/forgot-password",
            "/api/verify-otp",
            "/api/reset-password"
    );

    @Override
    public void doFilter(
            ServletRequest request,
            ServletResponse response,
            FilterChain chain
    ) throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        // ✅ LUÔN CHO OPTIONS ĐI QUA
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        String path = req.getRequestURI()
                         .replace(req.getContextPath(), "");

        // ===== PUBLIC API =====
        if (isPublicAPI(path)) {
            chain.doFilter(request, response);
            return;
        }

        // ===== CHECK LOGIN =====
        HttpSession session = req.getSession(false);
        User user = (session != null)
                ? (User) session.getAttribute("user")
                : null;

        if (user == null) {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json");
            res.getWriter().write("{\"message\":\"Unauthorized\"}");
            return;
        }

        int roleId = user.getRoleId();

        // ===== CHECK ROLE =====
        if (!hasPermission(path, roleId)) {
            res.setStatus(HttpServletResponse.SC_FORBIDDEN);
            res.setContentType("application/json");
            res.getWriter().write("{\"message\":\"Access denied\"}");
            return;
        }

        chain.doFilter(request, response);
    }

    // ================= HELPERS =================

    private boolean isPublicAPI(String path) {
        return PUBLIC_APIS.contains(path);
    }

    private boolean hasPermission(String path, int roleId) {

        // ===== PLAYER =====
        if (roleId == 1) {
            return path.startsWith("/api/profile")
                    || path.startsWith("/api/notifications")
                    || path.startsWith("/api/tournament/register")
                    || path.startsWith("/api/payment")
                    || path.startsWith("/api/support");
        }

        // ===== STAFF =====
        if (roleId == 2) {
            return path.startsWith("/api/support")
                    || path.startsWith("/api/blog");
        }

        // ===== REFEREE =====
        if (roleId == 3) {
            return path.startsWith("/api/match")
                    || path.startsWith("/api/check-in")
                    || path.startsWith("/api/report-violation")
                    || path.startsWith("/api/profile");
        }

        // ===== TOURNAMENT LEADER =====
        if (roleId == 4) {
            return path.startsWith("/api/tournament/manage")
                    || path.startsWith("/api/bracket")
                    || path.startsWith("/api/assign-referee")
                    || path.startsWith("/api/report");
        }

        // ===== ADMIN =====
        if (roleId == 5) {
            return true; // full quyền
        }

        return false;
    }
}

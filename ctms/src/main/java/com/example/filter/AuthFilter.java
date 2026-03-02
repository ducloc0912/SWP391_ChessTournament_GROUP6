package com.example.filter;

import java.io.IOException;
import java.util.Set;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebFilter("/api/*")
public class AuthFilter implements Filter {

    private static final Set<String> ALLOWED_ORIGINS = Set.of(
            "http://localhost:5173",
            "http://localhost:5175",
            "http://localhost:3000",
            "http://localhost:5174"
    );

    private static void addCorsHeaders(HttpServletRequest request, HttpServletResponse response) {
        String origin = request.getHeader("Origin");
        if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Vary", "Origin");
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        }
    }

    /** API không cần đăng nhập (khớp theo path sau context) */
    private static final Set<String> PUBLIC_PATHS = Set.of(
            "/api/login",
            "/api/register",
            "/api/forgot-password",
            "/api/reset-password",
            "/api/verify-otp",
            "/api/home"
    );

    private static boolean isPublicPath(String uri) {
        if (uri == null) return false;
        for (String p : PUBLIC_PATHS) {
            if (uri.equals(p) || uri.startsWith(p + "?")) return true;
        }
        return false;
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            addCorsHeaders(request, response);
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        String path = request.getRequestURI();
        int ctx = path.indexOf("/api");
        String apiPath = ctx >= 0 ? path.substring(ctx) : path;

        if (isPublicPath(apiPath)) {
            chain.doFilter(req, res);
            return;
        }

        if ("GET".equalsIgnoreCase(request.getMethod())
                && apiPath != null
                && apiPath.startsWith("/api/tournaments")) {
            chain.doFilter(req, res);
            return;
        }

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            addCorsHeaders(request, response);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"message\":\"not logged in\"}");
            return;
        }

        chain.doFilter(req, res);
    }
}
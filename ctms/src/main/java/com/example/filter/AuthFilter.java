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
            "/api/logout",
            "/api/forgot-password",
            "/api/reset-password",
            "/api/verify-otp",
            "/api/home",
            // Đăng ký tài khoản mới
            "/api/user/register",
            // Kết quả thanh toán VNPay (được FE gọi sau khi redirect)
            "/api/vnpay/vnpay-return"
    );

    private static boolean isPublicPath(String uri) {
        if (uri == null) return false;
        if (uri.startsWith("/api/public/")) return true;
        /* VNPay return: GET với query params, không có session khi user quay từ VNPay */
        if (uri.startsWith("/api/vnpay/vnpay-return")) return true;
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
            addCorsHeaders(request, response);
            chain.doFilter(req, res);
            return;
        }

        addCorsHeaders(request, response);
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"message\":\"not logged in\"}");
            return;
        }

        chain.doFilter(req, res);
    }
}
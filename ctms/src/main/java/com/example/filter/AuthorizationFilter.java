package com.example.filter;

import java.io.IOException;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

// Chặn tất cả request vào /admin/* và /staff/*
@WebFilter(urlPatterns = {"/admin/*", "/staff/*", "/api/admin/*"}) 
public class AuthorizationFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;
        HttpSession session = req.getSession(false);

        // 1. Check Login
        if (session == null || session.getAttribute("user") == null) {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
            res.getWriter().write("{\"message\": \"Unauthorized\"}");
            return;
        }

        // 2. Check Role (Lấy từ Session lúc Login)
        String role = (String) session.getAttribute("role");
        String path = req.getRequestURI();

        if (path.contains("/admin") && !"Admin".equalsIgnoreCase(role)) {
            res.setStatus(HttpServletResponse.SC_FORBIDDEN); // 403 Forbidden
            res.getWriter().write("{\"message\": \"Access Denied: Admins only\"}");
            return;
        }

        // Staff & Admin: full /staff/*. TournamentLeader: chỉ /api/staff/blogs (quản lý blog)
        if (path.contains("/staff")) {
            boolean staffOrAdmin = "Staff".equalsIgnoreCase(role) || "Admin".equalsIgnoreCase(role);
            boolean tlBlogs = path.contains("blogs") && "TOURNAMENTLEADER".equalsIgnoreCase(role);
            if (!staffOrAdmin && !tlBlogs) {
                res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                res.getWriter().write("{\"message\": \"Access Denied\"}");
                return;
            }
        }

        // Cho qua
        chain.doFilter(request, response);
    }
}
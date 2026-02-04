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

@WebFilter(urlPatterns = {
    "/admin/*",
    "/staff/*",
    "/player/*",
    "/referee/*",
    "/tournamentLeader/*"
    
})
public class AuthorizationFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");

        HttpSession session = req.getSession(false);

        if (session == null || session.getAttribute("role") == null) {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json");
            res.setCharacterEncoding("UTF-8");
            res.getWriter().write("{\"message\":\"Please login\"}");
            return;
}


       String role = ((String) session.getAttribute("role")).toUpperCase();

        String path = req.getRequestURI();
        String ctx = req.getContextPath();

        boolean allowed = switch (role) {
            case "ADMIN" -> path.startsWith(ctx + "/admin");
            case "STAFF" -> path.startsWith(ctx + "/staff");
            case "PLAYER" -> path.startsWith(ctx + "/player");
            case "REFEREE" -> path.startsWith(ctx + "/referee");
            case "TOURNAMENTLEADER" -> path.startsWith(ctx + "/tournamentLeader");
            default -> false;
        };

        if (!allowed) {
            res.setStatus(HttpServletResponse.SC_FORBIDDEN);
            res.getWriter().write("{\"message\":\"Access denied\"}");
            return;
        }

        chain.doFilter(request, response);
    }
}

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

// Áp dụng cho tất cả các đường dẫn bắt đầu bằng /api/
@WebFilter(urlPatterns = {"/api/*"}) 
public class CORSFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletResponse resp = (HttpServletResponse) response;
        HttpServletRequest req = (HttpServletRequest) request;

        // 1. Cho phép Frontend (React) gọi vào
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        
        // 2. Cho phép các method này
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        
        // 3. Cho phép các headers này (để gửi JSON, Token...)
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        
        // 4. Cho phép gửi cookie/session (nếu cần)
        resp.setHeader("Access-Control-Allow-Credentials", "true");

        // Xử lý pre-flight request (OPTIONS)
        // Khi React gửi request, trình duyệt sẽ gửi thử 1 cái OPTIONS trước để thăm dò
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            resp.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        // Cho phép request đi tiếp đến Servlet đích
        chain.doFilter(request, response);
    }
}
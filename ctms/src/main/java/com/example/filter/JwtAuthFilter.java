package com.example.filter;

import com.auth0.jwt.interfaces.DecodedJWT;
import com.example.DAO.UserDAO;
import com.example.model.entity.User;
import com.example.util.JwtUtil;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

/**
 * Đơn giản: nếu request có header Authorization: Bearer xxx và session chưa có "user"
 * thì verify token và gán user vào session. Nhờ đó các servlet hiện tại vẫn dùng được
 * HttpSession như trước.
 */
@WebFilter("/*")
public class JwtAuthFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpReq = (HttpServletRequest) request;
        HttpSession session = httpReq.getSession(false);

        // Nếu session đã có user thì bỏ qua
        if (session == null || session.getAttribute("user") == null) {
            String authHeader = httpReq.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring("Bearer ".length()).trim();
                try {
                    DecodedJWT jwt = JwtUtil.verifyToken(token);
                    int userId = jwt.getClaim("userId").asInt();
                    String role = jwt.getClaim("role").asString();

                    if (userId > 0) {
                        UserDAO userDAO = new UserDAO();
                        User user = userDAO.getUserById(userId);
                        if (user != null) {
                            HttpSession newSession = httpReq.getSession(true);
                            newSession.setAttribute("user", user);
                            newSession.setAttribute("role", role);
                        }
                    }
                } catch (Exception ignored) {
                    // Token không hợp lệ -> bỏ qua, để các servlet xử lý như user chưa đăng nhập
                }
            }
        }

        chain.doFilter(request, response);
    }
}


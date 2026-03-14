package com.example.controller.staff;

import com.example.model.entity.BlogPost;
import com.example.model.entity.User;
import com.example.service.staff.BlogPostStaffService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/staff/blogs")
public class StaffBlogController extends HttpServlet {
    private final BlogPostStaffService service = new BlogPostStaffService();
    private final Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd HH:mm:ss").create();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String action = req.getParameter("action");
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        HttpSession session = req.getSession(false);
        User currentUser = session != null && session.getAttribute("user") instanceof User
                ? (User) session.getAttribute("user")
                : null;
        String role = session != null ? (String) session.getAttribute("role") : null;
        boolean isTournamentLeader = role != null && "TOURNAMENTLEADER".equalsIgnoreCase(role);
        boolean isStaff = role != null && "STAFF".equalsIgnoreCase(role);
        Integer currentUserId = currentUser != null ? currentUser.getUserId() : null;

        if ("detail".equals(action)) {
            String idStr = req.getParameter("id");
            if (idStr != null) {
                int id = Integer.parseInt(idStr);
                BlogPost blog = service.getBlogPostById(id);
                if (blog == null) {
                    resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    return;
                }
                // Leader chỉ được xem bài của mình; Staff xem tất cả
                if (isTournamentLeader && currentUserId != null && !currentUserId.equals(blog.getAuthorId())) {
                    resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    resp.getWriter().write("{\"message\":\"Chỉ được xem bài do bạn viết.\"}");
                    return;
                }
                resp.getWriter().write(gson.toJson(blog));
            } else {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            }
        } else {
            // List: TournamentLeader → chỉ blog của mình; Staff + others → tất cả
            if (isTournamentLeader && currentUserId != null) {
                List<BlogPost> list = service.getBlogPostsByAuthor(currentUserId);
                resp.getWriter().write(gson.toJson(list));
            } else {
                List<BlogPost> list = service.getAllBlogPosts();
                resp.getWriter().write(gson.toJson(list));
            }
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String action = req.getParameter("action");
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Map<String, Object> responseMap = new HashMap<>();

        try {
            HttpSession session = req.getSession(false);
            User user = session != null && session.getAttribute("user") instanceof User
                    ? (User) session.getAttribute("user") : null;
            String role = session != null ? (String) session.getAttribute("role") : null;
            if (user == null) {
                resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                resp.getWriter().write("{\"success\":false,\"message\":\"Unauthorized\"}");
                return;
            }

            boolean isStaff = "STAFF".equalsIgnoreCase(role);
            boolean isLeader = "TOURNAMENTLEADER".equalsIgnoreCase(role);

            // Chỉ Staff và TournamentLeader mới được quản lý blog
            if (!isStaff && !isLeader) {
                resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
                resp.getWriter().write(
                        "{\"success\":false,\"message\":\"Forbidden: only Staff or TournamentLeader can manage blogs\"}");
                return;
            }

            if ("create".equals(action)) {
                BlogPost blog = gson.fromJson(req.getReader(), BlogPost.class);
                if (user.getUserId() != null) {
                    blog.setAuthorId(user.getUserId());
                }
                if (blog.getAuthorId() == null) {
                    responseMap.put("success", false);
                    responseMap.put("message", "Vui lòng đăng nhập để tạo bài viết.");
                } else {
                    boolean success = service.createBlogPost(blog);
                    responseMap.put("success", success);
                    if (!success)
                        responseMap.put("message", "Không thể tạo bài viết.");
                }

            } else if ("update".equals(action)) {
                BlogPost blog = gson.fromJson(req.getReader(), BlogPost.class);
                if (!canModifyBlog(req, blog.getBlogPostId(), responseMap)) {
                    resp.getWriter().write(gson.toJson(responseMap));
                    return;
                }
                boolean success = service.updateBlogPost(blog);
                responseMap.put("success", success);
                if (!success)
                    responseMap.put("message", "Không thể cập nhật bài viết.");

            } else if ("delete".equals(action)) {
                Map<String, Object> body = gson.fromJson(req.getReader(), Map.class);
                int id = ((Double) body.get("blogPostId")).intValue();
                if (!canModifyBlog(req, id, responseMap)) {
                    resp.getWriter().write(gson.toJson(responseMap));
                    return;
                }
                boolean success = service.deleteBlogPost(id);
                responseMap.put("success", success);

            } else if ("publish".equals(action)) {
                Map<String, Object> body = gson.fromJson(req.getReader(), Map.class);
                int id = ((Double) body.get("blogPostId")).intValue();
                if (!canModifyBlog(req, id, responseMap)) {
                    resp.getWriter().write(gson.toJson(responseMap));
                    return;
                }
                boolean success = service.publishBlogPost(id);
                responseMap.put("success", success);

            } else if ("hide".equals(action)) {
                Map<String, Object> body = gson.fromJson(req.getReader(), Map.class);
                int id = ((Double) body.get("blogPostId")).intValue();
                if (!canModifyBlog(req, id, responseMap)) {
                    resp.getWriter().write(gson.toJson(responseMap));
                    return;
                }
                boolean success = service.hideBlogPost(id);
                responseMap.put("success", success);

            } else {
                responseMap.put("success", false);
                responseMap.put("message", "Invalid action");
            }

        } catch (Exception e) {
            e.printStackTrace();
            responseMap.put("success", false);
            responseMap.put("message", e.getMessage());
        }

        resp.getWriter().write(gson.toJson(responseMap));
    }

    /**
     * Staff/Admin: được sửa/xóa mọi bài.
     * TournamentLeader: chỉ bài do mình viết.
     */
    private boolean canModifyBlog(HttpServletRequest req, int blogPostId, Map<String, Object> responseMap) {
        HttpSession session = req.getSession(false);
        if (session == null) {
            responseMap.put("success", false);
            responseMap.put("message", "Unauthorized");
            return false;
        }
        String role = (String) session.getAttribute("role");
        if ("STAFF".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role)) {
            return true;
        }
        if ("TOURNAMENTLEADER".equalsIgnoreCase(role) && session.getAttribute("user") instanceof User) {
            User user = (User) session.getAttribute("user");
            if (user.getUserId() == null) {
                responseMap.put("success", false);
                responseMap.put("message", "Unauthorized");
                return false;
            }
            BlogPost blog = service.getBlogPostById(blogPostId);
            if (blog == null) {
                responseMap.put("success", false);
                responseMap.put("message", "Bài viết không tồn tại.");
                return false;
            }
            if (!user.getUserId().equals(blog.getAuthorId())) {
                responseMap.put("success", false);
                responseMap.put("message", "Chỉ được sửa/xóa bài do bạn viết.");
                return false;
            }
            return true;
        }
        responseMap.put("success", false);
        responseMap.put("message", "Access Denied");
        return false;
    }
}

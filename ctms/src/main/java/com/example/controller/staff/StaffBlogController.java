package com.example.controller.staff;

import com.example.model.entity.BlogPost;
import com.example.model.entity.User;
import com.example.model.enums.BlogStatus;
import com.example.service.staff.BlogPostStaffService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/staff/blogs")
public class StaffBlogController extends HttpServlet {
    private final BlogPostStaffService service = new BlogPostStaffService();
    // Use default Gson for Timestamp/Date handling for now
    private final Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd HH:mm:ss").create();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String action = req.getParameter("action");
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        User user = (User) req.getSession().getAttribute("user");
        if (user == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"success\":false,\"message\":\"Unauthorized\"}");
            return;
        }

        if ("detail".equals(action)) {
            String idStr = req.getParameter("id");
            if (idStr != null) {
                int id = Integer.parseInt(idStr);
                BlogPost blog = service.getBlogPostById(id);
                if (blog != null && blog.getAuthorId().equals(user.getUserId())) {
                    resp.getWriter().write(gson.toJson(blog));
                } else {
                    resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
                }
            } else {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            }
        } else {
            // Default: list all for this author
            List<BlogPost> list = service.getBlogPostsByAuthor(user.getUserId());
            resp.getWriter().write(gson.toJson(list));
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String action = req.getParameter("action");
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Map<String, Object> responseMap = new HashMap<>();

        try {
            User user = (User) req.getSession().getAttribute("user");
            if (user == null) {
                resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                resp.getWriter().write("{\"success\":false,\"message\":\"Unauthorized\"}");
                return;
            }

            if ("create".equals(action)) {
                BlogPost blog = gson.fromJson(req.getReader(), BlogPost.class);
                blog.setAuthorId(user.getUserId());
                boolean success = service.createBlogPost(blog);
                responseMap.put("success", success);
            } else if ("update".equals(action)) {
                BlogPost blog = gson.fromJson(req.getReader(), BlogPost.class);
                blog.setAuthorId(user.getUserId()); // Ensure they don't change author
                boolean success = service.updateBlogPost(blog);
                responseMap.put("success", success);
            } else if ("delete".equals(action)) {
                Map<String, Object> body = gson.fromJson(req.getReader(), Map.class);
                int id = ((Double) body.get("blogPostId")).intValue();
                boolean success = service.deleteBlogPost(id);
                responseMap.put("success", success);
            } else if ("publish".equals(action)) {
                Map<String, Object> body = gson.fromJson(req.getReader(), Map.class);
                int id = ((Double) body.get("blogPostId")).intValue();
                boolean success = service.publishBlogPost(id);
                responseMap.put("success", success);
            } else if ("hide".equals(action)) {
                Map<String, Object> body = gson.fromJson(req.getReader(), Map.class);
                int id = ((Double) body.get("blogPostId")).intValue();
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
}

package com.example.controller.staff;

import com.example.DAO.BlogImageDAO;
import com.example.DAO.BlogPostDAO;
import com.example.model.entity.BlogPost;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

@WebServlet("/api/public/blogs")
public class PublicBlogController extends HttpServlet {

    private final BlogPostDAO blogPostDAO = new BlogPostDAO();
    private final BlogImageDAO blogImageDAO = new BlogImageDAO();
    private final Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd HH:mm:ss").create();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String action = req.getParameter("action");
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        try {
            if ("detail".equals(action)) {
                String idStr = req.getParameter("id");
                if (idStr != null) {
                    int id = Integer.parseInt(idStr);
                    blogPostDAO.incrementBlogViews(id);
                    BlogPost blog = blogPostDAO.getBlogPostById(id);
                    if (blog != null && blog.getStatus() != null && "Public".equalsIgnoreCase(blog.getStatus().name())) {
                        blog.setImages(blogImageDAO.getImagesByBlogPostId(id));
                        resp.getWriter().write(gson.toJson(blog));
                    } else {
                        resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        resp.getWriter().write("{\"success\":false,\"message\":\"Blog not found\"}");
                    }
                } else {
                    resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    resp.getWriter().write("{\"success\":false,\"message\":\"Missing id\"}");
                }
            } else {
                List<BlogPost> list = blogPostDAO.getPublicBlogPosts();
                resp.getWriter().write(gson.toJson(list));
            }
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"success\":false,\"message\":\"" + e.getMessage() + "\"}");
        }
    }
}


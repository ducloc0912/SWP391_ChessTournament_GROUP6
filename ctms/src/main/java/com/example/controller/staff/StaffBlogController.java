package com.example.controller.staff;

import java.io.IOException;
import java.util.List;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.example.model.BlogPost;
import com.example.service.BlogPostService;
import com.google.gson.FieldNamingPolicy;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

@WebServlet("/api/staff/blog-posts/*")
public class StaffBlogController extends HttpServlet {

    private final BlogPostService blogService = new BlogPostService();
    private final Gson gson = new GsonBuilder()
            .setFieldNamingPolicy(FieldNamingPolicy.LOWER_CASE_WITH_UNDERSCORES)
            .create();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        try {
            List<BlogPost> blogs = blogService.getAllBlogsForStaff();
            String json = gson.toJson(blogs);
            resp.getWriter().write(json);
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\": \"Unable to fetch blog posts\"}");
            e.printStackTrace();
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        try {
            BlogPost newBlog = gson.fromJson(req.getReader(), BlogPost.class);

            // Basic Validation
            if (newBlog.getTitle() == null || newBlog.getTitle().isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\": \"Title is required\"}");
                return;
            }

            // Defaults if missing
            if (newBlog.getStatus() == null)
                newBlog.setStatus("Draft");
            if (newBlog.getAuthorId() == 0)
                newBlog.setAuthorId(3); // MOCK ID, replace with Session ID later
            if (newBlog.getCategories() == null || newBlog.getCategories().isEmpty())
                newBlog.setCategories("Strategy"); // Default category

            boolean success = blogService.createBlogPost(newBlog);

            if (success) {
                resp.setStatus(HttpServletResponse.SC_CREATED);
                resp.getWriter().write("{\"message\": \"Blog created successfully\"}");
            } else {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                resp.getWriter().write("{\"error\": \"Failed to create blog\"}");
            }

        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            e.printStackTrace();
        }
    }
  @Override
protected void doPut(HttpServletRequest req, HttpServletResponse resp)
        throws ServletException, IOException {

    BlogPost blog = gson.fromJson(req.getReader(), BlogPost.class);

    if (blog.getBlogPostId() == 0) {
        resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        resp.getWriter().write("{\"error\":\"Missing blog_post_id\"}");
        return;
    }

    boolean success = blogService.updateBlogPost(blog);

    if (success) {
        resp.getWriter().write("{\"message\":\"Updated\"}");
    } else {
        resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        resp.getWriter().write("{\"error\":\"Update failed\"}");
    }
}

}


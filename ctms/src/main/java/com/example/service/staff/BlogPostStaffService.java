package com.example.service.staff;

import com.example.DAO.BlogPostDAO;
import com.example.model.entity.BlogPost;
import com.example.model.enums.BlogStatus;

import java.util.List;

public class BlogPostStaffService {
    private final BlogPostDAO blogPostDAO = new BlogPostDAO();

    // =========================
    // BLOG MANAGEMENT
    // =========================

    public List<BlogPost> getAllBlogPosts() {
        return blogPostDAO.getAllBlogPosts();
    }

    public BlogPost getBlogPostById(int id) {
        return blogPostDAO.getBlogPostById(id);
    }

    public boolean createBlogPost(BlogPost blog) {
        return blogPostDAO.createBlogPost(blog);
    }

    public boolean updateBlogPost(BlogPost blog) {
        return blogPostDAO.updateBlogPost(blog);
    }

    public boolean deleteBlogPost(int id) {
        return blogPostDAO.deleteBlogPost(id);
    }

    public boolean publishBlogPost(int id) {
        return blogPostDAO.updateBlogPostStatus(id, BlogStatus.Public);
    }

    public boolean hideBlogPost(int id) {
        return blogPostDAO.updateBlogPostStatus(id, BlogStatus.Private);
    }
}

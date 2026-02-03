package com.example.service;

import java.util.List;
import com.example.DAO.BlogPostDAO;
import com.example.model.BlogPost;

public class BlogPostService {
    private BlogPostDAO blogPostDAO = new BlogPostDAO();

    public List<BlogPost> getAllBlogsForStaff() {
        return blogPostDAO.getAllBlogsForStaff();
    }

    public boolean createBlogPost(BlogPost blog) {
        return blogPostDAO.createBlogPost(blog);
    }

    public boolean updateBlogPost(BlogPost blog) {
    return blogPostDAO.updateBlogPost(blog);
}
}

package com.example.service.staff;

import com.example.DAO.BlogPostDAO;
import com.example.DAO.BlogImageDAO;
import com.example.model.entity.BlogPost;
import com.example.model.entity.BlogImage;
import com.example.model.enums.BlogStatus;

import java.util.List;

public class BlogPostStaffService {
    private final BlogPostDAO blogPostDAO = new BlogPostDAO();
    private final BlogImageDAO blogImageDAO = new BlogImageDAO();

    // =========================
    // BLOG MANAGEMENT
    // =========================

    public List<BlogPost> getAllBlogPosts() {
        return blogPostDAO.getAllBlogPosts();
    }

    public List<BlogPost> getBlogPostsByAuthor(int authorId) {
        return blogPostDAO.getBlogPostsByAuthor(authorId);
    }

    public BlogPost getBlogPostById(int id) {
        BlogPost blog = blogPostDAO.getBlogPostById(id);
        if (blog != null) {
            blog.setImages(blogImageDAO.getImagesByBlogPostId(id));
        }
        return blog;
    }

    public boolean createBlogPost(BlogPost blog) {
        int newId = blogPostDAO.createBlogPost(blog);
        if (newId > 0) {
            if (blog.getImages() != null) {
                for (BlogImage img : blog.getImages()) {
                    img.setBlogPostId(newId);
                    blogImageDAO.createBlogImage(img);
                }
            }
            return true;
        }
        return false;
    }

    public boolean updateBlogPost(BlogPost blog) {
        boolean updated = blogPostDAO.updateBlogPost(blog);
        if (updated) {
            blogImageDAO.deleteImagesByBlogPostId(blog.getBlogPostId());
            if (blog.getImages() != null) {
                for (BlogImage img : blog.getImages()) {
                    img.setBlogPostId(blog.getBlogPostId());
                    blogImageDAO.createBlogImage(img);
                }
            }
        }
        return updated;
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

package com.example.service.staff;

import com.example.DAO.BlogImageDAO;
import com.example.DAO.BlogPostDAO;
import com.example.model.entity.BlogImage;
import com.example.model.entity.BlogPost;
import com.example.model.enums.BlogStatus;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class BlogPostStaffService {
    private final BlogPostDAO blogPostDAO = new BlogPostDAO();
    private final BlogImageDAO blogImageDAO = new BlogImageDAO();
    private static final Gson gson = new Gson();
    private static final Type LIST_MAP_TYPE = new TypeToken<ArrayList<Map<String, Object>>>() {}.getType();

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
        return blogPostDAO.getBlogPostById(id);
    }

    public boolean createBlogPost(BlogPost blog) {
        Integer newId = blogPostDAO.createBlogPostReturningId(blog);
        if (newId == null) return false;
        saveContentImagesToBlogImage(newId, blog.getContent());
        return true;
    }

    public boolean updateBlogPost(BlogPost blog) {
        if (!blogPostDAO.updateBlogPost(blog)) return false;
        if (blog.getBlogPostId() != null) {
            blogImageDAO.deleteImagesByBlogPostId(blog.getBlogPostId());
            saveContentImagesToBlogImage(blog.getBlogPostId(), blog.getContent());
        }
        return true;
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

    /** Parse content JSON (array of { type, value }) and save each image block to Blog_Image. */
    private void saveContentImagesToBlogImage(int blogPostId, String content) {
        if (content == null || content.isBlank()) return;
        try {
            List<Map<String, Object>> blocks = gson.fromJson(content, LIST_MAP_TYPE);
            if (blocks == null) return;
            int sortOrder = 0;
            for (Map<String, Object> block : blocks) {
                Object type = block.get("type");
                if (!"image".equals(type)) continue;
                Object val = block.get("value");
                if (val == null || val.toString().isBlank()) continue;
                BlogImage img = new BlogImage();
                img.setBlogPostId(blogPostId);
                img.setImageUrl(val.toString());
                img.setCaption(null);
                img.setSortOrder(sortOrder++);
                blogImageDAO.createBlogImage(img);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

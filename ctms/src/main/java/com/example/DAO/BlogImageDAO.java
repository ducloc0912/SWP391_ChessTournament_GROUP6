package com.example.DAO;

import com.example.model.entity.BlogImage;
import com.example.util.DBContext;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class BlogImageDAO extends DBContext {

    public List<BlogImage> getImagesByBlogPostId(int blogPostId) {
        List<BlogImage> list = new ArrayList<>();
        String sql = "SELECT * FROM Blog_Image WHERE blog_post_id = ? ORDER BY sort_order ASC, create_at ASC";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, blogPostId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new BlogImage(
                            rs.getInt("image_id"),
                            rs.getInt("blog_post_id"),
                            rs.getString("image_url"),
                            rs.getString("caption"),
                            rs.getInt("sort_order"),
                            rs.getTimestamp("create_at")));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public boolean createBlogImage(BlogImage image) {
        String sql = "INSERT INTO Blog_Image (blog_post_id, image_url, caption, sort_order, create_at) VALUES (?, ?, ?, ?, GETDATE())";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, image.getBlogPostId());
            ps.setString(2, image.getImageUrl());
            ps.setString(3, image.getCaption());
            ps.setInt(4, image.getSortOrder() != null ? image.getSortOrder() : 0);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean deleteImagesByBlogPostId(int blogPostId) {
        String sql = "DELETE FROM Blog_Image WHERE blog_post_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, blogPostId);
            return ps.executeUpdate() >= 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
}


package com.example.DAO;

import com.example.model.entity.BlogPost;
import com.example.model.enums.BlogCategory;
import com.example.model.enums.BlogStatus;
import com.example.util.DBContext;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class BlogPostDAO extends DBContext {

    // =========================================================================
    // READ OPERATIONS
    // =========================================================================

    public List<BlogPost> getAllBlogPosts() {
        List<BlogPost> list = new ArrayList<>();
        String sql = "SELECT * FROM Blog_Post ORDER BY create_at DESC";
        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapResultSetToBlogPost(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public BlogPost getBlogPostById(int id) {
        String sql = "SELECT * FROM Blog_Post WHERE blog_post_id = ?";
        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapResultSetToBlogPost(rs);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public List<BlogPost> getBlogPostsByAuthor(int authorId) {
        List<BlogPost> list = new ArrayList<>();
        String sql = "SELECT * FROM Blog_Post WHERE author_id = ? ORDER BY create_at DESC";
        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, authorId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToBlogPost(rs));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<BlogPost> getPublicBlogPosts() {
        List<BlogPost> list = new ArrayList<>();
        String sql = "SELECT * FROM Blog_Post WHERE status = 'Public' ORDER BY publish_at DESC, create_at DESC";
        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapResultSetToBlogPost(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // =========================================================================
    // CREATE OPERATION
    // =========================================================================

    public int createBlogPost(BlogPost blog) {
        String sql = """
                    INSERT INTO Blog_Post (title, summary, content, thumbnail_url, author_id, categories, status, views, publish_at, create_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())
                """;
        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, blog.getTitle());
            ps.setString(2, blog.getSummary());
            ps.setString(3, blog.getContent());
            ps.setString(4, blog.getThumbnailUrl());
            ps.setInt(5, blog.getAuthorId());
            ps.setString(6, blog.getCategories() != null ? blog.getCategories().name() : null);
            ps.setString(7, blog.getStatus() != null ? blog.getStatus().name() : "Draft"); // Default usually Draft
            ps.setInt(8, blog.getViews() != null ? blog.getViews() : 0);
            if (blog.getPublishAt() != null) {
                ps.setTimestamp(9, blog.getPublishAt());
            } else {
                ps.setNull(9, java.sql.Types.TIMESTAMP);
            }
            if (ps.executeUpdate() > 0) {
                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) {
                        return rs.getInt(1);
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Database error: " + e.getMessage(), e);
        }
        return -1;
    }

    // =========================================================================
    // UPDATE OPERATION
    // =========================================================================

    public boolean updateBlogPost(BlogPost blog) {
        String sql = """
                    UPDATE Blog_Post SET title = ?, summary = ?, content = ?, thumbnail_url = ?, categories = ?, status = ?, publish_at = ?, update_at = GETDATE()
                    WHERE blog_post_id = ?
                """;
        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, blog.getTitle());
            ps.setString(2, blog.getSummary());
            ps.setString(3, blog.getContent());
            ps.setString(4, blog.getThumbnailUrl());
            ps.setString(5, blog.getCategories() != null ? blog.getCategories().name() : null);
            ps.setString(6, blog.getStatus() != null ? blog.getStatus().name() : "Draft");
            if (blog.getPublishAt() != null) {
                ps.setTimestamp(7, blog.getPublishAt());
            } else {
                ps.setNull(7, java.sql.Types.TIMESTAMP);
            }
            ps.setInt(8, blog.getBlogPostId());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Database error: " + e.getMessage(), e);
        }
    }

    public boolean updateBlogPostStatus(int blogId, BlogStatus status) {
        String sql = "UPDATE Blog_Post SET status = ?, update_at = GETDATE() WHERE blog_post_id = ?";
        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status.name());
            ps.setInt(2, blogId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean incrementBlogViews(int blogId) {
        String sql = "UPDATE Blog_Post SET views = isnull(views, 0) + 1 WHERE blog_post_id = ?";
        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, blogId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // =========================================================================
    // DELETE OPERATION
    // =========================================================================

    public boolean deleteBlogPost(int id) {
        String sql = "DELETE FROM Blog_Post WHERE blog_post_id = ?";
        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // =========================================================================
    // MAPPER
    // =========================================================================

    private BlogPost mapResultSetToBlogPost(ResultSet rs) throws SQLException {
        BlogPost b = new BlogPost();
        b.setBlogPostId(rs.getInt("blog_post_id"));
        b.setTitle(rs.getString("title"));
        b.setSummary(rs.getString("summary"));
        b.setContent(rs.getString("content"));
        b.setThumbnailUrl(rs.getString("thumbnail_url"));
        b.setAuthorId(rs.getInt("author_id"));
        b.setCategories(parseCategory(rs.getString("categories")));
        b.setStatus(parseStatus(rs.getString("status")));
        b.setViews(rs.getInt("views"));
        b.setPublishAt(rs.getTimestamp("publish_at"));
        b.setCreateAt(rs.getTimestamp("create_at"));
        b.setUpdateAt(rs.getTimestamp("update_at"));
        return b;
    }

    // =========================================================================
    // HELPER METHODS - Case-insensitive enum parsing
    // =========================================================================

    private BlogCategory parseCategory(String value) {
        if (value == null)
            return null;
        for (BlogCategory category : BlogCategory.values()) {
            if (category.name().equalsIgnoreCase(value)) {
                return category;
            }
        }
        return BlogCategory.valueOf(value); // fallback
    }

    private BlogStatus parseStatus(String value) {
        if (value == null)
            return null;
        for (BlogStatus status : BlogStatus.values()) {
            if (status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }
        return BlogStatus.valueOf(value); // fallback
    }
}

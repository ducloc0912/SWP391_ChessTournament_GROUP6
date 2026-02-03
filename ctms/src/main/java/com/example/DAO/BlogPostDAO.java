package com.example.DAO;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

import com.example.model.BlogPost;
import com.example.util.DBContext;

public class BlogPostDAO {
    public List<BlogPost> getAllBlogsForStaff() {
        List<BlogPost> list = new ArrayList<>();
        String sql = """
                    SELECT b.*, u.first_name + ' ' + u.last_name AS author_name
                    FROM Blog_Post b
                    JOIN Users u ON b.author_id = u.user_id
                    ORDER BY b.create_at DESC
                """;

        try (Connection con = DBContext.getConnection();
                PreparedStatement ps = con.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                BlogPost b = new BlogPost();
                b.setBlogPostId(rs.getInt("blog_post_id"));
                b.setTitle(rs.getString("title"));
                b.setSlug(rs.getString("slug"));
                b.setSummary(rs.getString("summary"));
                b.setContent(rs.getString("content"));
                b.setThumbnailUrl(rs.getString("thumbnail_url"));
                b.setAuthorId(rs.getInt("author_id"));
                b.setCategories(rs.getString("categories")); // String now
                b.setStatus(rs.getString("status"));
                b.setViews(rs.getInt("views"));
               b.setCreateAt(rs.getTimestamp("create_at"));

                list.add(b);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public void updateStatus(int id, String status) {
        String sql = "UPDATE Blog_Post SET status = ? WHERE blog_post_id = ?";
        try (Connection con = DBContext.getConnection();
                PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, status);
            ps.setInt(2, id);
            ps.executeUpdate();
        } catch (Exception e) {
            e.printStackTrace();

        }
    }

    public boolean createBlogPost(BlogPost b) {
        String sql = "INSERT INTO Blog_Post (blog_post_id, title, slug, summary, content, thumbnail_url, author_id, categories, status, views, create_at) "
                +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())";
        try (Connection con = DBContext.getConnection();
                PreparedStatement ps = con.prepareStatement(sql)) {

            // Assume database doesn't auto-increment ID based on user schema provided
            // (INSERT INTO includes ID)
            // We need to generate a random or sequential ID if not provided, or let DB
            // handle IDENTITY if user forgot
            // User schema shows: blog_post_id int primary key (no IDENTITY)
            // So we must generate one. For now using a Random int or hash.
            int newId = (int) (System.currentTimeMillis() % Integer.MAX_VALUE);

            ps.setInt(1, newId);
            ps.setString(2, b.getTitle());
            ps.setString(3, b.getSlug());
            ps.setString(4, b.getSummary());
            ps.setString(5, b.getContent());
            ps.setString(6, b.getThumbnailUrl());
            ps.setInt(7, b.getAuthorId());
            ps.setString(8, b.getCategories());
            ps.setString(9, b.getStatus());
            ps.setInt(10, 0);

            int rowsAffected = ps.executeUpdate();
            return rowsAffected > 0;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateBlogPost(BlogPost b) {
    String sql = """
            UPDATE Blog_Post 
            SET title = ?, slug = ?, summary = ?, content = ?, 
                thumbnail_url = ?, categories = ?, status = ?
            WHERE blog_post_id = ?
            """;
    try (Connection con = DBContext.getConnection();
         PreparedStatement ps = con.prepareStatement(sql)) {

        ps.setString(1, b.getTitle());
        ps.setString(2, b.getSlug());
        ps.setString(3, b.getSummary());
        ps.setString(4, b.getContent());
        ps.setString(5, b.getThumbnailUrl());
        ps.setString(6, b.getCategories());
        ps.setString(7, b.getStatus());
        ps.setInt(8, b.getBlogPostId());

        return ps.executeUpdate() > 0;
    } catch (Exception e) {
        e.printStackTrace();
    }
    return false;
}
}

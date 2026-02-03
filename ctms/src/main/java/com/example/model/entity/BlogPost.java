package com.example.model.entity;
import com.example.model.enums.BlogCategory;
import com.example.model.enums.BlogStatus;
import java.sql.Timestamp;
public class BlogPost {
    private Integer blogPostId;
    private String title;
    private String summary;
    private String content;
    private String thumbnailUrl;
    private Integer authorId;
    private BlogCategory categories;
    private BlogStatus status;
    private Integer views;
    private Timestamp publishAt;
    private Timestamp createAt;
    private Timestamp updateAt;

    public BlogPost() {}

    public BlogPost(Integer blogPostId, String title, String summary, String content, String thumbnailUrl,
                    Integer authorId, BlogCategory categories, BlogStatus status, Integer views,
                    Timestamp publishAt, Timestamp createAt, Timestamp updateAt) {
        this.blogPostId = blogPostId;
        this.title = title;
        this.summary = summary;
        this.content = content;
        this.thumbnailUrl = thumbnailUrl;
        this.authorId = authorId;
        this.categories = categories;
        this.status = status;
        this.views = views;
        this.publishAt = publishAt;
        this.createAt = createAt;
        this.updateAt = updateAt;
    }
}
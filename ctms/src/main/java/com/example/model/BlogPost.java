package com.example.model;

import java.sql.Timestamp;

public class BlogPost {
    private int blogPostId;
    private String title;
    private String slug;
    private String summary;
    private String content;
    private String thumbnailUrl;
    private int authorId;
    private String categories;
    private String status;
    private int views;
    private Timestamp publishAt;
    private Timestamp createAt;
    private Timestamp updateAt;

    public BlogPost() {
    }

    public BlogPost(int blogPostId, String title, String slug, String summary, String content, String thumbnailUrl,
            int authorId, String categories, String status, int views, Timestamp publishAt, Timestamp createAt,
            Timestamp updateAt) {
        this.blogPostId = blogPostId;
        this.title = title;
        this.slug = slug;
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

    public int getBlogPostId() {
        return blogPostId;
    }

    public void setBlogPostId(int blogPostId) {
        this.blogPostId = blogPostId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public int getAuthorId() {
        return authorId;
    }

    public void setAuthorId(int authorId) {
        this.authorId = authorId;
    }

    public String getCategories() {
        return categories;
    }

    public void setCategories(String categories) {
        this.categories = categories;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getViews() {
        return views;
    }

    public void setViews(int views) {
        this.views = views;
    }

    public Timestamp getPublishAt() {
        return publishAt;
    }

    public void setPublishAt(Timestamp publishAt) {
        this.publishAt = publishAt;
    }

    public Timestamp getCreateAt() {
        return createAt;
    }

    public void setCreateAt(Timestamp createAt) {
        this.createAt = createAt;
    }

    public Timestamp getUpdateAt() {
        return updateAt;
    }

    public void setUpdateAt(Timestamp updateAt) {
        this.updateAt = updateAt;
    }

}

package com.example.model.entity;

import com.example.model.enums.BlogCategory;
import com.example.model.enums.BlogStatus;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

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
    private List<BlogImage> images = new ArrayList<>();

    public BlogPost() {
    }

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

    public Integer getBlogPostId() {
        return blogPostId;
    }

    public void setBlogPostId(Integer blogPostId) {
        this.blogPostId = blogPostId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public Integer getAuthorId() {
        return authorId;
    }

    public void setAuthorId(Integer authorId) {
        this.authorId = authorId;
    }

    public BlogCategory getCategories() {
        return categories;
    }

    public void setCategories(BlogCategory categories) {
        this.categories = categories;
    }

    public BlogStatus getStatus() {
        return status;
    }

    public void setStatus(BlogStatus status) {
        this.status = status;
    }

    public Integer getViews() {
        return views;
    }

    public void setViews(Integer views) {
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

    public List<BlogImage> getImages() {
        return images;
    }

    public void setImages(List<BlogImage> images) {
        this.images = images;
    }
}
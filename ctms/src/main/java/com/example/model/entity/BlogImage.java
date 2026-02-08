package com.example.model.entity;

import java.sql.Timestamp;

public class BlogImage {
    private Integer imageId;
    private Integer blogPostId;
    private String imageUrl;
    private String caption;
    private Integer sortOrder;
    private Timestamp createAt;

    public BlogImage() {}

    public BlogImage(Integer imageId, Integer blogPostId, String imageUrl,
                     String caption, Integer sortOrder, Timestamp createAt) {
        this.imageId = imageId;
        this.blogPostId = blogPostId;
        this.imageUrl = imageUrl;
        this.caption = caption;
        this.sortOrder = sortOrder;
        this.createAt = createAt;
    }

    public Integer getImageId() { return imageId; }
    public void setImageId(Integer imageId) { this.imageId = imageId; }

    public Integer getBlogPostId() { return blogPostId; }
    public void setBlogPostId(Integer blogPostId) { this.blogPostId = blogPostId; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public Timestamp getCreateAt() { return createAt; }
    public void setCreateAt(Timestamp createAt) { this.createAt = createAt; }
}

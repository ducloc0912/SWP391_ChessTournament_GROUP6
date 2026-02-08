package com.example.model.entity;

import java.sql.Timestamp;

public class UserAvatarFrame {
    private Integer id;
    private Integer userId;
    private Integer frameId;
    private Boolean isEquipped;
    private Timestamp obtainedAt;
    private String obtainedBy;      // Reward, Purchase, Event, Default

    public UserAvatarFrame() {}

    public UserAvatarFrame(Integer id, Integer userId, Integer frameId,
                           Boolean isEquipped, Timestamp obtainedAt, String obtainedBy) {
        this.id = id;
        this.userId = userId;
        this.frameId = frameId;
        this.isEquipped = isEquipped;
        this.obtainedAt = obtainedAt;
        this.obtainedBy = obtainedBy;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getFrameId() { return frameId; }
    public void setFrameId(Integer frameId) { this.frameId = frameId; }

    public Boolean getIsEquipped() { return isEquipped; }
    public void setIsEquipped(Boolean isEquipped) { this.isEquipped = isEquipped; }

    public Timestamp getObtainedAt() { return obtainedAt; }
    public void setObtainedAt(Timestamp obtainedAt) { this.obtainedAt = obtainedAt; }

    public String getObtainedBy() { return obtainedBy; }
    public void setObtainedBy(String obtainedBy) { this.obtainedBy = obtainedBy; }
}

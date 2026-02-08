package com.example.model.entity;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class AvatarFrame {
    private Integer frameId;
    private String frameName;
    private String frameUrl;
    private String description;
    private String rarity;          // Common, Rare, Epic, Legendary
    private String unlockCondition;
    private BigDecimal price;
    private Boolean isActive;
    private Timestamp createAt;

    public AvatarFrame() {}

    public AvatarFrame(Integer frameId, String frameName, String frameUrl, String description,
                       String rarity, String unlockCondition, BigDecimal price,
                       Boolean isActive, Timestamp createAt) {
        this.frameId = frameId;
        this.frameName = frameName;
        this.frameUrl = frameUrl;
        this.description = description;
        this.rarity = rarity;
        this.unlockCondition = unlockCondition;
        this.price = price;
        this.isActive = isActive;
        this.createAt = createAt;
    }

    public Integer getFrameId() { return frameId; }
    public void setFrameId(Integer frameId) { this.frameId = frameId; }

    public String getFrameName() { return frameName; }
    public void setFrameName(String frameName) { this.frameName = frameName; }

    public String getFrameUrl() { return frameUrl; }
    public void setFrameUrl(String frameUrl) { this.frameUrl = frameUrl; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getRarity() { return rarity; }
    public void setRarity(String rarity) { this.rarity = rarity; }

    public String getUnlockCondition() { return unlockCondition; }
    public void setUnlockCondition(String unlockCondition) { this.unlockCondition = unlockCondition; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Timestamp getCreateAt() { return createAt; }
    public void setCreateAt(Timestamp createAt) { this.createAt = createAt; }
}

package com.example.model.entity;

public class ChessTitle {
    private Integer titleId;
    private String titleCode;       // GM, IM, FM, CM, NM, WGM, WIM, WFM, WCM, None
    private String titleName;       // Grandmaster, International Master, ...
    private Integer minElo;
    private String iconUrl;
    private Integer sortOrder;

    public ChessTitle() {}

    public ChessTitle(Integer titleId, String titleCode, String titleName,
                      Integer minElo, String iconUrl, Integer sortOrder) {
        this.titleId = titleId;
        this.titleCode = titleCode;
        this.titleName = titleName;
        this.minElo = minElo;
        this.iconUrl = iconUrl;
        this.sortOrder = sortOrder;
    }

    public Integer getTitleId() { return titleId; }
    public void setTitleId(Integer titleId) { this.titleId = titleId; }

    public String getTitleCode() { return titleCode; }
    public void setTitleCode(String titleCode) { this.titleCode = titleCode; }

    public String getTitleName() { return titleName; }
    public void setTitleName(String titleName) { this.titleName = titleName; }

    public Integer getMinElo() { return minElo; }
    public void setMinElo(Integer minElo) { this.minElo = minElo; }

    public String getIconUrl() { return iconUrl; }
    public void setIconUrl(String iconUrl) { this.iconUrl = iconUrl; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}

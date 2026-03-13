package com.example.model.entity;

/**
 * Entity cho Tournament_Group - bảng trong Group Stage (Hybrid Round Robin).
 */
public class TournamentGroup {
    private Integer groupId;
    private Integer tournamentId;
    private Integer bracketId;
    private String name;
    private Integer sortOrder;
    private Integer maxPlayers;

    public Integer getGroupId() { return groupId; }
    public void setGroupId(Integer groupId) { this.groupId = groupId; }
    public Integer getTournamentId() { return tournamentId; }
    public void setTournamentId(Integer tournamentId) { this.tournamentId = tournamentId; }
    public Integer getBracketId() { return bracketId; }
    public void setBracketId(Integer bracketId) { this.bracketId = bracketId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public Integer getMaxPlayers() { return maxPlayers; }
    public void setMaxPlayers(Integer maxPlayers) { this.maxPlayers = maxPlayers; }
}

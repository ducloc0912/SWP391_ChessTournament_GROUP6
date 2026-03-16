package com.example.model.dto;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.List;

/**
 * DTO for tournament (String format/status, Timestamp dates).
 * Used by TournamentDAO, TournamentService, TournamentController.
 */
public class TournamentDTO {
    private Integer tournamentId;
    private String tournamentName;
    private String description;
    private String tournamentImage;
    private String rules;
    private String location;
    private String format;
    private Integer maxPlayer;
    private Integer minPlayer;
    private BigDecimal entryFee;
    private BigDecimal prizePool;
    private String status;
    private Timestamp registrationDeadline;
    private Timestamp startDate;
    private Timestamp endDate;
    private Integer createBy;
    private Timestamp createAt;
    private String notes;
    private int currentPlayers;
    private List<String> tournamentImages;
    private Boolean bracketPublished;

    public Integer getTournamentId() { return tournamentId; }
    public void setTournamentId(Integer tournamentId) { this.tournamentId = tournamentId; }
    public String getTournamentName() { return tournamentName; }
    public void setTournamentName(String tournamentName) { this.tournamentName = tournamentName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTournamentImage() { return tournamentImage; }
    public void setTournamentImage(String tournamentImage) { this.tournamentImage = tournamentImage; }
    public String getRules() { return rules; }
    public void setRules(String rules) { this.rules = rules; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }
    public Integer getMaxPlayer() { return maxPlayer; }
    public void setMaxPlayer(Integer maxPlayer) { this.maxPlayer = maxPlayer; }
    public Integer getMinPlayer() { return minPlayer; }
    public void setMinPlayer(Integer minPlayer) { this.minPlayer = minPlayer; }
    public BigDecimal getEntryFee() { return entryFee; }
    public void setEntryFee(BigDecimal entryFee) { this.entryFee = entryFee; }
    public BigDecimal getPrizePool() { return prizePool; }
    public void setPrizePool(BigDecimal prizePool) { this.prizePool = prizePool; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Timestamp getRegistrationDeadline() { return registrationDeadline; }
    public void setRegistrationDeadline(Timestamp registrationDeadline) { this.registrationDeadline = registrationDeadline; }
    public Timestamp getStartDate() { return startDate; }
    public void setStartDate(Timestamp startDate) { this.startDate = startDate; }
    public Timestamp getEndDate() { return endDate; }
    public void setEndDate(Timestamp endDate) { this.endDate = endDate; }
    public Integer getCreateBy() { return createBy; }
    public void setCreateBy(Integer createBy) { this.createBy = createBy; }
    public Timestamp getCreateAt() { return createAt; }
    public void setCreateAt(Timestamp createAt) { this.createAt = createAt; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public int getCurrentPlayers() { return currentPlayers; }
    public void setCurrentPlayers(int currentPlayers) { this.currentPlayers = currentPlayers; }
    public List<String> getTournamentImages() { return tournamentImages; }
    public void setTournamentImages(List<String> tournamentImages) { this.tournamentImages = tournamentImages; }
    public Boolean getBracketPublished() { return bracketPublished; }
    public void setBracketPublished(Boolean bracketPublished) { this.bracketPublished = bracketPublished; }
}

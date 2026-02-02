package com.example.model;
import java.math.BigDecimal;
import java.sql.Timestamp;

public class Tournament {
    private int tournamentId;
    private String tournamentName;
    private String description;
    private String location;
    private String format;
    private String categories;

    private Integer maxPlayer;
    private Integer minPlayer;

    private BigDecimal entryFee;
    private BigDecimal prizePool;

    private String status;

    private Timestamp registrationDeadline;
    private Timestamp startDate;
    private Timestamp endDate;
    private Timestamp createAt;

    private int createBy;
    private String notes;

    public Tournament() {
    }

    public Tournament(int tournamentId, String tournamentName, String description, String location, String format,
            String categories, Integer maxPlayer, Integer minPlayer, BigDecimal entryFee, BigDecimal prizePool,
            String status, Timestamp registrationDeadline, Timestamp startDate, Timestamp endDate, Timestamp createAt,
            int createBy, String notes) {
        this.tournamentId = tournamentId;
        this.tournamentName = tournamentName;
        this.description = description;
        this.location = location;
        this.format = format;
        this.categories = categories;
        this.maxPlayer = maxPlayer;
        this.minPlayer = minPlayer;
        this.entryFee = entryFee;
        this.prizePool = prizePool;
        this.status = status;
        this.registrationDeadline = registrationDeadline;
        this.startDate = startDate;
        this.endDate = endDate;
        this.createAt = createAt;
        this.createBy = createBy;
        this.notes = notes;
    }

    public int getTournamentId() {
        return tournamentId;
    }

    public void setTournamentId(int tournamentId) {
        this.tournamentId = tournamentId;
    }

    public String getTournamentName() {
        return tournamentName;
    }

    public void setTournamentName(String tournamentName) {
        this.tournamentName = tournamentName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String getCategories() {
        return categories;
    }

    public void setCategories(String categories) {
        this.categories = categories;
    }

    public Integer getMaxPlayer() {
        return maxPlayer;
    }

    public void setMaxPlayer(Integer maxPlayer) {
        this.maxPlayer = maxPlayer;
    }

    public Integer getMinPlayer() {
        return minPlayer;
    }

    public void setMinPlayer(Integer minPlayer) {
        this.minPlayer = minPlayer;
    }

    public BigDecimal getEntryFee() {
        return entryFee;
    }

    public void setEntryFee(BigDecimal entryFee) {
        this.entryFee = entryFee;
    }

    public BigDecimal getPrizePool() {
        return prizePool;
    }

    public void setPrizePool(BigDecimal prizePool) {
        this.prizePool = prizePool;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Timestamp getRegistrationDeadline() {
        return registrationDeadline;
    }

    public void setRegistrationDeadline(Timestamp registrationDeadline) {
        this.registrationDeadline = registrationDeadline;
    }

    public Timestamp getStartDate() {
        return startDate;
    }

    public void setStartDate(Timestamp startDate) {
        this.startDate = startDate;
    }

    public Timestamp getEndDate() {
        return endDate;
    }

    public void setEndDate(Timestamp endDate) {
        this.endDate = endDate;
    }

    public Timestamp getCreateAt() {
        return createAt;
    }

    public void setCreateAt(Timestamp createAt) {
        this.createAt = createAt;
    }

    public int getCreateBy() {
        return createBy;
    }

    public void setCreateBy(int createBy) {
        this.createBy = createBy;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    
}

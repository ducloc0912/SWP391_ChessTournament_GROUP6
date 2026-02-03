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
    private int maxPlayer;
    private int minPlayer;
    private BigDecimal entryFee; 
    private BigDecimal prizePool;
    private String status;
    private Timestamp registrationDeadline;
    private Timestamp startDate;
    private Timestamp endDate;
    private int createBy;
    private Timestamp createAt;
    private String notes;

public Tournament() {
    }

    public Tournament(int tournamentId, String tournamentName, String description, String location, String format,
            String categories, int maxPlayer, int minPlayer, BigDecimal entryFee, BigDecimal prizePool, String status,
            Timestamp registrationDeadline, Timestamp startDate, Timestamp endDate, int createBy, Timestamp createAt,
            String notes) {
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
        this.createBy = createBy;
        this.createAt = createAt;
        this.notes = notes;
    }

    public void setTournamentId(int tournamentId) {
        this.tournamentId = tournamentId;
    }

    public void setTournamentName(String tournamentName) {
        this.tournamentName = tournamentName;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public void setCategories(String categories) {
        this.categories = categories;
    }

    public void setMaxPlayer(int maxPlayer) {
        this.maxPlayer = maxPlayer;
    }

    public void setMinPlayer(int minPlayer) {
        this.minPlayer = minPlayer;
    }

    public void setEntryFee(BigDecimal entryFee) {
        this.entryFee = entryFee;
    }

    public void setPrizePool(BigDecimal prizePool) {
        this.prizePool = prizePool;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setRegistrationDeadline(Timestamp registrationDeadline) {
        this.registrationDeadline = registrationDeadline;
    }

    public void setStartDate(Timestamp startDate) {
        this.startDate = startDate;
    }

    public void setEndDate(Timestamp endDate) {
        this.endDate = endDate;
    }

    public void setCreateBy(int createBy) {
        this.createBy = createBy;
    }

    public void setCreateAt(Timestamp createAt) {
        this.createAt = createAt;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public int getTournamentId() {
        return tournamentId;
    }

    public String getTournamentName() {
        return tournamentName;
    }

    public String getDescription() {
        return description;
    }

    public String getLocation() {
        return location;
    }

    public String getFormat() {
        return format;
    }

    public String getCategories() {
        return categories;
    }

    public int getMaxPlayer() {
        return maxPlayer;
    }

    public int getMinPlayer() {
        return minPlayer;
    }

    public BigDecimal getEntryFee() {
        return entryFee;
    }

    public BigDecimal getPrizePool() {
        return prizePool;
    }

    public String getStatus() {
        return status;
    }

    public Timestamp getRegistrationDeadline() {
        return registrationDeadline;
    }

    public Timestamp getStartDate() {
        return startDate;
    }

    public Timestamp getEndDate() {
        return endDate;
    }

    public int getCreateBy() {
        return createBy;
    }

    public Timestamp getCreateAt() {
        return createAt;
    }

    public String getNotes() {
        return notes;
    }
    
   
    
}

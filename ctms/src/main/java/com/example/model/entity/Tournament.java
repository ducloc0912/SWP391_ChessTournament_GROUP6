package com.example.model.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.example.model.enums.TournamentFormat;
import com.example.model.enums.TournamentStatus;

public class Tournament {
    private Integer tournamentId;
    private String tournamentName;
    private String description;
    private String location;
    private TournamentFormat format;
    private String categories;
    private Integer maxPlayer;
    private Integer minPlayer;
    private BigDecimal entryFee;
    private BigDecimal prizePool;
    public Integer getTournamentId() {
        return tournamentId;
    }

    public void setTournamentId(Integer tournamentId) {
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

    public TournamentFormat getFormat() {
        return format;
    }

    public void setFormat(TournamentFormat format) {
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

    public TournamentStatus getStatus() {
        return status;
    }

    public void setStatus(TournamentStatus status) {
        this.status = status;
    }

    public LocalDateTime getRegistrationDeadline() {
        return registrationDeadline;
    }

    public void setRegistrationDeadline(LocalDateTime registrationDeadline) {
        this.registrationDeadline = registrationDeadline;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }

    public Integer getCreateBy() {
        return createBy;
    }

    public void setCreateBy(Integer createBy) {
        this.createBy = createBy;
    }

    public LocalDateTime getCreateAt() {
        return createAt;
    }

    public void setCreateAt(LocalDateTime createAt) {
        this.createAt = createAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    private TournamentStatus status;
    private LocalDateTime registrationDeadline;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer createBy;
    private LocalDateTime createAt;
    private String notes;

    public Tournament() {}

    public Tournament(Integer tournamentId, String tournamentName, String description, String location,
                      TournamentFormat format, String categories, Integer maxPlayer, Integer minPlayer,
                      BigDecimal entryFee, BigDecimal prizePool, TournamentStatus status,
                      LocalDateTime registrationDeadline, LocalDateTime startDate, LocalDateTime endDate,
                      Integer createBy, LocalDateTime createAt, String notes) {
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
}
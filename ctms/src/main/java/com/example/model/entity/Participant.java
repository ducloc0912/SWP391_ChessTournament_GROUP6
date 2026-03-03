package com.example.model.entity;

import com.example.model.enums.ParticipantStatus;

import java.sql.Timestamp;

public class Participant {
    private Integer participantId;
    private Integer tournamentId;
    public Integer getParticipantId() {
        return participantId;
    }

    public void setParticipantId(Integer participantId) {
        this.participantId = participantId;
    }

    public Integer getTournamentId() {
        return tournamentId;
    }

    public void setTournamentId(Integer tournamentId) {
        this.tournamentId = tournamentId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getTitleAtRegistration() {
        return titleAtRegistration;
    }

    public void setTitleAtRegistration(String titleAtRegistration) {
        this.titleAtRegistration = titleAtRegistration;
    }

    public Integer getSeed() {
        return seed;
    }

    public void setSeed(Integer seed) {
        this.seed = seed;
    }

    public ParticipantStatus getStatus() {
        return status;
    }

    public void setStatus(ParticipantStatus status) {
        this.status = status;
    }

    public Boolean getIsPaid() {
        return isPaid;
    }

    public void setIsPaid(Boolean isPaid) {
        this.isPaid = isPaid;
    }

    public Timestamp getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(Timestamp paymentDate) {
        this.paymentDate = paymentDate;
    }

    public Timestamp getPaymentExpiresAt() { return paymentExpiresAt; }
    public void setPaymentExpiresAt(Timestamp paymentExpiresAt) { this.paymentExpiresAt = paymentExpiresAt; }
    public Timestamp getRemovedAt() { return removedAt; }
    public void setRemovedAt(Timestamp removedAt) { this.removedAt = removedAt; }

    public Timestamp getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(Timestamp registrationDate) {
        this.registrationDate = registrationDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    private Integer userId;
    private String titleAtRegistration;
    private Integer seed;
    private ParticipantStatus status;
    private Boolean isPaid;
    private Timestamp paymentDate;
    private Timestamp paymentExpiresAt;
    private Timestamp removedAt;
    private Timestamp registrationDate;
    private String notes;

    public Participant() {}

    public Participant(Integer participantId, Integer tournamentId, Integer userId,
                       String titleAtRegistration, Integer seed, ParticipantStatus status,
                       Boolean isPaid, Timestamp paymentDate, Timestamp registrationDate,
                       String notes) {
        this.participantId = participantId;
        this.tournamentId = tournamentId;
        this.userId = userId;
        this.titleAtRegistration = titleAtRegistration;
        this.seed = seed;
        this.status = status;
        this.isPaid = isPaid;
        this.paymentDate = paymentDate;
        this.registrationDate = registrationDate;
        this.notes = notes;
    }
}
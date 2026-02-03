package com.example.model;

import java.sql.Timestamp;

public class Participant {
    private int participantId;
    private int tournamentId;
    private int userId;
    private String titleAtRegistration;
    private Integer seed;
    private String status;
    private boolean isPaid;
    private Timestamp paymentDate;
    private Timestamp registrationDate;
    private String notes;

    public Participant() {
    }

    public Participant(int participantId, int tournamentId, int userId, String titleAtRegistration,
                       Integer seed, String status, boolean isPaid, Timestamp paymentDate,
                       Timestamp registrationDate, String notes) {
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

    // Getters and Setters
    public int getParticipantId() {
        return participantId;
    }

    public void setParticipantId(int participantId) {
        this.participantId = participantId;
    }

    public int getTournamentId() {
        return tournamentId;
    }

    public void setTournamentId(int tournamentId) {
        this.tournamentId = tournamentId;
    }

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isPaid() {
        return isPaid;
    }

    public void setPaid(boolean paid) {
        isPaid = paid;
    }

    public Timestamp getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(Timestamp paymentDate) {
        this.paymentDate = paymentDate;
    }

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
}

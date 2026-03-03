package com.example.model.dto;

import java.util.Map;

/**
 * Full setup state for the wizard: current step and status of each step.
 */
public class TournamentSetupStateDTO {
    private int tournamentId;
    private String currentStep;       // BRACKET | PLAYERS | SCHEDULE | REFEREES | COMPLETED
    private Map<String, String> stepStatuses; // step -> DRAFT | FINALIZED
    private java.util.Date updatedAt;
    private Integer updatedBy;

    public int getTournamentId() {
        return tournamentId;
    }

    public void setTournamentId(int tournamentId) {
        this.tournamentId = tournamentId;
    }

    public String getCurrentStep() {
        return currentStep;
    }

    public void setCurrentStep(String currentStep) {
        this.currentStep = currentStep;
    }

    public Map<String, String> getStepStatuses() {
        return stepStatuses;
    }

    public void setStepStatuses(Map<String, String> stepStatuses) {
        this.stepStatuses = stepStatuses;
    }

    public java.util.Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(java.util.Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Integer getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(Integer updatedBy) {
        this.updatedBy = updatedBy;
    }
}

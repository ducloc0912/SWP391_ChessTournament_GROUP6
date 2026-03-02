package com.example.model.dto;

import java.util.ArrayList;
import java.util.List;

public class TournamentManualSetupRequestDTO {
    private String format;
    private String setupStep;
    private List<TournamentSetupMatchDTO> matches = new ArrayList<>();

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String getSetupStep() {
        return setupStep;
    }

    public void setSetupStep(String setupStep) {
        this.setupStep = setupStep;
    }

    public List<TournamentSetupMatchDTO> getMatches() {
        return matches;
    }

    public void setMatches(List<TournamentSetupMatchDTO> matches) {
        this.matches = matches == null ? new ArrayList<>() : matches;
    }
}

package com.example.model.entity;

import java.sql.Timestamp;

public class Report {
    private Integer reportId;
    private Integer reporterId;
    private Integer accusedId;
    private Integer matchId;
    private String description;
    public Integer getReportId() {
        return reportId;
    }

    public void setReportId(Integer reportId) {
        this.reportId = reportId;
    }

    public Integer getReporterId() {
        return reporterId;
    }

    public void setReporterId(Integer reporterId) {
        this.reporterId = reporterId;
    }

    public Integer getAccusedId() {
        return accusedId;
    }

    public void setAccusedId(Integer accusedId) {
        this.accusedId = accusedId;
    }

    public Integer getMatchId() {
        return matchId;
    }

    public void setMatchId(Integer matchId) {
        this.matchId = matchId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEvidenceUrl() {
        return evidenceUrl;
    }

    public void setEvidenceUrl(String evidenceUrl) {
        this.evidenceUrl = evidenceUrl;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Integer getResolvedBy() {
        return resolvedBy;
    }

    public void setResolvedBy(Integer resolvedBy) {
        this.resolvedBy = resolvedBy;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public Timestamp getResolvedTime() {
        return resolvedTime;
    }

    public void setResolvedTime(Timestamp resolvedTime) {
        this.resolvedTime = resolvedTime;
    }

    private String evidenceUrl;
    private String type;
    private String status;
    private String note;
    private Integer resolvedBy;
    private Timestamp createdAt;
    private Timestamp resolvedTime;

    public Report() {}

    public Report(Integer reportId, Integer reporterId, Integer accusedId, Integer matchId,
                  String description, String evidenceUrl, String type, String status, String note,
                  Integer resolvedBy, Timestamp createdAt, Timestamp resolvedTime) {
        this.reportId = reportId;
        this.reporterId = reporterId;
        this.accusedId = accusedId;
        this.matchId = matchId;
        this.description = description;
        this.evidenceUrl = evidenceUrl;
        this.type = type;
        this.status = status;
        this.note = note;
        this.resolvedBy = resolvedBy;
        this.createdAt = createdAt;
        this.resolvedTime = resolvedTime;
    }
}
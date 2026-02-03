package com.example.model.entity;

public class Bracket {
    private Integer bracketId;
    private String bracketName;
    private Integer tournamentId;
    private String type;     // bạn có thể đổi thành enum nếu muốn
    private String status;   // Pending/...

    public Integer getBracketId() {
        return bracketId;
    }

    public void setBracketId(Integer bracketId) {
        this.bracketId = bracketId;
    }

    public String getBracketName() {
        return bracketName;
    }

    public void setBracketName(String bracketName) {
        this.bracketName = bracketName;
    }

    public Integer getTournamentId() {
        return tournamentId;
    }

    public void setTournamentId(Integer tournamentId) {
        this.tournamentId = tournamentId;
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

    public Bracket() {}

    public Bracket(Integer bracketId, String bracketName, Integer tournamentId, String type, String status) {
        this.bracketId = bracketId;
        this.bracketName = bracketName;
        this.tournamentId = tournamentId;
        this.type = type;
        this.status = status;
    }
}
package com.example.model.id;
import java.io.Serializable;
import java.util.Objects;

public class StandingId implements Serializable {
    private int tournamentId;
    private int userId;

    public StandingId() {}

    public StandingId(int tournamentId, int userId) {
        this.tournamentId = tournamentId;
        this.userId = userId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof StandingId)) return false;
        StandingId that = (StandingId) o;
        return tournamentId == that.tournamentId && userId == that.userId;
    }

    @Override
    public int hashCode() {
        return Objects.hash(tournamentId, userId);
    }
}
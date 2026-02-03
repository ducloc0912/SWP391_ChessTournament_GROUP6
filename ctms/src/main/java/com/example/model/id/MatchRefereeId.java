package com.example.model.id;

import java.io.Serializable;
import java.util.Objects;

public class MatchRefereeId implements Serializable {
    private int matchId;
    private int refereeId;

    public MatchRefereeId() {}

    public MatchRefereeId(int matchId, int refereeId) {
        this.matchId = matchId;
        this.refereeId = refereeId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MatchRefereeId)) return false;
        MatchRefereeId that = (MatchRefereeId) o;
        return matchId == that.matchId && refereeId == that.refereeId;
    }

    @Override
    public int hashCode() {
        return Objects.hash(matchId, refereeId);
    }
}
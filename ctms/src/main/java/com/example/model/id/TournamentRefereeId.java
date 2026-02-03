package com.example.model.id;
import java.io.Serializable;
import java.util.Objects;
public class TournamentRefereeId implements Serializable {
    private int tournamentId;
    private int refereeId;

    public TournamentRefereeId() {}

    public TournamentRefereeId(int tournamentId, int refereeId) {
        this.tournamentId = tournamentId;
        this.refereeId = refereeId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TournamentRefereeId)) return false;
        TournamentRefereeId that = (TournamentRefereeId) o;
        return tournamentId == that.tournamentId && refereeId == that.refereeId;
    }

    @Override
    public int hashCode() {
        return Objects.hash(tournamentId, refereeId);
    }
}
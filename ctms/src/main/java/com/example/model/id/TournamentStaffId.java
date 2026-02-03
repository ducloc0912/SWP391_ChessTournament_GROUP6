package com.example.model.id;

import java.io.Serializable;
import java.util.Objects;

public class TournamentStaffId implements Serializable {
    private int tournamentId;
    private int staffId;

    public TournamentStaffId() {}

    public TournamentStaffId(int tournamentId, int staffId) {
        this.tournamentId = tournamentId;
        this.staffId = staffId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TournamentStaffId)) return false;
        TournamentStaffId that = (TournamentStaffId) o;
        return tournamentId == that.tournamentId && staffId == that.staffId;
    }

    @Override
    public int hashCode() {
        return Objects.hash(tournamentId, staffId);
    }
}
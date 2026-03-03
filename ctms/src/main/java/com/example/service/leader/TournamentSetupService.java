package com.example.service.leader;

import com.example.DAO.TournamentSetupDAO;
import com.example.model.dto.TournamentSetupMatchDTO;
import com.example.model.dto.TournamentSetupStateDTO;
import com.example.model.dto.TournamentManualSetupRequestDTO;
import com.example.model.enums.SetupStep;
import com.google.gson.Gson;

import java.util.List;
import java.util.Map;

/**
 * Central service for tournament setup wizard: state machine (DRAFT/FINALIZED), finalize/unlock, validation.
 */
public class TournamentSetupService {

    private final TournamentSetupDAO setupDAO;
    private final TournamentService tournamentService;
    private final Gson gson = new Gson();

    public TournamentSetupService() {
        this.setupDAO = new TournamentSetupDAO();
        this.tournamentService = new TournamentService();
    }

    /**
     * Get full setup state for tournament (current step + status per step). Ensures row exists.
     */
    public TournamentSetupStateDTO getSetupState(int tournamentId) {
        if (tournamentId <= 0) return null;
        setupDAO.ensureSetupStateRow(tournamentId);
        return setupDAO.getSetupStateFull(tournamentId);
    }

    /**
     * Validate that step N-1 is finalized before allowing finalize of step N. Then run step-specific validation.
     */
    public ValidationResult validateBeforeFinalize(int tournamentId, SetupStep step, TournamentManualSetupRequestDTO request) {
        if (tournamentId <= 0 || step == null) {
            return ValidationResult.invalid("Invalid tournament or step.");
        }
        TournamentSetupStateDTO state = getSetupState(tournamentId);
        if (state == null) return ValidationResult.invalid("Could not load setup state.");

        Map<String, String> statuses = state.getStepStatuses();
        if (statuses == null) statuses = Map.of();

        // Previous step must be FINALIZED (except for BRACKET)
        if (step != SetupStep.BRACKET) {
            SetupStep prev = previous(step);
            if (prev != null && !"FINALIZED".equalsIgnoreCase(statuses.get(prev.name()))) {
                return ValidationResult.invalid("Bạn cần hoàn tất bước trước (" + prev.name() + ") trước khi finalize bước này.");
            }
        }

        // Không cho finalize lại step K nếu có step sau K đang ở trạng thái FINALIZED.
        int currentOrder = step.order();
        for (SetupStep s : SetupStep.values()) {
            if (s == SetupStep.COMPLETED) continue;
            if (s.order() > currentOrder) {
                String st = statuses.get(s.name());
                if ("FINALIZED".equalsIgnoreCase(st)) {
                    return ValidationResult.invalid(
                        "Không thể finalize lại bước " + step.name() +
                        " khi bước " + s.name() + " đã ở trạng thái FINALIZED. Vui lòng dùng chức năng Unlock trước."
                    );
                }
            }
        }

        switch (step) {
            case BRACKET:
                return validateBracketStep(request);
            case PLAYERS:
                return validatePlayersStep(tournamentId, request);
            case SCHEDULE:
                return validateScheduleStep(tournamentId, request);
            case REFEREES:
                return validateRefereesStep(tournamentId);
            default:
                return ValidationResult.invalid("Step không được finalize.");
        }
    }

    private SetupStep previous(SetupStep step) {
        switch (step) {
            case PLAYERS: return SetupStep.BRACKET;
            case SCHEDULE: return SetupStep.PLAYERS;
            case REFEREES: return SetupStep.SCHEDULE;
            default: return null;
        }
    }

    private ValidationResult validateBracketStep(TournamentManualSetupRequestDTO request) {
        if (request == null) return ValidationResult.invalid("Thiếu dữ liệu.");
        String format = tournamentService.getNormalizedFormat(request.getFormat());
        if (format == null) return ValidationResult.invalid("Thể thức không hợp lệ. Chỉ hỗ trợ RoundRobin, KnockOut, Hybrid.");
        List<TournamentSetupMatchDTO> matches = request.getMatches();
        if (matches == null || matches.isEmpty()) {
            return ValidationResult.invalid("Bạn chưa dựng structure bracket.");
        }
        TournamentService.SetupValidationResult r = tournamentService.validateStructureStepInternal(format, matches);
        return r.isValid() ? ValidationResult.valid() : ValidationResult.invalid(r.getMessage());
    }

    private ValidationResult validatePlayersStep(int tournamentId, TournamentManualSetupRequestDTO request) {
        if (request == null) return ValidationResult.invalid("Thiếu dữ liệu.");
        String format = tournamentService.getNormalizedFormat(request.getFormat());
        if (format == null) return ValidationResult.invalid("Thể thức không hợp lệ.");
        List<TournamentSetupMatchDTO> matches = request.getMatches();
        TournamentService.SetupValidationResult r = tournamentService.validatePlayersStepInternal(tournamentId, format, matches);
        return r.isValid() ? ValidationResult.valid() : ValidationResult.invalid(r.getMessage());
    }

    private ValidationResult validateScheduleStep(int tournamentId, TournamentManualSetupRequestDTO request) {
        if (request == null) return ValidationResult.invalid("Thiếu dữ liệu.");
        String format = tournamentService.getNormalizedFormat(request.getFormat());
        if (format == null) return ValidationResult.invalid("Thể thức không hợp lệ.");
        List<TournamentSetupMatchDTO> matches = request.getMatches();
        if (matches == null || matches.isEmpty()) {
            return ValidationResult.invalid("Chưa có trận đấu nào. Cần finalize bước Players trước.");
        }
        TournamentService.SetupValidationResult r = tournamentService.validateScheduleStepInternal(tournamentId, format, matches);
        return r.isValid() ? ValidationResult.valid() : ValidationResult.invalid(r.getMessage());
    }

    private ValidationResult validateRefereesStep(int tournamentId) {
        // Policy: at least one referee assigned or at least one pending invite is acceptable.
        // Optional: require min referees. Here we only require schedule step is finalized.
        return ValidationResult.valid();
    }

    /**
     * Finalize step: validate, persist data (replace manual setup for BRACKET/PLAYERS/SCHEDULE), then mark step FINALIZED and advance.
     */
    public ValidationResult finalizeStep(int tournamentId, SetupStep step, TournamentManualSetupRequestDTO request, Integer userId) {
        ValidationResult validation = validateBeforeFinalize(tournamentId, step, request);
        if (!validation.isValid()) return validation;

        TournamentSetupStateDTO before = getSetupState(tournamentId);
        String beforeJson = gson.toJson(before);

        if (step == SetupStep.BRACKET || step == SetupStep.PLAYERS || step == SetupStep.SCHEDULE) {
            if (request != null) {
                TournamentService.SetupValidationResult saveResult = saveStepData(tournamentId, step, request);
                if (!saveResult.isValid()) {
                    return ValidationResult.invalid(saveResult.getMessage());
                }
            }
        }
        if (step == SetupStep.REFEREES) {
            // Referee data is already saved via assign/invite; we only advance state.
        }

        boolean ok = setupDAO.finalizeStep(tournamentId, step, userId);
        if (!ok) return ValidationResult.invalid("Không thể cập nhật trạng thái bước.");

        TournamentSetupStateDTO after = getSetupState(tournamentId);
        setupDAO.insertAuditLog(tournamentId, step.name(), "FINALIZE", beforeJson, gson.toJson(after), userId);
        return ValidationResult.valid();
    }

    private TournamentService.SetupValidationResult saveStepData(int tournamentId, SetupStep step, TournamentManualSetupRequestDTO request) {
        String format = tournamentService.getNormalizedFormat(request.getFormat());
        List<TournamentSetupMatchDTO> matches = tournamentService.normalizeMatchesInternal(request.getMatches(), format);
        if (step == SetupStep.BRACKET) {
            boolean saved = setupDAO.replaceManualSetup(tournamentId, format, matches);
            if (!saved) return TournamentService.SetupValidationResult.invalid("Không thể lưu structure bracket.");
            return TournamentService.SetupValidationResult.valid("Hoàn tất Structure.");
        }
        if (step == SetupStep.PLAYERS) {
            boolean saved = setupDAO.replaceManualSetup(tournamentId, format, matches);
            if (!saved) return TournamentService.SetupValidationResult.invalid("Không thể lưu Add Players.");
            return TournamentService.SetupValidationResult.valid("Hoàn tất Add Players.");
        }
        if (step == SetupStep.SCHEDULE) {
            boolean saved = setupDAO.replaceManualSetup(tournamentId, format, matches);
            if (!saved) return TournamentService.SetupValidationResult.invalid("Không thể lưu lịch đấu.");
            return TournamentService.SetupValidationResult.valid("Lưu lịch thành công.");
        }
        return TournamentService.SetupValidationResult.invalid("Step không hợp lệ.");
    }

    /**
     * Unlock step K: set step K to DRAFT and invalidate steps K+1..4 (set to DRAFT). Log audit.
     */
    public ValidationResult unlockStep(int tournamentId, SetupStep step, Integer userId) {
        if (tournamentId <= 0 || step == null) {
            return ValidationResult.invalid("Invalid tournament or step.");
        }
        if (step == SetupStep.COMPLETED || step == SetupStep.BRACKET) {
            // Unlocking BRACKET is allowed (all steps go DRAFT). Unlocking COMPLETED = no-op or treat as REFEREES.
            if (step == SetupStep.COMPLETED) {
                step = SetupStep.REFEREES;
            }
        }
        TournamentSetupStateDTO before = getSetupState(tournamentId);
        String beforeJson = gson.toJson(before);
        boolean ok = setupDAO.unlockStep(tournamentId, step, userId);
        if (!ok) return ValidationResult.invalid("Không thể mở khóa bước.");
        TournamentSetupStateDTO after = getSetupState(tournamentId);
        setupDAO.insertAuditLog(tournamentId, step.name(), "UNLOCK", beforeJson, gson.toJson(after), userId);
        return ValidationResult.valid();
    }

    public static class ValidationResult {
        private final boolean valid;
        private final String message;

        private ValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }

        public static ValidationResult valid() {
            return new ValidationResult(true, null);
        }

        public static ValidationResult invalid(String message) {
            return new ValidationResult(false, message);
        }

        public boolean isValid() { return valid; }
        public String getMessage() { return message; }
    }
}

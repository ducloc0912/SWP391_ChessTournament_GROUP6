package com.example.service.leader;

import com.example.DAO.TournamentSetupDAO;
import com.example.model.dto.TournamentSetupMatchDTO;
import com.example.model.dto.TournamentSetupStateDTO;
import com.example.model.dto.TournamentManualSetupRequestDTO;
import com.example.model.enums.SetupStep;

import java.util.List;
import java.util.Map;

/**
 * Service điều khiển luồng Setup Wizard: Structure → Players → Schedule → Referee → COMPLETED.
 * Quản lý state machine (DRAFT/FINALIZED), validate trước khi finalize, gọi DAO persist dữ liệu.
 */
public class TournamentSetupService {

    private final TournamentSetupDAO setupDAO;
    private final TournamentService tournamentService;

    public TournamentSetupService() {
        this.setupDAO = new TournamentSetupDAO();
        this.tournamentService = new TournamentService();
    }

    // ==================== SETUP STATE ====================

    /**
     * Lấy trạng thái setup đầy đủ (current_step + status từng bước). Đảm bảo có dòng trong DB.
     */
    public TournamentSetupStateDTO getSetupState(int tournamentId) {
        if (tournamentId <= 0) return null;
        setupDAO.ensureSetupStateRow(tournamentId);
        return setupDAO.getSetupStateFull(tournamentId);
    }

    // ==================== FINALIZE ====================

    /**
     * Validate trước khi finalize: bước trước phải FINALIZED.
     * Finalize vẫn là cổng validate nghiệp vụ, nhưng không khóa điều hướng step ở FE.
     */
    public ValidationResult validateBeforeFinalize(int tournamentId, SetupStep step, TournamentManualSetupRequestDTO request) {
        if (tournamentId <= 0 || step == null) {
            return ValidationResult.invalid("Invalid tournament or step.");
        }
        TournamentSetupStateDTO state = getSetupState(tournamentId);
        if (state == null) return ValidationResult.invalid("Could not load setup state.");

        Map<String, String> statuses = state.getStepStatuses();
        if (statuses == null) statuses = Map.of();

        if (step != SetupStep.BRACKET) {
            SetupStep prev = previous(step);
            if (prev != null && !"FINALIZED".equalsIgnoreCase(statuses.get(prev.name()))) {
                return ValidationResult.invalid("Bạn cần Finalize bước trước (" + prev.name() + ") trước khi Finalize bước này.");
            }
        }

        // Sau khi đã Save & Publish chỉ cho phép chỉnh Add Players và Referees.
        if (isSetupPublished(state) && step != SetupStep.PLAYERS && step != SetupStep.REFEREES) {
            return ValidationResult.invalid("Giải đã được Save & Publish. Chỉ có thể cập nhật Add Players và Referees.");
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

    /**
     * Finalize bước: validate → persist dữ liệu (BRACKET/PLAYERS/SCHEDULE) → cập nhật status FINALIZED và advance.
     */
    public ValidationResult finalizeStep(int tournamentId, SetupStep step, TournamentManualSetupRequestDTO request, Integer userId) {
        ValidationResult validation = validateBeforeFinalize(tournamentId, step, request);
        if (!validation.isValid()) return validation;

        if (step == SetupStep.BRACKET || step == SetupStep.PLAYERS || step == SetupStep.SCHEDULE) {
            if (request != null) {
                TournamentService.SetupValidationResult saveResult = saveStepData(tournamentId, step, request);
                if (!saveResult.isValid()) {
                    return ValidationResult.invalid(saveResult.getMessage());
                }
            }
        } else if (step == SetupStep.REFEREES) {
            if (request == null || request.getMatches() == null) {
                return ValidationResult.invalid("Thiếu dữ liệu trọng tài. Gửi matches để finalize bước Referee.");
            }
            TournamentService.SetupValidationResult saveResult =
                    tournamentService.saveRefereeAssignments(tournamentId, request.getMatches());
            if (!saveResult.isValid()) {
                return ValidationResult.invalid(saveResult.getMessage());
            }
        }

        setupDAO.ensureSetupStateRow(tournamentId);
        boolean ok = setupDAO.finalizeStep(tournamentId, step, userId);
        if (!ok) {
            setupDAO.ensureSetupStateRow(tournamentId);
            ok = setupDAO.finalizeStep(tournamentId, step, userId);
        }
        if (!ok) return ValidationResult.invalid("Không thể cập nhật trạng thái bước. Kiểm tra bảng Tournament_Setup_State đã có dòng cho giải này chưa (chạy scripts/ensure_tournament_setup_state_rows.sql).");
        return ValidationResult.valid();
    }

    public ValidationResult markDirtyFromStep(int tournamentId, SetupStep step, Integer userId) {
        if (tournamentId <= 0 || step == null || step == SetupStep.COMPLETED) {
            return ValidationResult.invalid("Invalid tournament or step.");
        }
        setupDAO.ensureSetupStateRow(tournamentId);
        boolean ok = setupDAO.markDirtyFromStep(tournamentId, step, userId);
        if (!ok) {
            return ValidationResult.invalid("Không thể chuyển bước về DIRTY.");
        }
        return ValidationResult.valid();
    }

    public ValidationResult publishSetup(int tournamentId) {
        if (tournamentId <= 0) {
            return ValidationResult.invalid("Invalid tournament.");
        }
        TournamentSetupStateDTO state = getSetupState(tournamentId);
        if (state == null) {
            return ValidationResult.invalid("Could not load setup state.");
        }
        Map<String, String> statuses = state.getStepStatuses();
        if (statuses == null) statuses = Map.of();
        if (!"FINALIZED".equalsIgnoreCase(statuses.get("BRACKET"))
                || !"FINALIZED".equalsIgnoreCase(statuses.get("PLAYERS"))
                || !"FINALIZED".equalsIgnoreCase(statuses.get("SCHEDULE"))
                || !"FINALIZED".equalsIgnoreCase(statuses.get("REFEREES"))) {
            return ValidationResult.invalid("Chỉ có thể Publish khi cả 4 bước đều đã FINALIZED.");
        }
        boolean ok = setupDAO.upsertSetupStep(tournamentId, SetupStep.COMPLETED.toDbValue());
        if (!ok) {
            return ValidationResult.invalid("Không thể cập nhật trạng thái Publish.");
        }
        return ValidationResult.valid("Save & Publish thành công.");
    }

    /** Lưu dữ liệu cho bước PLAYERS/SCHEDULE. BRACKET chỉ validate structure, chưa ghi Matches. */
    private TournamentService.SetupValidationResult saveStepData(int tournamentId, SetupStep step, TournamentManualSetupRequestDTO request) {
        String format = tournamentService.getNormalizedFormat(request.getFormat());
        List<TournamentSetupMatchDTO> matches = tournamentService.normalizeMatchesInternal(request.getMatches(), format);
        if (step == SetupStep.BRACKET) {
            return TournamentService.SetupValidationResult.valid("Hoàn tất Structure. Chưa gán player ở bước này.");
        }
        if (step == SetupStep.PLAYERS) {
            boolean saved = setupDAO.replaceManualSetup(tournamentId, format, matches);
            if (!saved) {
                String daoError = setupDAO.getLastReplaceManualSetupError();
                String message = (daoError == null || daoError.isBlank())
                        ? "Không thể lưu Add Players."
                        : "Không thể lưu Add Players. " + daoError;
                return TournamentService.SetupValidationResult.invalid(message);
            }
            return TournamentService.SetupValidationResult.valid("Hoàn tất Add Players.");
        }
        if (step == SetupStep.SCHEDULE) {
            boolean saved = setupDAO.replaceManualSetup(tournamentId, format, matches);
            if (!saved) {
                String daoError = setupDAO.getLastReplaceManualSetupError();
                String message = (daoError == null || daoError.isBlank())
                        ? "Không thể lưu lịch đấu."
                        : "Không thể lưu lịch đấu. " + daoError;
                return TournamentService.SetupValidationResult.invalid(message);
            }
            return TournamentService.SetupValidationResult.valid("Lưu lịch thành công.");
        }
        return TournamentService.SetupValidationResult.invalid("Step không hợp lệ.");
    }

    private boolean isSetupPublished(TournamentSetupStateDTO state) {
        if (state == null) return false;
        String current = state.getCurrentStep();
        if ("COMPLETED".equalsIgnoreCase(current)) return true;
        Map<String, String> statuses = state.getStepStatuses();
        if (statuses == null) return false;
        return "FINALIZED".equalsIgnoreCase(statuses.get("REFEREES"));
    }

    // ==================== VALIDATION HELPERS ====================

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
        if (format == null) return ValidationResult.invalid("Thể thức không hợp lệ. Chỉ hỗ trợ RoundRobin, KnockOut.");
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
        if (request == null) return ValidationResult.invalid("Thiếu dữ liệu. Gửi format và matches (Content-Type: application/json).");
        String format = tournamentService.getNormalizedFormat(request.getFormat());
        if (format == null) return ValidationResult.invalid("Thể thức không hợp lệ. Chỉ hỗ trợ RoundRobin, KnockOut.");
        List<TournamentSetupMatchDTO> matches = request.getMatches();
        if (matches == null || matches.isEmpty()) {
            return ValidationResult.invalid("Chưa có trận đấu nào. Cần finalize bước Players trước khi finalize Schedule.");
        }
        TournamentService.SetupValidationResult r = tournamentService.validateScheduleStepInternal(tournamentId, format, matches);
        return r.isValid() ? ValidationResult.valid() : ValidationResult.invalid(r.getMessage());
    }

    private ValidationResult validateRefereesStep(int tournamentId) {
        TournamentSetupStateDTO state = getSetupState(tournamentId);
        if (state == null) {
            return ValidationResult.invalid("Không thể tải trạng thái setup.");
        }
        Map<String, String> statuses = state.getStepStatuses();
        if (statuses == null || !"FINALIZED".equalsIgnoreCase(statuses.get("SCHEDULE"))) {
            return ValidationResult.invalid("Bạn cần Finalize Schedule trước khi Finalize Referee.");
        }
        return ValidationResult.valid();
    }

    // ==================== VALIDATION RESULT ====================

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

        public static ValidationResult valid(String message) {
            return new ValidationResult(true, message);
        }

        public static ValidationResult invalid(String message) {
            return new ValidationResult(false, message);
        }

        public boolean isValid() { return valid; }
        public String getMessage() { return message; }
    }
}



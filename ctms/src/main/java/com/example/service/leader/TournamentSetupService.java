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
 * Service điều khiển luồng Setup Wizard: Structure → Players → Schedule → Referee → COMPLETED.
 * Quản lý state machine (DRAFT/FINALIZED), validate trước khi finalize, gọi DAO persist dữ liệu.
 */
public class TournamentSetupService {

    private final TournamentSetupDAO setupDAO;
    private final TournamentService tournamentService;
    private final Gson gson = new Gson();

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
     * Validate trước khi finalize: bước trước phải FINALIZED; không có bước sau đã FINALIZED.
     * Sau đó validate dữ liệu theo từng bước (structure, players, schedule, referee).
     */
    public ValidationResult validateBeforeFinalize(int tournamentId, SetupStep step, TournamentManualSetupRequestDTO request) {
        if (tournamentId <= 0 || step == null) {
            return ValidationResult.invalid("Invalid tournament or step.");
        }
        TournamentSetupStateDTO state = getSetupState(tournamentId);
        if (state == null) return ValidationResult.invalid("Could not load setup state.");

        Map<String, String> statuses = state.getStepStatuses();
        if (statuses == null) statuses = Map.of();




        switch (step) {
            case BRACKET:
                return validateBracketStep(tournamentId, request);
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
        
        if (!validation.isValid()) {
            // Revert this step to DRAFT if it was finalized before but now is invalid
            TournamentSetupStateDTO state = getSetupState(tournamentId);
            if (state != null && state.getStepStatuses() != null) {
                String currentStatus = state.getStepStatuses().get(step.name());
                if ("FINALIZED".equalsIgnoreCase(currentStatus)) {
                    setupDAO.unlockStep(tournamentId, step, userId);
                }
            }
            return validation;
        }

        if (step == SetupStep.BRACKET || step == SetupStep.PLAYERS || step == SetupStep.SCHEDULE) {
            if (request != null) {
                TournamentService.SetupValidationResult saveResult = saveStepData(tournamentId, step, request);
                if (!saveResult.isValid()) {
                    return ValidationResult.invalid(saveResult.getMessage());
                }
            }
        }

        setupDAO.ensureSetupStateRow(tournamentId);
        boolean ok = setupDAO.finalizeStep(tournamentId, step, userId);
        if (!ok) {
            setupDAO.ensureSetupStateRow(tournamentId);
            ok = setupDAO.finalizeStep(tournamentId, step, userId);
        }
        if (!ok) return ValidationResult.invalid("Không thể cập nhật trạng thái bước.");

        return ValidationResult.valid();
    }

    /** Lưu dữ liệu bracket/schedule (replaceManualSetup) cho bước BRACKET/PLAYERS/SCHEDULE. */
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

    // ==================== VALIDATION HELPERS ====================

    private SetupStep previous(SetupStep step) {
        switch (step) {
            case PLAYERS: return SetupStep.BRACKET;
            case SCHEDULE: return SetupStep.PLAYERS;
            case REFEREES: return SetupStep.SCHEDULE;
            default: return null;
        }
    }

    private ValidationResult validateBracketStep(int tournamentId, TournamentManualSetupRequestDTO request) {
        if (request == null) return ValidationResult.invalid("Thiếu dữ liệu.");
        String format = tournamentService.getNormalizedFormat(request.getFormat());
        if (format == null) return ValidationResult.invalid("Thể thức không hợp lệ. Chỉ hỗ trợ RoundRobin, KnockOut.");
        List<TournamentSetupMatchDTO> matches = request.getMatches();
        if (matches == null || matches.isEmpty()) {
            return ValidationResult.invalid("Bạn chưa dựng structure bracket.");
        }
        ValidationResult roundRobinValidation = validateRoundRobinStructureLimits(tournamentId, format, matches);
        if (!roundRobinValidation.isValid()) {
            return roundRobinValidation;
        }
        if ("KnockOut".equals(format)) {
            ValidationResult koValidation = validateKnockOutStructureLimits(tournamentId, matches);
            if (!koValidation.isValid()) return koValidation;
        }
        TournamentService.SetupValidationResult r = tournamentService.validateStructureStepInternal(format, matches);
        return r.isValid() ? ValidationResult.valid() : ValidationResult.invalid(r.getMessage());
    }

    private ValidationResult validateKnockOutStructureLimits(int tournamentId, List<TournamentSetupMatchDTO> matches) {
        int approvedPlayers = setupDAO.getParticipantUserIds(tournamentId).size();
        if (approvedPlayers < 2) {
            return ValidationResult.invalid("Cần ít nhất 2 người chơi đã duyệt để tạo bracket KnockOut.");
        }
        int bracketSize = nextPowerOf2(approvedPlayers);
        int requiredMatches = bracketSize - 1;
        long koMatchCount = matches.stream()
                .filter(m -> "KnockOut".equalsIgnoreCase(String.valueOf(m.getStage())))
                .count();
        if (koMatchCount < requiredMatches) {
            return ValidationResult.invalid("Bracket KnockOut với " + approvedPlayers + " người chơi cần đủ " + requiredMatches
                    + " trận (bracket size " + bracketSize + "), nhưng hiện chỉ có " + koMatchCount + " trận. Vui lòng dùng Auto Structure hoặc thêm đủ trận.");
        }
        if (koMatchCount > requiredMatches) {
            return ValidationResult.invalid("Bracket KnockOut với " + approvedPlayers + " người chơi chỉ được " + requiredMatches
                    + " trận (bracket size " + bracketSize + "), nhưng hiện có " + koMatchCount + " trận.");
        }
        return ValidationResult.valid();
    }

    private static int nextPowerOf2(int n) {
        if (n <= 1) return 1;
        int p = 1;
        while (p < n) p *= 2;
        return p;
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
        if (state == null || state.getStepStatuses() == null
                || !"FINALIZED".equalsIgnoreCase(state.getStepStatuses().get("SCHEDULE"))) {
            return ValidationResult.invalid("Bạn cần hoàn tất bước Schedule (Finalize Schedule) trước khi Finalize bước Referee.");
        }
        int assignedCount = setupDAO.getAssignedRefereeCount(tournamentId);
        if (assignedCount == 0) {
            return ValidationResult.invalid("Vui lòng phân công ít nhất một trọng tài cho các trận đấu trước khi Finalize.");
        }
        return ValidationResult.valid();
    }

    private ValidationResult validateRoundRobinStructureLimits(int tournamentId, String format, List<TournamentSetupMatchDTO> matches) {
        if (!"RoundRobin".equals(format)) {
            return ValidationResult.valid();
        }

        int approvedPlayers = setupDAO.getParticipantUserIds(tournamentId).size();
        if (approvedPlayers <= 0) {
            return ValidationResult.invalid("Không thể tính giới hạn Round Robin vì chưa có người chơi đã duyệt.");
        }

        int maxRounds = approvedPlayers % 2 == 0 ? approvedPlayers - 1 : approvedPlayers;
        int maxMatchesPerRound = approvedPlayers % 2 == 0 ? approvedPlayers / 2 : (approvedPlayers - 1) / 2;
        int maxTotalMatches = approvedPlayers * (approvedPlayers - 1) / 2;

        java.util.Set<Integer> rounds = new java.util.HashSet<>();
        java.util.Map<Integer, Integer> matchesByRound = new java.util.HashMap<>();
        int totalMatches = 0;

        for (TournamentSetupMatchDTO match : matches) {
            String stage = String.valueOf(match.getStage() == null ? format : match.getStage()).trim();
            if (!"RoundRobin".equalsIgnoreCase(stage) && !"Round Robin".equalsIgnoreCase(stage)) {
                continue;
            }
            int roundIndex = match.getRoundIndex() == null ? 1 : match.getRoundIndex();
            rounds.add(roundIndex);
            matchesByRound.merge(roundIndex, 1, Integer::sum);
            totalMatches++;
        }

        if (rounds.size() > maxRounds) {
            return ValidationResult.invalid("Round Robin chỉ được tối đa " + maxRounds + " round với " + approvedPlayers + " người chơi đã duyệt, nhưng hiện có " + rounds.size() + " round.");
        }
        for (Map.Entry<Integer, Integer> entry : matchesByRound.entrySet()) {
            if (entry.getValue() > maxMatchesPerRound) {
                return ValidationResult.invalid("Round " + entry.getKey() + " chỉ được tối đa " + maxMatchesPerRound + " trận với " + approvedPlayers + " người chơi đã duyệt, nhưng hiện có " + entry.getValue() + " trận.");
            }
        }
        if (totalMatches < maxTotalMatches) {
            return ValidationResult.invalid("Round Robin yêu cầu đủ " + maxTotalMatches + " trận với " + approvedPlayers + " người chơi đã duyệt (hiện mới có " + totalMatches + " trận). Vui lòng thêm đủ trận trước khi Finalize.");
        }
        if (totalMatches > maxTotalMatches) {
            return ValidationResult.invalid("Round Robin chỉ được tối đa " + maxTotalMatches + " trận với " + approvedPlayers + " người chơi đã duyệt, nhưng hiện có " + totalMatches + " trận.");
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

        public static ValidationResult invalid(String message) {
            return new ValidationResult(false, message);
        }

        public boolean isValid() { return valid; }
        public String getMessage() { return message; }
    }
}

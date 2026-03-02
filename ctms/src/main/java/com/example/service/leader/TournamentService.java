package com.example.service.leader;

import com.example.DAO.TournamentDAO;
import com.example.DAO.TournamentRefereeDAO;
import com.example.DAO.TournamentSetupDAO;
import com.example.DAO.ReportDAO;
import com.example.DAO.MatchDAO;
import com.example.model.dto.TournamentManualSetupRequestDTO;
import com.example.model.dto.TournamentDTO;
import com.example.model.dto.TournamentPlayerDTO;
import com.example.model.dto.TournamentRefereeDTO;
import com.example.model.dto.TournamentReportDTO;
import com.example.model.dto.TournamentSetupMatchDTO;
import com.example.DAO.ParticipantDAO;
import com.example.util.PasswordUtil;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class TournamentService {
    private static final String STEP_STRUCTURE = "STRUCTURE";
    private static final String STEP_PLAYERS = "PLAYERS";
    private static final String STEP_SCHEDULE = "SCHEDULE";
    private static final String STEP_COMPLETED = "COMPLETED";

    private final TournamentDAO tournamentDAO;
    private final ParticipantDAO participantDAO;
    private final TournamentRefereeDAO refereeDAO;
    private final ReportDAO reportDAO;
    private final MatchDAO matchDAO;
    private final TournamentSetupDAO setupDAO;

    public TournamentService() {
        this.tournamentDAO = new TournamentDAO();
        this.participantDAO = new ParticipantDAO();
        this.refereeDAO = new TournamentRefereeDAO();
        this.reportDAO = new ReportDAO();
        this.matchDAO = new MatchDAO();
        this.setupDAO = new TournamentSetupDAO();
    }

    public List<TournamentDTO> getAllTournamentsWithCurrentPlayers() {

        List<TournamentDTO> list = tournamentDAO.getAllTournaments();

        for (TournamentDTO t : list) {
            int count =
                participantDAO.countParticipantsByTournament(
                    t.getTournamentId()
                );

            t.setCurrentPlayers(count);
        }

        return list;
    }

    public TournamentDTO getTournamentByIdWithCurrentPlayers(int id) {
        if (id <= 0) return null;
        TournamentDTO t = tournamentDAO.getTournamentById(id);
        if (t != null) {
            int count = participantDAO.countParticipantsByTournament(id);
            t.setCurrentPlayers(count);
            t.setTournamentImages(tournamentDAO.getTournamentImages(id));
        }
        return t;
    }

    // =========================
    // PLAYERS (JOIN)
    // =========================
    public List<TournamentPlayerDTO> getPlayersByTournament(int tournamentId) {
        if (tournamentId <= 0) return List.of();
        return participantDAO.getPlayersWithUserInfo(tournamentId);
    }

    // =========================
    // REFEREES (JOIN)
    // =========================
    public List<TournamentRefereeDTO> getRefereesByTournament(int tournamentId) {
        if (tournamentId <= 0) return List.of();
        return refereeDAO.getRefereesByTournament(tournamentId);
    }

    public List<TournamentRefereeDTO> getAllRefereeUsers() {
        return refereeDAO.getAllRefereeUsers();
    }

    public boolean assignRefereeToTournament(
            int tournamentId,
            int refereeId,
            String refereeRole,
            Integer assignedBy,
            String note
    ) {
        if (tournamentId <= 0 || refereeId <= 0) return false;
        String role = (refereeRole == null || refereeRole.isBlank()) ? "Assistant" : refereeRole.trim();
        if (!"Chief".equalsIgnoreCase(role) && !"Assistant".equalsIgnoreCase(role)) {
            return false;
        }
        String normalizedRole = "Chief".equalsIgnoreCase(role) ? "Chief" : "Assistant";
        return refereeDAO.assignReferee(tournamentId, refereeId, normalizedRole, assignedBy, note);
    }

    public boolean removeRefereeFromTournament(int tournamentId, int refereeId) {
        if (tournamentId <= 0 || refereeId <= 0) return false;
        return refereeDAO.removeReferee(tournamentId, refereeId);
    }

    public boolean updateTournamentCoverImage(int tournamentId, String imageUrl) {
        if (tournamentId <= 0) return false;
        return tournamentDAO.updateTournamentCoverImage(tournamentId, imageUrl);
    }

    public boolean addTournamentDetailImage(int tournamentId, String imageUrl) {
        if (tournamentId <= 0 || isBlank(imageUrl)) return false;
        return tournamentDAO.addTournamentDetailImage(tournamentId, imageUrl.trim());
    }

    public boolean deleteTournamentDetailImage(int tournamentId, String imageUrl) {
        if (tournamentId <= 0 || isBlank(imageUrl)) return false;
        return tournamentDAO.deleteTournamentDetailImage(tournamentId, imageUrl.trim());
    }

    public boolean saveTournamentImages(int tournamentId, String coverImageUrl, List<String> detailImages) {
        if (tournamentId <= 0) return false;
        List<String> normalized = new ArrayList<>();
        if (detailImages != null) {
            for (String url : detailImages) {
                if (url == null) continue;
                String trimmed = url.trim();
                if (!trimmed.isBlank()) normalized.add(trimmed);
            }
        }
        String normalizedCover = coverImageUrl == null || coverImageUrl.isBlank()
                ? null
                : coverImageUrl.trim();
        return tournamentDAO.saveTournamentImages(tournamentId, normalizedCover, normalized);
    }

    public TournamentRefereeDTO createRefereeUser(
            String firstName,
            String lastName,
            String email,
            String phoneNumber,
            String address
    ) {
        if (isBlank(firstName) || isBlank(lastName) || isBlank(email) || isBlank(phoneNumber)) {
            return null;
        }

        String normalizedEmail = email.trim();
        String normalizedPhone = phoneNumber.trim();
        String normalizedAddress = address == null ? null : address.trim();

        // Dung email local-part lam username de tao nhanh tai khoan trong he thong.
        String username = normalizedEmail.contains("@")
                ? normalizedEmail.substring(0, normalizedEmail.indexOf('@'))
                : normalizedEmail;
        if (username.length() > 50) {
            username = username.substring(0, 50);
        }

        // Mat khau mac dinh theo yeu cau, duoc hash theo chuan he thong.
        String temporaryPassword = "12345";
        String hashedPassword = PasswordUtil.hashPassword(temporaryPassword);

        return refereeDAO.createRefereeUser(
                firstName.trim(),
                lastName.trim(),
                normalizedEmail,
                normalizedPhone,
                normalizedAddress,
                username,
                hashedPassword
        );
    }

    // =========================
    // REPORTS (JOIN)
    // =========================
    public List<TournamentReportDTO> getReportsByTournament(int tournamentId) {
        if (tournamentId <= 0) return List.of();
        return reportDAO.getReportsByTournament(tournamentId);
    }

    public List<Map<String, Object>> getUpcomingMatchesByTournament(int tournamentId) {
        if (tournamentId <= 0) return List.of();
        return matchDAO.getUpcomingMatchesByTournament(tournamentId);
    }

    public List<Map<String, Object>> getCompletedMatchesByTournament(int tournamentId) {
        if (tournamentId <= 0) return List.of();
        return matchDAO.getCompletedMatchesByTournament(tournamentId);
    }

    public List<Map<String, Object>> getAllPublicMatches() {
        return matchDAO.getAllPublicMatches();
    }

    public Map<String, Object> getTournamentPodium(int tournamentId) {
        if (tournamentId <= 0) return Map.of("championName", null, "runnerUpName", null);
        return tournamentDAO.getTournamentPodium(tournamentId);
    public List<TournamentSetupMatchDTO> getManualSetupMatches(int tournamentId) {
        if (tournamentId <= 0) return List.of();
        return setupDAO.getManualSetupMatches(tournamentId);
    }

    public List<?> getSetupParticipants(int tournamentId) {
        if (tournamentId <= 0) return List.of();
        return setupDAO.getParticipantUsers(tournamentId);
    }

    public String getCurrentSetupStep(int tournamentId) {
        if (tournamentId <= 0) return STEP_STRUCTURE;
        String step = normalizeSetupStep(setupDAO.getSetupStep(tournamentId));
        return step == null ? STEP_STRUCTURE : step;
    }

    public SetupValidationResult advanceSetupStep(int tournamentId, TournamentManualSetupRequestDTO request) {
        if (request == null) {
            return SetupValidationResult.invalid("Thiếu dữ liệu setup.");
        }

        String format = normalizeFormat(request.getFormat());
        if (format == null) {
            return SetupValidationResult.invalid("Thể thức không hợp lệ. Chỉ hỗ trợ RoundRobin, KnockOut, Hybrid.");
        }

        String targetStep = normalizeSetupStep(request.getSetupStep());
        if (targetStep == null) {
            return SetupValidationResult.invalid("Thiếu setupStep hợp lệ.");
        }

        List<TournamentSetupMatchDTO> matches = normalizeMatches(request.getMatches());
        String currentStep = getCurrentSetupStep(tournamentId);

        if (STEP_STRUCTURE.equals(targetStep)) {
            SetupValidationResult validStructure = validateStructureStep(format, matches);
            if (!validStructure.isValid()) return validStructure;
            boolean saved = setupDAO.replaceManualSetup(tournamentId, format, matches);
            if (!saved) return SetupValidationResult.invalid("Không thể lưu structure bracket.");
            if (!setupDAO.upsertSetupStep(tournamentId, STEP_PLAYERS)) {
                return SetupValidationResult.invalid("Không thể cập nhật setup step (PLAYERS).");
            }
            return SetupValidationResult.valid("Hoàn tất Structure. Chuyển sang Add Players.");
        }

        if (STEP_PLAYERS.equals(targetStep)) {
            if (!STEP_PLAYERS.equals(currentStep)) {
                return SetupValidationResult.invalid("Bạn cần hoàn tất Structure trước.");
            }
            SetupValidationResult validPlayers = validatePlayersStep(tournamentId, format, matches);
            if (!validPlayers.isValid()) return validPlayers;
            boolean saved = setupDAO.replaceManualSetup(tournamentId, format, matches);
            if (!saved) return SetupValidationResult.invalid("Không thể lưu Add Players.");
            if (!setupDAO.upsertSetupStep(tournamentId, STEP_SCHEDULE)) {
                return SetupValidationResult.invalid("Không thể cập nhật setup step (SCHEDULE).");
            }
            return SetupValidationResult.valid("Hoàn tất Add Players. Chuyển sang Schedule.");
        }

        return SetupValidationResult.invalid("setupStep không hợp lệ cho API advance.");
    }

    public SetupValidationResult saveManualSetup(int tournamentId, TournamentManualSetupRequestDTO request) {
        if (request == null) {
            return SetupValidationResult.invalid("Thiếu dữ liệu setup.");
        }
        String currentStep = getCurrentSetupStep(tournamentId);
        if (!STEP_SCHEDULE.equals(currentStep)) {
            return SetupValidationResult.invalid("Bạn cần hoàn tất Structure và Add Players trước khi lưu Schedule.");
        }

        String format = normalizeFormat(request.getFormat());
        if (format == null) {
            return SetupValidationResult.invalid("Thể thức không hợp lệ.");
        }

        List<TournamentSetupMatchDTO> matches = normalizeMatches(request.getMatches());
        SetupValidationResult validation = validateScheduleStep(tournamentId, format, matches);
        if (!validation.isValid()) {
            return validation;
        }

        boolean ok = setupDAO.replaceManualSetup(
                tournamentId,
                format,
                matches
        );
        if (!ok) {
            return SetupValidationResult.invalid("Không thể lưu lịch đấu. Vui lòng thử lại.");
        }
        if (!setupDAO.upsertSetupStep(tournamentId, STEP_COMPLETED)) {
            return SetupValidationResult.invalid("Lưu lịch thành công nhưng không thể cập nhật trạng thái setup.");
        }
        return SetupValidationResult.valid("Lưu setup thành công.");
    }

    // =========================
    // COUNT
    // =========================
    public int countAllTournaments() {
        return tournamentDAO.countAllTournaments();
    }

    public int countCancelledTournaments() {
        return tournamentDAO.countCancelledTournaments();
    }

    // =========================
    // CREATE
    // =========================
    public boolean createTournament(TournamentDTO t) {

        if (t == null) return false;

        // ---- REQUIRED FIELDS ----
        if (isBlank(t.getTournamentName())) return false;
        if (isBlank(t.getFormat())) return false;
        if (isBlank(t.getCategories())) return false;

        // ---- PLAYER VALIDATION ----
        if (t.getMinPlayer() < 0 || t.getMaxPlayer() < 0) return false;
        if (t.getMinPlayer() > t.getMaxPlayer()) return false;

        // ---- DEFAULT VALUES ----
        if (t.getEntryFee() == null) {
            t.setEntryFee(BigDecimal.ZERO);
        }

        if (t.getPrizePool() == null) {
            t.setPrizePool(BigDecimal.ZERO);
        }

        // create_at → DB DEFAULT
        // status → DB DEFAULT (Pending)

        return tournamentDAO.createTournament(t);
    }

    // =========================
    // READ
    // =========================
    public TournamentDTO getTournamentById(int id) {
        if (id <= 0) return null;
        return tournamentDAO.getTournamentById(id);
    }

    public List<TournamentDTO> getAllTournaments() {
        return tournamentDAO.getAllTournaments();
    }

    // =========================
    // UPDATE
    // =========================
    public boolean updateTournament(TournamentDTO t) {

        if (t == null) return false;
        if (t.getTournamentId() <= 0) return false;
if (isBlank(t.getTournamentName())) return false;
        if (t.getMinPlayer() > t.getMaxPlayer()) return false;

        return tournamentDAO.updateTournament(t);
    }

    // =========================
    // CANCEL (SOFT DELETE)
    // =========================
    public boolean cancelTournament(int tournamentId, String reason) {
        if (tournamentId <= 0) return false;
        if (reason == null || reason.trim().isEmpty()) return false;
        return tournamentDAO.cancelTournament(tournamentId, reason);
    }

    // =========================
    // DELETE (HARD DELETE)
    // =========================
    public boolean deleteTournament(int tournamentId, String reason) {
        if (tournamentId <= 0) return false;
        if (reason == null || reason.trim().isEmpty()) return false;
        return tournamentDAO.deleteTournament(tournamentId);
    }

    // DELETE - backward compatible
    public boolean deleteTournament(int tournamentId) {
        if (tournamentId <= 0) return false;
        return tournamentDAO.deleteTournament(tournamentId);
    }

    // =========================
    // UTIL
    // =========================
    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private SetupValidationResult validateStructureStep(String format, List<TournamentSetupMatchDTO> matches) {
        if (matches.isEmpty()) {
            return SetupValidationResult.invalid("Bạn chưa dựng structure bracket.");
        }

        boolean hasRoundRobinStage = false;
        boolean hasKnockOutStage = false;
        for (TournamentSetupMatchDTO m : matches) {
            String stage = normalizeStage(m.getStage(), format);
            if ("RoundRobin".equals(stage)) hasRoundRobinStage = true;
            if ("KnockOut".equals(stage)) hasKnockOutStage = true;

            if (m.getRoundIndex() == null || m.getRoundIndex() <= 0) {
                return SetupValidationResult.invalid("Round index phải >= 1.");
            }
            if (m.getBoardNumber() != null && m.getBoardNumber() <= 0) {
                return SetupValidationResult.invalid("Board number phải >= 1.");
            }

            if ("RoundRobin".equals(format) && !"RoundRobin".equals(stage)) {
                return SetupValidationResult.invalid("Thể thức Round Robin chỉ được xếp stage Round Robin.");
            }
            if ("KnockOut".equals(format) && !"KnockOut".equals(stage)) {
                return SetupValidationResult.invalid("Thể thức Knock Out chỉ được xếp stage Knock Out.");
            }
        }

        if ("Hybrid".equals(format)) {
            if (!hasRoundRobinStage || !hasKnockOutStage) {
                return SetupValidationResult.invalid("Hybrid bắt buộc có cả 2 stage: Round Robin trước, rồi Knock Out.");
            }
            int firstKoIndex = firstIndexOfStage(matches, "KnockOut");
            int lastRrIndex = lastIndexOfStage(matches, "RoundRobin");
            if (firstKoIndex >= 0 && lastRrIndex >= 0 && firstKoIndex < lastRrIndex) {
                return SetupValidationResult.invalid("Hybrid phải xếp Round Robin trước rồi mới Knock Out.");
            }
        }
        return SetupValidationResult.valid("Structure hợp lệ.");
    }

    private SetupValidationResult validatePlayersStep(int tournamentId, String format, List<TournamentSetupMatchDTO> matches) {
        SetupValidationResult validStructure = validateStructureStep(format, matches);
        if (!validStructure.isValid()) return validStructure;

        Set<Integer> participantIds = setupDAO.getParticipantUserIds(tournamentId);
        int participantCount = participantIds.size();
        if (!checkPlayerCountByFormat(format, participantCount)) {
            return SetupValidationResult.invalid(playerCountErrorMessage(format));
        }

        Set<String> roundRobinPairs = new HashSet<>();
        Set<String> koRoundPlayerSlots = new HashSet<>();

        for (TournamentSetupMatchDTO m : matches) {
            String stage = normalizeStage(m.getStage(), format);
            Integer white = m.getWhitePlayerId();
            Integer black = m.getBlackPlayerId();
            int roundIndex = m.getRoundIndex() == null ? 1 : m.getRoundIndex();

            if (white != null && !participantIds.contains(white)) {
                return SetupValidationResult.invalid("Có người chơi trắng không thuộc danh sách đã duyệt.");
            }
            if (black != null && !participantIds.contains(black)) {
                return SetupValidationResult.invalid("Có người chơi đen không thuộc danh sách đã duyệt.");
            }
            if (white != null && black != null && white.equals(black)) {
                return SetupValidationResult.invalid("Một trận không thể có cùng 1 người chơi ở 2 bên.");
            }

            if ("RoundRobin".equals(stage)) {
                if (white == null || black == null) {
                    return SetupValidationResult.invalid("Round Robin yêu cầu đủ 2 người chơi cho mọi trận.");
                }
                String key = toPairKey(white, black);
                if (!roundRobinPairs.add(key)) {
                    return SetupValidationResult.invalid("Cặp đấu Round Robin bị trùng.");
                }
                continue;
            }

            if (white != null) {
                String wKey = roundIndex + "::" + white;
                if (!koRoundPlayerSlots.add(wKey)) {
                    return SetupValidationResult.invalid("Một người chơi đang bị xếp 2 trận trong cùng round Knock Out.");
                }
            }
            if (black != null) {
                String bKey = roundIndex + "::" + black;
                if (!koRoundPlayerSlots.add(bKey)) {
                    return SetupValidationResult.invalid("Một người chơi đang bị xếp 2 trận trong cùng round Knock Out.");
                }
            }
        }
        return SetupValidationResult.valid("Add Players hợp lệ.");
    }

    private SetupValidationResult validateScheduleStep(int tournamentId, String format, List<TournamentSetupMatchDTO> matches) {
        SetupValidationResult validPlayers = validatePlayersStep(tournamentId, format, matches);
        if (!validPlayers.isValid()) return validPlayers;

        for (TournamentSetupMatchDTO m : matches) {
            // Chỉ bắt buộc startTime cho các trận đã có đủ 2 người chơi.
            if (m.getWhitePlayerId() != null && m.getBlackPlayerId() != null && m.getStartTime() == null) {
                return SetupValidationResult.invalid("Các trận đã có đủ 2 người chơi phải có start time.");
            }
        }
        return SetupValidationResult.valid("Schedule hợp lệ.");
    }

    private List<TournamentSetupMatchDTO> normalizeMatches(List<TournamentSetupMatchDTO> matches) {
        if (matches == null) return List.of();
        List<TournamentSetupMatchDTO> normalized = new ArrayList<>();
        for (TournamentSetupMatchDTO m : matches) {
            if (m == null) continue;
            TournamentSetupMatchDTO copy = new TournamentSetupMatchDTO();
            copy.setStage(normalizeStage(m.getStage(), null));
            copy.setRoundName(m.getRoundName());
            copy.setRoundIndex(m.getRoundIndex() == null || m.getRoundIndex() <= 0 ? 1 : m.getRoundIndex());
            copy.setBoardNumber(m.getBoardNumber() == null || m.getBoardNumber() <= 0 ? null : m.getBoardNumber());
            copy.setWhitePlayerId(m.getWhitePlayerId());
            copy.setBlackPlayerId(m.getBlackPlayerId());
            copy.setStartTime(normalizeTimestamp(m.getStartTime()));
            normalized.add(copy);
        }
        return normalized;
    }

    private Timestamp normalizeTimestamp(Timestamp ts) {
        return ts;
    }

    private String normalizeFormat(String format) {
        if (format == null) return null;
        String f = format.trim();
        if ("RoundRobin".equalsIgnoreCase(f) || "Round Robin".equalsIgnoreCase(f)) return "RoundRobin";
        if ("KnockOut".equalsIgnoreCase(f) || "Knock Out".equalsIgnoreCase(f)) return "KnockOut";
        if ("Hybrid".equalsIgnoreCase(f)) return "Hybrid";
        return null;
    }

    private String normalizeSetupStep(String step) {
        if (step == null) return null;
        String s = step.trim().toUpperCase();
        if (STEP_STRUCTURE.equals(s)) return STEP_STRUCTURE;
        if (STEP_PLAYERS.equals(s)) return STEP_PLAYERS;
        if (STEP_SCHEDULE.equals(s)) return STEP_SCHEDULE;
        if (STEP_COMPLETED.equals(s)) return STEP_COMPLETED;
        return null;
    }

    private String normalizeStage(String stage, String fallbackFormat) {
        if (stage != null) {
            if ("RoundRobin".equalsIgnoreCase(stage) || "Round Robin".equalsIgnoreCase(stage)) return "RoundRobin";
            if ("KnockOut".equalsIgnoreCase(stage) || "Knock Out".equalsIgnoreCase(stage)) return "KnockOut";
        }
        if ("RoundRobin".equalsIgnoreCase(fallbackFormat)) return "RoundRobin";
        return "KnockOut";
    }

    private boolean checkPlayerCountByFormat(String format, int count) {
        if ("RoundRobin".equals(format)) {
            return count >= 4 && count <= 10;
        }
        if ("KnockOut".equals(format)) {
            return count >= 8 && count <= 32;
        }
        if ("Hybrid".equals(format)) {
            return count >= 8 && count <= 32;
        }
        return false;
    }

    private String playerCountErrorMessage(String format) {
        if ("RoundRobin".equals(format)) {
            return "Round Robin yêu cầu tối thiểu 4 và tối đa 10 người chơi đã duyệt.";
        }
        if ("KnockOut".equals(format)) {
            return "Knock Out yêu cầu tối thiểu 8 và tối đa 32 người chơi đã duyệt.";
        }
        if ("Hybrid".equals(format)) {
            return "Hybrid yêu cầu tối thiểu 8 và tối đa 32 người chơi đã duyệt.";
        }
        return "Số lượng người chơi không hợp lệ.";
    }

    private String toPairKey(int a, int b) {
        int min = Math.min(a, b);
        int max = Math.max(a, b);
        return min + "::" + max;
    }

    private int firstIndexOfStage(List<TournamentSetupMatchDTO> matches, String stage) {
        for (int i = 0; i < matches.size(); i++) {
            if (stage.equals(normalizeStage(matches.get(i).getStage(), null))) {
                return i;
            }
        }
        return -1;
    }

    private int lastIndexOfStage(List<TournamentSetupMatchDTO> matches, String stage) {
        for (int i = matches.size() - 1; i >= 0; i--) {
            if (stage.equals(normalizeStage(matches.get(i).getStage(), null))) {
                return i;
            }
        }
        return -1;
    }

    public static class SetupValidationResult {
        private final boolean valid;
        private final String message;

        private SetupValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }

        public static SetupValidationResult valid(String message) {
            return new SetupValidationResult(true, message);
        }

        public static SetupValidationResult invalid(String message) {
            return new SetupValidationResult(false, message);
        }

        public boolean isValid() {
            return valid;
        }

        public String getMessage() {
            return message;
        }
    }
}

package com.example.service.leader;

import com.example.DAO.NotificationDAO;
import com.example.DAO.RefereeInvitationDAO;
import com.example.DAO.StandingDAO;
import com.example.DAO.TournamentDAO;
import com.example.DAO.TournamentRefereeDAO;
import com.example.DAO.ReportDAO;
import com.example.DAO.MatchDAO;
import com.example.DAO.TournamentSetupDAO;
import com.example.DAO.PaymentDAO;
import com.example.DAO.UserDAO;
import com.example.util.EmailUtil;
import com.example.model.dto.TournamentManualSetupRequestDTO;
import com.example.model.dto.TournamentSetupMatchDTO;
import com.example.model.dto.TournamentDTO;
import com.example.model.dto.TournamentPlayerDTO;
import com.example.model.dto.TournamentRefereeDTO;
import com.example.model.dto.TournamentReportDTO;
import com.example.model.dto.TournamentSetupStateDTO;
import com.example.model.enums.SetupStep;
import com.example.model.entity.Participant;
import com.example.model.enums.ParticipantStatus;
import com.example.DAO.ParticipantDAO;
import com.example.DAO.PrizeTemplateDAO;
import com.example.model.entity.PrizeTemplate;
import com.example.util.PasswordUtil;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service chính cho giải đấu: CRUD, players, referees, reports, setup wizard.
 * Setup flow: Structure → Players → Schedule → Referee → COMPLETED.
 * Dùng TournamentSetupService cho finalize/unlock; dùng TournamentSetupDAO cho persist.
 */
public class TournamentService {
    private static final String STEP_STRUCTURE = "STRUCTURE";
    private static final String STEP_PLAYERS = "PLAYERS";
    private static final String STEP_SCHEDULE = "SCHEDULE";
    private static final String STEP_REFEREE = "REFEREE";
    private static final String STEP_COMPLETED = "COMPLETED";

    private final TournamentDAO tournamentDAO;
    private final ParticipantDAO participantDAO;
    private final TournamentRefereeDAO refereeDAO;
    private final UserDAO userDAO;
    private final PaymentDAO paymentDAO;
    private final RefereeInvitationDAO invitationDAO;
    private final ReportDAO reportDAO;
    private final MatchDAO matchDAO;
    private final TournamentSetupDAO setupDAO;
    private final PrizeTemplateDAO prizeTemplateDAO;
    private final NotificationDAO notificationDAO;
    private final StandingDAO standingDAO;
    

    public TournamentService() {
        this.tournamentDAO = new TournamentDAO();
        this.participantDAO = new ParticipantDAO();
        this.refereeDAO = new TournamentRefereeDAO();
        this.invitationDAO = new RefereeInvitationDAO();
        this.reportDAO = new ReportDAO();
        this.matchDAO = new MatchDAO();
        this.setupDAO = new TournamentSetupDAO();
        this.prizeTemplateDAO = new PrizeTemplateDAO();
        this.notificationDAO = new NotificationDAO();
        this.userDAO = new UserDAO();
        this.paymentDAO = new PaymentDAO();
        this.standingDAO = new StandingDAO();
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

    public List<TournamentDTO> getTournamentsByCreatorWithCurrentPlayers(int creatorId) {
        if (creatorId <= 0) return List.of();

        List<TournamentDTO> list = tournamentDAO.getTournamentsByCreator(creatorId);

        for (TournamentDTO t : list) {
            int count = participantDAO.countParticipantsByTournament(t.getTournamentId());
            t.setCurrentPlayers(count);
        }

        return list;
    }

    public TournamentDTO getTournamentByIdWithCurrentPlayers(int id) {
        if (id <= 0) return null;
        TournamentDTO t = tournamentDAO.getTournamentById(id);
        if (t != null) {
            t.setCurrentPlayers(participantDAO.countParticipantsByTournament(id));
            t.setTournamentImages(tournamentDAO.getTournamentImages(id));
            t.setBracketPublished(tournamentDAO.isBracketPublished(id));
            t.setPrizeTiers(prizeTemplateDAO.getByTournamentId(id));
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

    /**
     * Referees available to invite for this tournament: exclude those already assigned
     * to any tournament whose period overlaps with this one (start_date..end_date).
     */
    public List<TournamentRefereeDTO> getAvailableRefereesForTournament(int tournamentId) {
        if (tournamentId <= 0) return List.of();
        return refereeDAO.getAvailableRefereesForTournament(tournamentId);
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
        boolean ok = refereeDAO.assignReferee(tournamentId, refereeId, normalizedRole, assignedBy, note);
        if (ok) {
            try {
                TournamentDTO t = tournamentDAO.getTournamentById(tournamentId);
                String tName = t != null ? t.getTournamentName() : "giải đấu #" + tournamentId;
                com.example.model.entity.Notification n = new com.example.model.entity.Notification();
                n.setUserId(refereeId);
                n.setType("Tournament");
                n.setTitle("Bạn được giao làm trọng tài giải đấu");
                n.setMessage("Bạn đã được chỉ định làm trọng tài (" + normalizedRole + ") cho giải đấu '" + tName + "'.");
                n.setActionUrl("/referee/matches");
                notificationDAO.createNotification(n);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return ok;
    }

    public boolean removeRefereeFromTournament(int tournamentId, int refereeId) {
        if (tournamentId <= 0 || refereeId <= 0) return false;
        return refereeDAO.removeReferee(tournamentId, refereeId);
    }

    public List<Map<String, Object>> getRefereeInvitations(int tournamentId) {
        if (tournamentId <= 0) return List.of();
        invitationDAO.expireOldInvitations();
        sendPendingReminders();
        return invitationDAO.getPendingByTournament(tournamentId);
    }

    public void sendPendingReminders() {
        for (Map<String, Object> inv : invitationDAO.getPendingNeeding24hReminder()) {
            String email = (String) inv.get("invitedEmail");
            String tournamentName = (String) inv.get("tournamentName");
            String inviterName = (String) inv.get("inviterName");
            if (email != null && !email.isBlank()) {
                EmailUtil.sendRefereeInviteReminder(email, tournamentName, inviterName, false);
                invitationDAO.updateLastReminderAt((Integer) inv.get("invitationId"));
            }
        }
        for (Map<String, Object> inv : invitationDAO.getPendingNeeding48hReminder()) {
            String email = (String) inv.get("invitedEmail");
            String tournamentName = (String) inv.get("tournamentName");
            String inviterName = (String) inv.get("inviterName");
            if (email != null && !email.isBlank()) {
                EmailUtil.sendRefereeInviteReminder(email, tournamentName, inviterName, true);
                invitationDAO.updateLastReminderAt((Integer) inv.get("invitationId"));
            }
        }
    }

    /**
     * Gửi lời mời trọng tài theo email.
     * Chỉ chặn khi cùng một giải đã có lời mời pending cho email đó (-1).
     * Trọng tài chưa accept lời mời từ giải khác thì tournament leader giải khác vẫn được mời (tạo invitation mới).
     */
    public int inviteRefereeByEmail(int tournamentId, String email, String refereeRole, int invitedBy) {
        if (tournamentId <= 0 || isBlank(email) || invitedBy <= 0) return 0;
        if (invitationDAO.hasPendingForEmail(tournamentId, email)) return -1; // chỉ trùng cùng giải
        return invitationDAO.createInvitation(tournamentId, email, refereeRole, invitedBy);
    }

    public boolean resendRefereeInvite(int invitationId, int invitedBy) {
        if (invitationId <= 0) return false;
        return invitationDAO.resendInvite(invitationId, invitedBy);
    }

    public boolean replaceRefereeInvite(int invitationId, String newEmail, String refereeRole, int invitedBy) {
        if (invitationId <= 0 || isBlank(newEmail)) return false;
        return invitationDAO.replaceInvite(invitationId, newEmail, refereeRole, invitedBy);
    }

    public boolean removePendingInvitation(int invitationId) {
        if (invitationId <= 0) return false;
        return invitationDAO.removePending(invitationId);
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

    /**
     * Returns a user-friendly message if email or phone is already used, or null if neither.
     */
    public String checkRefereeDuplicateMessage(String email, String phone) {
        if (email == null || phone == null) return null;
        String dup = refereeDAO.findDuplicateEmailOrPhone(email.trim(), phone.trim());
        if ("email".equals(dup)) return "Email này đã được sử dụng.";
        if ("phone".equals(dup)) return "Số điện thoại này đã được sử dụng.";
        return null;
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
    }

    public List<Map<String, Object>> getStandingsByTournament(int tournamentId) {
        if (tournamentId <= 0) return List.of();
        return standingDAO.getStandingsByTournament(tournamentId);
    }

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

    /**
     * Advance step (legacy): Structure → Players hoặc Players → Schedule.
     * Không dùng finalize; chỉ lưu dữ liệu và cập nhật current_step.
     */
    public SetupValidationResult advanceSetupStep(int tournamentId, TournamentManualSetupRequestDTO request) {
        if (request == null) {
            return SetupValidationResult.invalid("Thiếu dữ liệu setup.");
        }

        String format = normalizeFormat(request.getFormat());
        if (format == null) {
            return SetupValidationResult.invalid("Thể thức không hợp lệ. Chỉ hỗ trợ RoundRobin, KnockOut.");
        }

        String targetStep = normalizeSetupStep(request.getSetupStep());
        if (targetStep == null) {
            return SetupValidationResult.invalid("Thiếu setupStep hợp lệ.");
        }

        List<TournamentSetupMatchDTO> matches = normalizeMatches(request.getMatches(), format);
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

        List<TournamentSetupMatchDTO> matches = normalizeMatches(request.getMatches(), format);
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
        if (!setupDAO.upsertSetupStep(tournamentId, STEP_REFEREE)) {
            return SetupValidationResult.invalid("Lưu lịch thành công nhưng không thể cập nhật trạng thái setup.");
        }
        return SetupValidationResult.valid("Lưu lịch thành công. Chuyển sang bước Select Referee.");
    }

    /**
     * Lưu gán trọng tài cho các trận: validate Schedule đã FINALIZED → updateMatchReferees → current_step = COMPLETED.
     * Chỉ chấp nhận referee đã được thêm vào giải (Tournament_Referee).
     */
    public SetupValidationResult saveRefereeAssignments(int tournamentId, List<TournamentSetupMatchDTO> matches) {
        if (tournamentId <= 0) {
            return SetupValidationResult.invalid("Tournament id không hợp lệ.");
        }
        setupDAO.ensureSetupStateRow(tournamentId);
        TournamentSetupStateDTO state = setupDAO.getSetupStateFull(tournamentId);
        if (state == null) {
            return SetupValidationResult.invalid("Không thể tải trạng thái setup. Vui lòng thử lại.");
        }
        Map<String, String> statuses = state.getStepStatuses();
        if (statuses == null) statuses = Map.of();
        String scheduleStatus = statuses.get("SCHEDULE");
        String stateStep = state.getCurrentStep();
        // Dùng một nguồn state duy nhất (TournamentSetupStateDTO) - không dùng getCurrentSetupStep()
        boolean scheduleFinalized = "FINALIZED".equalsIgnoreCase(scheduleStatus);
        if (!scheduleFinalized) {
            // Đã ở bước Referee (REFEREE/REFEREES) hoặc COMPLETED nghĩa là Schedule đã hoàn tất
            String step = stateStep != null ? stateStep.trim().toUpperCase() : "";
            if ("REFEREE".equals(step) || "REFEREES".equals(step) || "COMPLETED".equals(step)) {
                scheduleFinalized = true;
            }
        }
        if (!scheduleFinalized) {
            return SetupValidationResult.invalid("Bạn cần hoàn tất Schedule (nhấn Finalize Schedule) trước khi gán trọng tài.");
        }
        String step = stateStep != null ? stateStep.trim().toUpperCase() : "";
        if (!"REFEREE".equals(step) && !"REFEREES".equals(step) && !"COMPLETED".equals(step)) {
            setupDAO.upsertSetupStep(tournamentId, SetupStep.REFEREES.toDbValue());
        }
        if (matches == null) {
            matches = List.of();
        }
        Set<Integer> allowedRefereeIds = new HashSet<>();
        for (TournamentRefereeDTO r : refereeDAO.getRefereesByTournament(tournamentId)) {
            allowedRefereeIds.add(r.getRefereeId());
        }
        for (TournamentSetupMatchDTO m : matches) {
            Integer refId = m.getRefereeId();
            if (refId == null || refId <= 0) continue;
            if (!allowedRefereeIds.contains(refId)) {
                return SetupValidationResult.invalid("Trọng tài (ID " + refId + ") chưa được thêm vào giải. Vào tab Referees để thêm trọng tài trước.");
            }
        }
        // Kiểm tra trọng tài trùng lịch: cùng refereeId, cùng startTime
        Map<Integer, Set<String>> refTimeMap = new java.util.HashMap<>();
        for (TournamentSetupMatchDTO m : matches) {
            Integer refId = m.getRefereeId();
            if (refId == null || refId <= 0 || m.getStartTime() == null) continue;
            String timeKey = m.getStartTime().toString();
            Set<String> times = refTimeMap.computeIfAbsent(refId, k -> new java.util.HashSet<>());
            if (!times.add(timeKey)) {
                return SetupValidationResult.invalid(
                    "Trọng tài (ID " + refId + ") bị phân công 2 trận cùng giờ (" + timeKey + "). Vui lòng phân công lại.");
            }
        }
        boolean ok = setupDAO.updateMatchReferees(tournamentId, matches);
        if (!ok) {
            return SetupValidationResult.invalid("Không thể lưu gán trọng tài. Kiểm tra match_id có tồn tại trong giải không.");
        }
        if (!setupDAO.upsertSetupStep(tournamentId, SetupStep.COMPLETED.toDbValue())) {
            return SetupValidationResult.invalid("Lưu trọng tài thành công nhưng không thể cập nhật trạng thái setup.");
        }
        // Notify each unique referee assigned to matches
        try {
            TournamentDTO t = tournamentDAO.getTournamentById(tournamentId);
            String tName = t != null ? t.getTournamentName() : "giải đấu #" + tournamentId;
            Set<Integer> notifiedReferees = new HashSet<>();
            for (TournamentSetupMatchDTO m : matches) {
                Integer refId = m.getRefereeId();
                if (refId == null || refId <= 0 || notifiedReferees.contains(refId)) continue;
                notifiedReferees.add(refId);
                com.example.model.entity.Notification n = new com.example.model.entity.Notification();
                n.setUserId(refId);
                n.setType("Match");
                n.setTitle("Bạn được giao trọng tài trận đấu");
                n.setMessage("Bạn đã được phân công làm trọng tài cho các trận trong giải đấu '" + tName + "'.");
                n.setActionUrl("/referee/matches");
                notificationDAO.createNotification(n);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return SetupValidationResult.valid("Lưu và công bố giải đấu thành công.");
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

    /** Kết quả tạo giải đấu: tournamentId, success, errorMessage. */
    public static class CreateTournamentResult {
        private final Integer tournamentId;
        private final boolean success;
        private final String errorMessage;

        private CreateTournamentResult(Integer tournamentId, boolean success, String errorMessage) {
            this.tournamentId = tournamentId;
            this.success = success;
            this.errorMessage = errorMessage;
        }

        public static CreateTournamentResult ok(int tournamentId) {
            return new CreateTournamentResult(tournamentId, true, null);
        }

        public static CreateTournamentResult error(String message) {
            return new CreateTournamentResult(null, false, message);
        }

        public Integer getTournamentId() { return tournamentId; }
        public boolean isSuccess() { return success; }
        public String getErrorMessage() { return errorMessage; }
    }

    /**
     * Tạo giải đấu. Nếu prizePool > 0, sẽ trừ tiền từ ví leader.
     * Trả về CreateTournamentResult để phân biệt lỗi validation và thiếu tiền.
     */
    public CreateTournamentResult createTournamentWithWallet(TournamentDTO t) {

        if (t == null) return CreateTournamentResult.error("Dữ liệu giải đấu không hợp lệ.");

        // ---- REQUIRED FIELDS ----
        if (isBlank(t.getTournamentName())) return CreateTournamentResult.error("Tên giải đấu không được trống.");
        if (isBlank(t.getFormat())) return CreateTournamentResult.error("Thể thức không được trống.");

        // ---- PLAYER VALIDATION ----
        if (t.getMinPlayer() == null || t.getMaxPlayer() == null) return CreateTournamentResult.error("Số lượng người chơi không hợp lệ.");
        if (t.getMinPlayer() < 0 || t.getMaxPlayer() < 0) return CreateTournamentResult.error("Số lượng người chơi không hợp lệ.");
        if (t.getMinPlayer() > t.getMaxPlayer()) return CreateTournamentResult.error("Số người chơi tối thiểu phải nhỏ hơn tối đa.");

        String normalizedFormat = normalizeFormat(t.getFormat());
        if (normalizedFormat == null) return CreateTournamentResult.error("Thể thức không hợp lệ. Chỉ hỗ trợ RoundRobin, KnockOut.");
        int min = t.getMinPlayer();
        int max = t.getMaxPlayer();
        if ("RoundRobin".equals(normalizedFormat)) {
            if (min < 4 || max > 8) return CreateTournamentResult.error("Round Robin: 4-8 người chơi.");
        } else if ("KnockOut".equals(normalizedFormat)) {
            if (min < 8 || max > 32) return CreateTournamentResult.error("Knock Out: 8-32 người chơi.");
        }

        // ---- DEFAULT VALUES ----
        if (t.getEntryFee() == null) {
            t.setEntryFee(BigDecimal.ZERO);
        }
        if (t.getPrizePool() == null) {
            t.setPrizePool(BigDecimal.ZERO);
        }

        // ---- KIỂM TRA SỐ DƯ VÍ LEADER ----
        BigDecimal prizePool = t.getPrizePool();
        int creatorId = t.getCreateBy();
        if (prizePool.compareTo(BigDecimal.ZERO) > 0) {
            // Lấy balance hiện tại để kiểm tra
            com.example.model.entity.User leader = userDAO.getUserById(creatorId);
            if (leader == null) {
                return CreateTournamentResult.error("Không tìm thấy tài khoản leader.");
            }
            BigDecimal balance = leader.getBalance() != null ? leader.getBalance() : BigDecimal.ZERO;
            if (balance.compareTo(prizePool) < 0) {
                return CreateTournamentResult.error(
                    "Số dư ví không đủ để tạo giải đấu. Cần " + prizePool.toPlainString()
                    + " VNĐ nhưng ví chỉ còn " + balance.toPlainString() + " VNĐ. Vui lòng nạp thêm tiền.");
            }
        }

        // ---- TẠO GIẢI ----
        Integer tournamentId = tournamentDAO.createTournament(t);
        if (tournamentId == null) {
            return CreateTournamentResult.error("Không thể tạo giải đấu. Vui lòng thử lại.");
        }

        // ---- TRỪ TIỀN LEADER ----
        if (prizePool.compareTo(BigDecimal.ZERO) > 0) {
            boolean deducted = paymentDAO.deductBalanceForTournamentCreation(creatorId, tournamentId, prizePool);
            if (!deducted) {
                // Rollback: xóa giải vừa tạo
                tournamentDAO.deleteTournament(tournamentId);
                return CreateTournamentResult.error(
                    "Không thể trừ tiền từ ví. Số dư không đủ hoặc có lỗi xảy ra. Vui lòng nạp thêm tiền và thử lại.");
            }
        }

        return CreateTournamentResult.ok(tournamentId);
    }

    /** Returns the new tournament ID, or null on failure. (Legacy - backward compatible) */
    public Integer createTournament(TournamentDTO t) {

        if (t == null) return null;

        // ---- REQUIRED FIELDS ----
        if (isBlank(t.getTournamentName())) return null;
        if (isBlank(t.getFormat())) return null;

        // ---- PLAYER VALIDATION ----
        if (t.getMinPlayer() == null || t.getMaxPlayer() == null) return null;
        if (t.getMinPlayer() < 0 || t.getMaxPlayer() < 0) return null;
        if (t.getMinPlayer() > t.getMaxPlayer()) return null;

        String normalizedFormat = normalizeFormat(t.getFormat());
        if (normalizedFormat == null) return null;
        int min = t.getMinPlayer();
        int max = t.getMaxPlayer();
        if ("RoundRobin".equals(normalizedFormat)) {
            if (min < 4 || max > 8) return null;
        } else if ("KnockOut".equals(normalizedFormat)) {
            if (min < 8 || max > 32) return null;
        }

        // ---- DEFAULT VALUES ----
        if (t.getEntryFee() == null) {
            t.setEntryFee(BigDecimal.ZERO);
        }

        if (t.getPrizePool() == null) {
            t.setPrizePool(BigDecimal.ZERO);
        }

        Integer newId = tournamentDAO.createTournament(t);
        if (newId != null) {
            try {
                notificationDAO.createNotificationsForRole(
                        "Staff",
                        "Yêu cầu tạo giải đấu mới",
                        "Tournament Leader đã gửi yêu cầu tạo giải đấu '" + t.getTournamentName() + "'. Vui lòng xem xét và phê duyệt.",
                        "Tournament",
                        "/staff/tournaments"
                );
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return newId;
    }

    public boolean savePrizeTemplates(int tournamentId, List<PrizeTemplate> templates) {
        if (tournamentId <= 0 || templates == null) return false;
        return prizeTemplateDAO.insertAll(tournamentId, templates);
    }

    public boolean replacePrizeTemplates(int tournamentId, List<PrizeTemplate> templates) {
        if (tournamentId <= 0) return false;
        prizeTemplateDAO.deleteByTournamentId(tournamentId);
        if (templates == null || templates.isEmpty()) return true;
        return prizeTemplateDAO.insertAll(tournamentId, templates);
    }

    // =========================
    // READ
    // =========================
    public TournamentDTO getTournamentById(int id) {
        if (id <= 0) return null;
        return tournamentDAO.getTournamentById(id);
    }

    public boolean isTournamentOwnedBy(int tournamentId, int creatorId) {
        if (tournamentId <= 0 || creatorId <= 0) return false;
        TournamentDTO tournament = tournamentDAO.getTournamentById(tournamentId);
        return tournament != null && creatorId == tournament.getCreateBy();
    }

    public List<TournamentDTO> getAllTournaments() {
        return tournamentDAO.getAllTournaments();
    }

    public boolean isBracketPublished(int tournamentId) {
        if (tournamentId <= 0) return false;
        return tournamentDAO.isBracketPublished(tournamentId);
    }

    /** Lưu tạm lịch thi đấu (schedule) mà không thay đổi trạng thái bước. */
    public SetupValidationResult saveScheduleDraft(int tournamentId, TournamentManualSetupRequestDTO request) {
        if (tournamentId <= 0) return SetupValidationResult.invalid("Tournament id không hợp lệ.");
        if (request == null) return SetupValidationResult.invalid("Thiếu dữ liệu.");
        String format = getNormalizedFormat(request.getFormat());
        if (format == null) return SetupValidationResult.invalid("Thể thức không hợp lệ.");
        List<TournamentSetupMatchDTO> matches = normalizeMatchesInternal(request.getMatches(), format);
        if (matches.isEmpty()) return SetupValidationResult.invalid("Chưa có trận đấu nào để lưu.");
        boolean saved = setupDAO.replaceManualSetup(tournamentId, format, matches);
        return saved ? SetupValidationResult.valid("Lưu tạm lịch thành công.") : SetupValidationResult.invalid("Không thể lưu tạm lịch.");
    }

    public SetupValidationResult publishBracket(int tournamentId) {
        if (tournamentId <= 0) {
            return SetupValidationResult.invalid("Tournament id không hợp lệ.");
        }

        TournamentSetupStateDTO state = setupDAO.getSetupStateFull(tournamentId);
        Map<String, String> statuses = state != null && state.getStepStatuses() != null
                ? state.getStepStatuses()
                : Map.of();
        if (!"FINALIZED".equalsIgnoreCase(statuses.get("REFEREES"))) {
            return SetupValidationResult.invalid("Chỉ được publish sau khi hoàn tất Step 4 - Referee.");
        }

        List<TournamentSetupMatchDTO> matches = setupDAO.getManualSetupMatches(tournamentId);
        if (matches.isEmpty()) {
            return SetupValidationResult.invalid("Bracket chưa có trận đấu để publish.");
        }

        if (!tournamentDAO.publishBracket(tournamentId)) {
            return SetupValidationResult.invalid("Không thể publish bracket. Hãy kiểm tra migration trạng thái Bracket trước khi thử lại.");
        }

        return SetupValidationResult.valid("Publish bracket thành công.");
    }

    // =========================
    // UPDATE
    // =========================
    public boolean updateTournament(TournamentDTO t) {

        if (t == null) return false;
        if (t.getTournamentId() <= 0) return false;
        if (isBlank(t.getTournamentName())) return false;
        if (t.getMinPlayer() == null || t.getMaxPlayer() == null) return false;
        if (t.getMinPlayer() > t.getMaxPlayer()) return false;

        TournamentDTO existing = tournamentDAO.getTournamentById(t.getTournamentId());
        if (existing == null) return false;
        String status = existing.getStatus();
        if (!java.util.List.of("Pending", "Rejected", "Cancelled").contains(status)) return false;

        return tournamentDAO.updateTournament(t);
    }

    // =========================
    // CANCEL (SOFT DELETE) + REFUND
    // =========================
    /**
     * Hủy giải đấu và hoàn tiền:
     * - Hoàn prizePool cho leader (nếu prizePool > 0)
     * - Hoàn entryFee cho tất cả người chơi đã thanh toán (nếu entryFee > 0)
     */
    // =========================
    // COMPLETE TOURNAMENT + DISTRIBUTE PRIZES
    // =========================
    /**
     * Leader kết thúc giải thủ công.
     * Điều kiện: giải đang Ongoing, tất cả trận đã Completed/Cancelled.
     * Sau khi kết thúc: cập nhật standings, chuyển status → Completed, chia giải thưởng.
     * @return null nếu thành công, chuỗi lỗi nếu thất bại
     */
    public String completeTournament(int tournamentId, int leaderId) {
        if (tournamentId <= 0) return "ID giải không hợp lệ";

        TournamentDTO t = tournamentDAO.getTournamentById(tournamentId);
        if (t == null) return "Không tìm thấy giải đấu";
        if (!Integer.valueOf(leaderId).equals(t.getCreateBy())) return "Bạn không có quyền kết thúc giải này";

        String currentStatus = t.getStatus();
        boolean alreadyCompleted = "Completed".equalsIgnoreCase(currentStatus);

        if (!alreadyCompleted && !"Ongoing".equalsIgnoreCase(currentStatus)) {
            return "Chỉ có thể kết thúc giải đang ở trạng thái Ongoing";
        }

        if (!matchDAO.areAllMatchesCompleted(tournamentId)) {
            return "Vẫn còn trận đấu chưa kết thúc. Hãy hoàn thành tất cả các trận trước khi kết thúc giải.";
        }

        // Nếu giải đã Completed (do scheduler) mà chưa được chia thưởng → chia luôn
        if (alreadyCompleted && paymentDAO.isPrizesAlreadyDistributed(tournamentId)) {
            return "Giải đấu đã kết thúc và giải thưởng đã được phân phối trước đó.";
        }

        // Cập nhật standings
        try (java.sql.Connection conn = com.example.util.DBContext.getConnection()) {
            standingDAO.updateStandingsForTournament(conn, tournamentId);
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Chuyển status nếu chưa Completed
        if (!alreadyCompleted) {
            boolean updated = tournamentDAO.completeTournament(tournamentId);
            if (!updated) return "Không thể cập nhật trạng thái giải.";
        }

        // Chia giải thưởng
        BigDecimal prizePool = t.getPrizePool();
        if (prizePool != null && prizePool.compareTo(BigDecimal.ZERO) > 0) {
            boolean distributed = paymentDAO.distributePrizes(tournamentId, prizePool);
            if (!distributed) {
                return "Kết thúc giải thành công nhưng chia giải thưởng thất bại. Vui lòng liên hệ quản trị viên.";
            }
        }

        // Thông báo cho Staff
        try {
            notificationDAO.createNotificationsForRole(
                "Staff",
                "Giải đấu đã kết thúc",
                "Tournament Leader đã kết thúc giải đấu '" + t.getTournamentName() + "'. Giải thưởng đã được phân phối.",
                "Tournament",
                "/staff/tournaments"
            );
        } catch (Exception e) {
            e.printStackTrace();
        }

        return null; // thành công
    }

    public boolean cancelTournament(int tournamentId, String reason) {
        if (tournamentId <= 0) return false;
        if (reason == null || reason.trim().isEmpty()) return false;
        TournamentDTO existing = tournamentDAO.getTournamentById(tournamentId);
        if (existing == null) return false;
        String name = existing.getTournamentName();

        // Hoàn tiền cho người chơi đã thanh toán và leader
        List<Integer> paidUserIds = participantDAO.getParticipantsByTournamentId(tournamentId)
                .stream()
                .filter(p -> p.getStatus() == ParticipantStatus.Active)
                .map(Participant::getUserId)
                .collect(Collectors.toList());

        BigDecimal entryFee = existing.getEntryFee();
        BigDecimal prizePool = existing.getPrizePool();
        Integer leaderId = existing.getCreateBy();
        if (leaderId != null) {
            paymentDAO.refundTournamentCancellation(tournamentId, leaderId, prizePool, entryFee, paidUserIds);
        }

        boolean ok = tournamentDAO.cancelTournament(tournamentId, reason);
        if (ok) {
            try {
                notificationDAO.createNotificationsForRole(
                        "Staff",
                        "Giải đấu đã bị hủy",
                        "Tournament Leader đã hủy giải đấu '" + name + "'.",
                        "Tournament",
                        "/staff/tournaments"
                );
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return ok;
    }

    public String restoreTournament(int tournamentId, int requesterId) {
        if (tournamentId <= 0) return "Invalid tournament id";
        TournamentDTO existing = tournamentDAO.getTournamentById(tournamentId);
        if (existing == null) return "Không tìm thấy giải đấu";
        if (!Integer.valueOf(requesterId).equals(existing.getCreateBy())) return "Bạn không có quyền khôi phục giải này";
        if (!"Cancelled".equalsIgnoreCase(existing.getStatus())) return "Chỉ có thể khôi phục giải ở trạng thái Cancelled";

        // Trừ lại prizePool từ leader (đã hoàn khi cancel)
        BigDecimal prizePool = existing.getPrizePool();
        if (prizePool != null && prizePool.compareTo(BigDecimal.ZERO) > 0) {
            boolean charged = paymentDAO.deductBalanceForTournamentCreation(requesterId, tournamentId, prizePool);
            if (!charged) return "Số dư không đủ để khôi phục giải (cần " + prizePool + " cho prize pool)";
        }

        boolean ok = tournamentDAO.restoreTournament(tournamentId);
        if (ok) {
            try {
                notificationDAO.createNotificationsForRole(
                        "Staff",
                        "Giải đấu chờ duyệt lại",
                        "Tournament Leader đã khôi phục giải đấu '" + existing.getTournamentName() + "' từ trạng thái Cancelled.",
                        "Tournament",
                        "/staff/tournaments"
                );
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return ok ? null : "Khôi phục giải thất bại";
    }

    public boolean resubmitTournament(int tournamentId, int requesterId) {
        if (tournamentId <= 0) return false;
        TournamentDTO existing = tournamentDAO.getTournamentById(tournamentId);
        if (existing == null) return false;
        if (!Integer.valueOf(requesterId).equals(existing.getCreateBy())) return false;
        if (!"Rejected".equalsIgnoreCase(existing.getStatus())) return false;
        boolean ok = tournamentDAO.resubmitTournament(tournamentId);
        if (ok) {
            try {
                notificationDAO.createNotificationsForRole(
                        "Staff",
                        "Giải đấu chờ duyệt lại",
                        "Tournament Leader đã nộp lại giải đấu '" + existing.getTournamentName() + "' để xét duyệt.",
                        "Tournament",
                        "/staff/tournaments"
                );
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return ok;
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

    /** Validate structure: format hợp lệ, matches đủ, không trùng cặp, round/board hợp lệ. */
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

        // Giới hạn số round: Round Robin đủ full vòng theo luật quốc tế, tối đa 10 round.
        // KO tối đa 5 round (tương ứng bracket 32 người = log2(32)).
        final int maxRoundRobinRounds = 10;
        final int maxKnockOutRounds = 5;
        java.util.Set<Integer> rrRounds = new java.util.HashSet<>();
        java.util.Set<Integer> koRounds = new java.util.HashSet<>();
        for (TournamentSetupMatchDTO m : matches) {
            String stage = normalizeStage(m.getStage(), format);
            Integer ri = m.getRoundIndex();
            if (ri == null) continue;
            if ("RoundRobin".equals(stage)) rrRounds.add(ri);
            if ("KnockOut".equals(stage)) koRounds.add(ri);
        }
        if (rrRounds.size() > maxRoundRobinRounds) {
            return SetupValidationResult.invalid("Round Robin chỉ được tối đa " + maxRoundRobinRounds + " round. Hiện có " + rrRounds.size() + " round.");
        }
        if (koRounds.size() > maxKnockOutRounds) {
            return SetupValidationResult.invalid("Knock Out chỉ được tối đa " + maxKnockOutRounds + " round. Hiện có " + koRounds.size() + " round.");
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
            Integer white = m.getPlayer1Id();
            Integer black = m.getPlayer2Id();
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

    /** Validate Schedule: players đã hợp lệ; tất cả trận phải có startTime nằm trong khoảng thời gian giải đấu. */
    private SetupValidationResult validateScheduleStep(int tournamentId, String format, List<TournamentSetupMatchDTO> matches) {
        SetupValidationResult validPlayers = validatePlayersStep(tournamentId, format, matches);
        if (!validPlayers.isValid()) return validPlayers;

        TournamentDTO tournament = tournamentDAO.getTournamentById(tournamentId);
        java.sql.Timestamp tStart = tournament != null ? tournament.getStartDate() : null;
        java.sql.Timestamp tEnd   = tournament != null ? tournament.getEndDate()   : null;

        for (int i = 0; i < matches.size(); i++) {
            TournamentSetupMatchDTO m = matches.get(i);
            java.sql.Timestamp st = m.getStartTime();
            if (st == null) {
                return SetupValidationResult.invalid("Trận " + (i + 1) + " chưa có giờ bắt đầu. Vui lòng điền đủ lịch thi đấu trước khi Finalize.");
            }
            if (tStart != null && st.before(tStart)) {
                return SetupValidationResult.invalid("Trận " + (i + 1) + ": Giờ thi đấu (" + st + ") phải sau ngày bắt đầu giải (" + tStart + ").");
            }
            if (tEnd != null && st.after(tEnd)) {
                return SetupValidationResult.invalid("Trận " + (i + 1) + ": Giờ thi đấu (" + st + ") phải trước ngày kết thúc giải (" + tEnd + ").");
            }
        }
        return SetupValidationResult.valid("Schedule hợp lệ.");
    }

    private List<TournamentSetupMatchDTO> normalizeMatches(List<TournamentSetupMatchDTO> matches, String format) {
        if (matches == null) return List.of();
        List<TournamentSetupMatchDTO> normalized = new ArrayList<>();
        for (TournamentSetupMatchDTO m : matches) {
            if (m == null) continue;
            TournamentSetupMatchDTO copy = new TournamentSetupMatchDTO();
            copy.setStage(normalizeStage(m.getStage(), format));
            copy.setRoundName(m.getRoundName());
            copy.setRoundIndex(m.getRoundIndex() == null || m.getRoundIndex() <= 0 ? 1 : m.getRoundIndex());
            copy.setBoardNumber(m.getBoardNumber() == null || m.getBoardNumber() <= 0 ? null : m.getBoardNumber());
            copy.setPlayer1Id(m.getPlayer1Id());
            copy.setPlayer2Id(m.getPlayer2Id());
            copy.setStartTime(m.getStartTime());
            normalized.add(copy);
        }
        return normalized;
    }

    /** Chuẩn hóa format: RoundRobin, KnockOut. */
    private String normalizeFormat(String format) {
        if (format == null) return null;
        String f = format.trim();
        if ("RoundRobin".equalsIgnoreCase(f) || "Round Robin".equalsIgnoreCase(f)) return "RoundRobin";
        if ("KnockOut".equalsIgnoreCase(f) || "Knock Out".equalsIgnoreCase(f)) return "KnockOut";
        return null;
    }

    /** Chuẩn hóa step: chấp nhận cả BRACKET/STRUCTURE và REFEREE/REFEREES (2 luồng cũ/mới). */
    private String normalizeSetupStep(String step) {
        if (step == null) return null;
        String s = step.trim().toUpperCase();
        if ("BRACKET".equals(s) || "STRUCTURE".equals(s)) return STEP_STRUCTURE;
        if ("PLAYERS".equals(s)) return STEP_PLAYERS;
        if ("SCHEDULE".equals(s)) return STEP_SCHEDULE;
        if ("REFEREE".equals(s) || "REFEREES".equals(s)) return STEP_REFEREE;
        if ("COMPLETED".equals(s)) return STEP_COMPLETED;
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

    // --- Public cho TournamentSetupService (wizard state machine) ---
    public String getNormalizedFormat(String format) {
        return normalizeFormat(format);
    }

    public SetupValidationResult validateStructureStepInternal(String format, List<TournamentSetupMatchDTO> matches) {
        return validateStructureStep(format, matches == null ? List.of() : matches);
    }

    public SetupValidationResult validatePlayersStepInternal(int tournamentId, String format, List<TournamentSetupMatchDTO> matches) {
        return validatePlayersStep(tournamentId, format, matches == null ? List.of() : matches);
    }

    public SetupValidationResult validateScheduleStepInternal(int tournamentId, String format, List<TournamentSetupMatchDTO> matches) {
        return validateScheduleStep(tournamentId, format, matches == null ? List.of() : matches);
    }

    public List<TournamentSetupMatchDTO> normalizeMatchesInternal(List<TournamentSetupMatchDTO> matches, String format) {
        return normalizeMatches(matches, format);
    }

    private boolean checkPlayerCountByFormat(String format, int count) {
        if ("RoundRobin".equals(format)) {
            return count >= 4 && count <= 10;
        }
        if ("KnockOut".equals(format)) {
            return count >= 8 && count <= 32;
        }
        return false;
    }

    private String playerCountErrorMessage(String format) {
        if ("RoundRobin".equals(format)) {
            return "Round Robin yêu cầu tối thiểu 4 và tối đa 8 người chơi đã duyệt.";
        }
        if ("KnockOut".equals(format)) {
            return "Knock Out yêu cầu tối thiểu 8 và tối đa 32 người chơi đã duyệt.";
        }
        return "Số lượng người chơi không hợp lệ.";
    }

    private String toPairKey(int a, int b) {
        int min = Math.min(a, b);
        int max = Math.max(a, b);
        return min + "::" + max;
    }

    // =========================
    // AUTO SETUP & AUTO FILL PLAYERS (logic moved from FE)
    // =========================

    /**
     * Result of auto setup: matches + optional warnings. Does NOT persist to DB.
     */
    public static class AutoSetupResult {
        private final boolean success;
        private final String message;
        private final List<TournamentSetupMatchDTO> matches;
        private final List<String> warnings;

        public AutoSetupResult(boolean success, String message, List<TournamentSetupMatchDTO> matches, List<String> warnings) {
            this.success = success;
            this.message = message;
            this.matches = matches != null ? matches : List.of();
            this.warnings = warnings != null ? warnings : List.of();
        }

        public static AutoSetupResult ok(List<TournamentSetupMatchDTO> matches, List<String> warnings) {
            return new AutoSetupResult(true, null, matches, warnings);
        }

        public static AutoSetupResult error(String message) {
            return new AutoSetupResult(false, message, List.of(), List.of());
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public List<TournamentSetupMatchDTO> getMatches() { return matches; }
        public List<String> getWarnings() { return warnings; }
    }

    /**
     * Generate auto setup: structure + players (where applicable) + schedule times.
     * Uses MatchGenerationService. Does NOT persist; FE receives matches and can save via manualSetup/finalizeStep.
     */
    public AutoSetupResult  generateAutoSetup(int tournamentId) {
        if (tournamentId <= 0) return AutoSetupResult.error("Tournament id không hợp lệ.");
        TournamentDTO tournament = tournamentDAO.getTournamentById(tournamentId);
        if (tournament == null) return AutoSetupResult.error("Không tìm thấy giải đấu.");
        String format = normalizeFormat(tournament.getFormat());
        if (format == null) format = "RoundRobin";

        List<TournamentPlayerDTO> allPlayers = participantDAO.getPlayersWithUserInfo(tournamentId);
        List<TournamentPlayerDTO> activePlayers = allPlayers.stream()
                .filter(p -> "Active".equalsIgnoreCase(p.getStatus()))
                .sorted(Comparator.comparing(TournamentPlayerDTO::getRank, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(TournamentPlayerDTO::getUserId))
                .collect(Collectors.toList());

        if (activePlayers.isEmpty()) {
            return AutoSetupResult.error("Chưa có người chơi đã duyệt (Active) để auto setup.");
        }

        List<Integer> playerIds = activePlayers.stream().map(TournamentPlayerDTO::getUserId).collect(Collectors.toList());
        List<TournamentSetupMatchDTO> generated = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if ("RoundRobin".equals(format)) {
            generated = MatchGenerationService.generateRoundRobinMatches(playerIds, false);
        } else if ("KnockOut".equals(format)) {
            generated = MatchGenerationService.generateKnockoutMatches(playerIds, playerIds);
            if (playerIds.size() != nextPowerOf2(playerIds.size())) {
                int bracketSize = nextPowerOf2(playerIds.size());
                warnings.add("Auto tạo bracket " + bracketSize + " slots theo seeding chuẩn, có " + (bracketSize - playerIds.size()) + " BYE slot.");
            }
        }

        if (generated.isEmpty()) {
            return AutoSetupResult.error("Auto setup chưa tạo được trận phù hợp. Vui lòng dùng manual.");
        }

        // Auto schedule: distribute start times between tournament start and end
        Timestamp start = tournament.getStartDate();
        Timestamp end = tournament.getEndDate();
        if (start != null && end != null && end.after(start) && !generated.isEmpty()) {
            long startMs = start.getTime();
            long endMs = end.getTime();
            long step = (endMs - startMs) / Math.max(generated.size(), 1);
            for (int i = 0; i < generated.size(); i++) {
                generated.get(i).setStartTime(new Timestamp(startMs + step * i));
            }
            warnings.add("Đã tự gán lịch thi đấu trong khoảng thời gian giải.");
        }

        String successMsg = "Đã tạo " + generated.size() + " trận (structure)";
        if (start != null && end != null) successMsg += " và lịch thi đấu";
        successMsg += ". Bracket chưa gán người — nhấn Finalize Structure để lưu, sau đó vào bước 2 để Auto add players hoặc chọn tay.";
        return new AutoSetupResult(true, successMsg, generated, warnings);
    }

    private static int nextPowerOf2(int n) {
        if (n <= 1) return 1;
        int p = 1;
        while (p < n) p *= 2;
        return p;
    }

    /**
     * Auto fill players into existing structure. Structure matches passed in; returns filled matches.
     * Preserves order. Does NOT persist.
     */
    public AutoSetupResult autoFillPlayers(int tournamentId, List<TournamentSetupMatchDTO> structureMatches) {
        if (tournamentId <= 0) return AutoSetupResult.error("Tournament id không hợp lệ.");
        if (structureMatches == null || structureMatches.isEmpty()) {
            return AutoSetupResult.error("Chưa có structure bracket để auto add players.");
        }

        List<TournamentPlayerDTO> allPlayers = participantDAO.getPlayersWithUserInfo(tournamentId);
        List<TournamentPlayerDTO> activePlayers = allPlayers.stream()
                .filter(p -> "Active".equalsIgnoreCase(p.getStatus()))
                .sorted(Comparator.comparing(TournamentPlayerDTO::getRank, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(TournamentPlayerDTO::getUserId))
                .collect(Collectors.toList());

        if (activePlayers.size() < 2) {
            return AutoSetupResult.error("Cần ít nhất 2 players đã duyệt để auto add players.");
        }

        List<Integer> ids = activePlayers.stream().map(TournamentPlayerDTO::getUserId).collect(Collectors.toList());
        String format = normalizeFormatFromMatches(structureMatches);

        List<TournamentSetupMatchDTO> rrRows = structureMatches.stream()
                .filter(m -> "RoundRobin".equals(normalizeStage(m.getStage(), format)))
                .sorted(Comparator.comparing((TournamentSetupMatchDTO m) -> m.getRoundIndex() == null ? 1 : m.getRoundIndex())
                        .thenComparing((TournamentSetupMatchDTO m) -> m.getBoardNumber() == null ? 1 : m.getBoardNumber()))
                .collect(Collectors.toList());

        List<TournamentSetupMatchDTO> rrGenerated = MatchGenerationService.generateRoundRobinMatches(ids, false);
        Map<Integer, List<TournamentSetupMatchDTO>> rrGenByRound = groupMatchesByRound(rrGenerated);
        Map<Integer, List<TournamentSetupMatchDTO>> rrStructByRound = groupMatchesByRound(rrRows);
        Map<Integer, int[]> rrFilledByStructIdx = new LinkedHashMap<>();
        List<Integer> genRoundKeys = new ArrayList<>(rrGenByRound.keySet());
        for (int structIdx = 0; structIdx < structureMatches.size(); structIdx++) {
            TournamentSetupMatchDTO r = structureMatches.get(structIdx);
            if (!"RoundRobin".equals(normalizeStage(r.getStage(), format))) continue;
            int roundIdx = r.getRoundIndex() == null ? 1 : r.getRoundIndex();
            List<TournamentSetupMatchDTO> structRound = rrStructByRound.get(roundIdx);
            if (genRoundKeys.isEmpty()) continue;
            int genKeyIdx = (roundIdx - 1) % genRoundKeys.size();
            List<TournamentSetupMatchDTO> genRound = rrGenByRound.get(genRoundKeys.get(genKeyIdx));
            if (genRound != null && structRound != null) {
                int posInRound = structRound.indexOf(r);
                if (posInRound >= 0 && posInRound < genRound.size()) {
                    TournamentSetupMatchDTO gm = genRound.get(posInRound);
                    if (gm != null) {
                        rrFilledByStructIdx.put(structIdx, new int[]{gm.getPlayer1Id(), gm.getPlayer2Id()});
                    }
                }
            }
        }

        Map<Integer, int[]> koFilledByStructIdx = new LinkedHashMap<>();
        List<Integer> koStructIndices = new ArrayList<>();
        for (int i = 0; i < structureMatches.size(); i++) {
            TournamentSetupMatchDTO m = structureMatches.get(i);
            if ("KnockOut".equals(normalizeStage(m.getStage(), format)) && (m.getRoundIndex() == null ? 1 : m.getRoundIndex()) == 1) {
                koStructIndices.add(i);
            }
        }
        for (int i = 0; i < koStructIndices.size(); i++) {
            int white = ids.get((i * 2) % ids.size());
            int black = ids.get((i * 2 + 1) % ids.size());
            if (black == white) black = ids.get((i * 2 + 2) % ids.size());
            koFilledByStructIdx.put(koStructIndices.get(i), new int[]{white, black});
        }

        List<TournamentSetupMatchDTO> result = new ArrayList<>();
        for (int i = 0; i < structureMatches.size(); i++) {
            TournamentSetupMatchDTO m = structureMatches.get(i);
            TournamentSetupMatchDTO copy = copyMatch(m);
            String stage = normalizeStage(m.getStage(), format);
            if ("RoundRobin".equals(stage)) {
                int[] pair = rrFilledByStructIdx.get(i);
                if (pair != null) {
                    copy.setPlayer1Id(pair[0]);
                    copy.setPlayer2Id(pair[1]);
                }
            } else if ("KnockOut".equals(stage)) {
                int[] pair = koFilledByStructIdx.get(i);
                if (pair != null) {
                    copy.setPlayer1Id(pair[0]);
                    copy.setPlayer2Id(pair[1]);
                } else if ((m.getRoundIndex() == null ? 1 : m.getRoundIndex()) > 1) {
                    copy.setPlayer1Id(null);
                    copy.setPlayer2Id(null);
                }
            }
            result.add(copy);
        }

        return new AutoSetupResult(true, "Auto add players đã áp dụng vào structure hiện tại. Bạn có thể chỉnh tay trước khi qua bước Schedule.",
                result, List.of());
    }

    private String normalizeFormatFromMatches(List<TournamentSetupMatchDTO> matches) {
        boolean hasKO = matches.stream().anyMatch(m -> "KnockOut".equalsIgnoreCase(m.getStage()));
        if (hasKO) return "KnockOut";
        return "RoundRobin";
    }

    private Map<Integer, List<TournamentSetupMatchDTO>> groupMatchesByRound(List<TournamentSetupMatchDTO> matches) {
        return matches.stream()
                .collect(Collectors.groupingBy(m -> m.getRoundIndex() == null ? 1 : m.getRoundIndex(),
                        LinkedHashMap::new, Collectors.toList()));
    }

    private TournamentSetupMatchDTO copyMatch(TournamentSetupMatchDTO m) {
        TournamentSetupMatchDTO c = new TournamentSetupMatchDTO();
        c.setMatchId(m.getMatchId());
        c.setStage(m.getStage());
        c.setRoundName(m.getRoundName());
        c.setRoundIndex(m.getRoundIndex());
        c.setBoardNumber(m.getBoardNumber());
        c.setPlayer1Id(m.getPlayer1Id());
        c.setPlayer2Id(m.getPlayer2Id());
        c.setStartTime(m.getStartTime());
        c.setRefereeId(m.getRefereeId());
        return c;
    }

    /** Kết quả validate setup: valid/invalid + message. */
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

    /**
     * Auto Structure: only creates empty bracket slots (no players, no schedule).
     * Returns matches with player1Id/player2Id = null.
     */
    public AutoSetupResult autoStructure(int tournamentId) {
        if (tournamentId <= 0) return AutoSetupResult.error("Tournament id không hợp lệ.");
        TournamentDTO tournament = tournamentDAO.getTournamentById(tournamentId);
        if (tournament == null) return AutoSetupResult.error("Không tìm thấy giải đấu.");
        String format = normalizeFormat(tournament.getFormat());
        if (format == null) format = "RoundRobin";

        List<TournamentPlayerDTO> allPlayers = participantDAO.getPlayersWithUserInfo(tournamentId);
        List<TournamentPlayerDTO> activePlayers = allPlayers.stream()
                .filter(p -> "Active".equalsIgnoreCase(p.getStatus()))
                .sorted(Comparator.comparing(TournamentPlayerDTO::getRank, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(TournamentPlayerDTO::getUserId))
                .collect(Collectors.toList());

        if (activePlayers.isEmpty()) {
            return AutoSetupResult.error("Chưa có người chơi đã duyệt (Active) để tạo structure.");
        }

        int n = activePlayers.size();
        List<TournamentSetupMatchDTO> generated = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if ("RoundRobin".equals(format)) {
            // Generate slots with null players (structure only)
            int rounds = n % 2 == 0 ? n - 1 : n;
            int matchesPerRound = n / 2;
            for (int r = 1; r <= rounds; r++) {
                for (int b = 1; b <= matchesPerRound; b++) {
                    TournamentSetupMatchDTO m = new TournamentSetupMatchDTO();
                    m.setStage("RoundRobin");
                    m.setRoundIndex(r);
                    m.setRoundName("Round " + r);
                    m.setBoardNumber(b);
                    generated.add(m);
                }
            }
        } else {
            // KnockOut structure
            int bracketSize = nextPowerOf2(n);
            if (bracketSize != n) {
                warnings.add("KnockOut bracket: " + bracketSize + " slots (" + (bracketSize - n) + " BYE).");
            }
            int rounds = (int) (Math.log(bracketSize) / Math.log(2));
            int matchesInRound = bracketSize / 2;
            for (int r = 1; r <= rounds; r++) {
                for (int b = 1; b <= matchesInRound; b++) {
                    TournamentSetupMatchDTO m = new TournamentSetupMatchDTO();
                    m.setStage("KnockOut");
                    m.setRoundIndex(r);
                    m.setRoundName("Round " + r);
                    m.setBoardNumber(b);
                    generated.add(m);
                }
                matchesInRound = Math.max(1, matchesInRound / 2);
            }
        }

        if (generated.isEmpty()) return AutoSetupResult.error("Không thể tạo structure. Vui lòng dùng manual.");
        return new AutoSetupResult(true,
                "Đã tạo " + generated.size() + " ô trận (structure rỗng). Nhấn Finalize Structure để lưu, sau đó sang bước 2 để gán người chơi.",
                generated, warnings);
    }

    /**
     * Auto Schedule: distributes start_time evenly from tournament start to end date,
     * applied to the given list of matches (player assignments preserved).
     */
    public AutoSetupResult autoSchedule(int tournamentId, List<TournamentSetupMatchDTO> matches) {
        if (tournamentId <= 0) return AutoSetupResult.error("Tournament id không hợp lệ.");
        if (matches == null || matches.isEmpty()) return AutoSetupResult.error("Chưa có trận đấu để tạo lịch.");
        TournamentDTO tournament = tournamentDAO.getTournamentById(tournamentId);
        if (tournament == null) return AutoSetupResult.error("Không tìm thấy giải đấu.");
        java.sql.Timestamp start = tournament.getStartDate();
        java.sql.Timestamp end = tournament.getEndDate();
        if (start == null || end == null || !end.after(start)) {
            return AutoSetupResult.error("Giải đấu chưa có ngày bắt đầu/kết thúc hợp lệ để tự động lịch đấu.");
        }
        long startMs = start.getTime();
        long endMs = end.getTime();
        long step = (endMs - startMs) / Math.max(matches.size(), 1);
        List<TournamentSetupMatchDTO> scheduled = new ArrayList<>();
        for (int i = 0; i < matches.size(); i++) {
            TournamentSetupMatchDTO copy = copyMatch(matches.get(i));
            copy.setStartTime(new java.sql.Timestamp(startMs + step * i));
            scheduled.add(copy);
        }
        return new AutoSetupResult(true,
                "Đã tự động phân bổ lịch thi đấu cho " + scheduled.size() + " trận. Nhấn Finalize Schedule để lưu.",
                scheduled, List.of("Thời gian được phân bổ đều giữa " + start + " và " + end));
    }
}

package com.example.controller.user;

import com.example.DAO.NotificationDAO;
import com.example.DAO.ParticipantDAO;
import com.example.DAO.TournamentDAO;
import com.example.model.dto.TournamentDTO;
import com.example.model.entity.Notification;
import com.example.model.entity.Participant;
import com.example.model.entity.User;
import com.example.model.enums.ParticipantStatus;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.Timestamp;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Đăng ký giải đấu – POST /api/register.
 * Giải miễn phí: tạo Participant is_paid=true, Active → thành công ngay.
 * Giải có phí: kiểm tra số dư và trừ thẳng vào ví.
 * Không có tính năng giữ chỗ.
 */
@WebServlet("/api/register")
public class RegisterServlet extends HttpServlet {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[0-9+\\s()\\-]{8,15}$");

    private final TournamentDAO tournamentDAO = new TournamentDAO();
    private final ParticipantDAO participantDAO = new ParticipantDAO();
    private final Gson gson = new Gson();

    private static final int PAYMENT_DEADLINE_HOURS = 1;

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");

        try {
            HttpSession session = req.getSession(false);
            if (session == null || session.getAttribute("user") == null) {
                write(resp, HttpServletResponse.SC_UNAUTHORIZED, false, "Bạn chưa đăng nhập. Vui lòng đăng nhập để đăng ký giải.", null);
                return;
            }

            User currentUser = (User) session.getAttribute("user");
            JsonObject body;
            try {
                body = gson.fromJson(req.getReader(), JsonObject.class);
            } catch (Exception ex) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Dữ liệu gửi lên không hợp lệ.", null);
                return;
            }

            if (body == null || !body.has("tournamentId") || body.get("tournamentId").isJsonNull()) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Thiếu tournamentId", null);
                return;
            }

            Integer tournamentIdObj = firstInteger(body, "tournamentId");
            if (tournamentIdObj == null) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "tournamentId không hợp lệ", null);
                return;
            }
            int tournamentId = tournamentIdObj;

            participantDAO.expireUnpaidParticipants();

            TournamentDTO tournament = tournamentDAO.getTournamentById(tournamentId);
            if (tournament == null) {
                write(resp, HttpServletResponse.SC_NOT_FOUND, false, "Không tìm thấy giải đấu", null);
                return;
            }

            String status = tournament.getStatus() == null ? "" : tournament.getStatus().trim();
            if (!status.equalsIgnoreCase("Upcoming")) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false,
                        "Chỉ giải ở trạng thái Upcoming mới cho phép đăng ký.", null);
                return;
            }

            Timestamp registrationDeadline = tournament.getRegistrationDeadline();
            if (registrationDeadline != null && registrationDeadline.before(new Timestamp(System.currentTimeMillis()))) {
                write(resp, HttpServletResponse.SC_CONFLICT, false, "Đã quá hạn đăng ký", null);
                return;
            }

            int uid = currentUser.getUserId() != null ? currentUser.getUserId() : 0;
            Participant existingAny = participantDAO.getByTournamentAndUser(tournamentId, uid);
            if (existingAny != null && existingAny.getStatus() == ParticipantStatus.Disqualified) {
                write(resp, HttpServletResponse.SC_FORBIDDEN, false,
                        "Bạn đã bị ban khỏi giải đấu này và không thể đăng ký lại. Vui lòng liên hệ BTC nếu cần hỗ trợ.", null);
                return;
            }
            if (existingAny != null && existingAny.getStatus() == ParticipantStatus.Active && Boolean.TRUE.equals(existingAny.getIsPaid())) {
                write(resp, HttpServletResponse.SC_CONFLICT, false, "Bạn đã đăng ký giải này rồi.", null);
                return;
            }
            if (existingAny != null && existingAny.getStatus() == ParticipantStatus.PendingPayment && !Boolean.TRUE.equals(existingAny.getIsPaid())) {
                // If they already have a pending registration, we can just let them proceed to pay with wallet now
            }
            if (participantDAO.isBlockedByUnpaidExpiry(tournamentId, currentUser.getUserId())) {
                write(resp, HttpServletResponse.SC_FORBIDDEN, false,
                        "Bạn đã hủy hoặc hết hạn thanh toán lần trước. Vui lòng thử lại sau 2 giờ.", null);
                return;
            }

            Integer maxPlayer = tournament.getMaxPlayer();
            if (maxPlayer != null && maxPlayer > 0) {
                int currentPlayers = participantDAO.countParticipantsByTournament(tournamentId);
                if (currentPlayers >= maxPlayer) {
                    write(resp, HttpServletResponse.SC_CONFLICT, false, "Giải đã đủ số lượng người tham gia.", null);
                    return;
                }
            }

            String fullName = getString(body, "fullName");
            String username = getString(body, "username");
            String email = getString(body, "email");
            String phone = getString(body, "phone");
            Integer rankAtRegistration = firstInteger(body, "rankAtRegistration", "rank");
            String note = getString(body, "note");

            String fallbackFullName = ((currentUser.getFirstName() == null ? "" : currentUser.getFirstName()) + " "
                    + (currentUser.getLastName() == null ? "" : currentUser.getLastName())).trim();

            String resolvedFullName = isBlank(fullName) ? fallbackFullName : fullName.trim();
            String resolvedUsername = isBlank(username) ? currentUser.getUsername() : username.trim();
            String resolvedEmail = isBlank(email) ? currentUser.getEmail() : email.trim();
            String resolvedPhone = isBlank(phone) ? currentUser.getPhoneNumber() : phone.trim();
            Integer resolvedRank = rankAtRegistration != null ? rankAtRegistration : currentUser.getRank();

            String validationError = validateRegistrationInput(
                    resolvedFullName,
                    resolvedUsername,
                    resolvedEmail,
                    resolvedPhone,
                    resolvedRank
            );
            if (validationError != null) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, validationError, null);
                return;
            }

            java.math.BigDecimal entryFee = tournament.getEntryFee();
            boolean freeEntry = (entryFee == null || entryFee.compareTo(java.math.BigDecimal.ZERO) <= 0);

            if (freeEntry) {
                Participant p = new Participant();
                p.setTournamentId(tournamentId);
                p.setUserId(currentUser.getUserId());
                p.setTitleAtRegistration(resolvedFullName != null && !resolvedFullName.isEmpty() ? resolvedFullName : "Player");
                p.setStatus(ParticipantStatus.Active);
                p.setIsPaid(true);
                p.setNotes(note);
                Integer participantId = participantDAO.createParticipantAndReturnId(p);
                if (participantId == null) {
                    write(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Không thể tạo thành viên. Vui lòng thử lại.", null);
                    return;
                }
                Map<String, Object> data = new HashMap<>();
                data.put("needPayment", false);
                data.put("participantId", participantId);
                notifyLeaderOfNewRegistration(tournament, resolvedFullName);
                write(resp, HttpServletResponse.SC_OK, true, "Đăng ký thành công. Bạn đã là thành viên giải.", data);
                return;
            }

            java.math.BigDecimal userBalance = currentUser.getBalance() != null ? currentUser.getBalance() : java.math.BigDecimal.ZERO;
            if (userBalance.compareTo(entryFee) < 0) {
                 Map<String, Object> data = new HashMap<>();
                 data.put("needPayment", true);
                 data.put("currentBalance", userBalance.doubleValue());
                 data.put("entryFee", entryFee.doubleValue());
                 write(resp, HttpServletResponse.SC_PAYMENT_REQUIRED, false, "Số dư tài khoản không đủ. Vui lòng nạp thêm tiền vào ví.", data);
                 return;
            }

            Integer participantId;
            if (existingAny != null && (existingAny.getStatus() == ParticipantStatus.Withdrawn || existingAny.getStatus() == ParticipantStatus.PendingPayment)) {
                existingAny.setStatus(ParticipantStatus.Active);
                existingAny.setIsPaid(true);
                existingAny.setPaymentExpiresAt(null);
                existingAny.setRemovedAt(null);
                existingAny.setTitleAtRegistration(resolvedFullName != null && !resolvedFullName.isEmpty() ? resolvedFullName : "Player");
                existingAny.setNotes(note);
                if (!participantDAO.updateParticipant(existingAny)) {
                    write(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Không thể cập nhật đăng ký. Vui lòng thử lại.", null);
                    return;
                }
                participantId = existingAny.getParticipantId();
            } else {
                Participant p = new Participant();
                p.setTournamentId(tournamentId);
                p.setUserId(currentUser.getUserId());
                p.setTitleAtRegistration(resolvedFullName != null && !resolvedFullName.isEmpty() ? resolvedFullName : "Player");
                p.setStatus(ParticipantStatus.Active);
                p.setIsPaid(true);
                p.setNotes(note);
                participantId = participantDAO.createParticipantAndReturnId(p);
                if (participantId == null) {
                    write(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Không thể tạo đăng ký. Vui lòng thử lại.", null);
                    return;
                }
            }

            // Deduct balance
            com.example.DAO.UserDAO userDAO = new com.example.DAO.UserDAO();
            boolean deducted = userDAO.addBalance(currentUser.getUserId(), entryFee.negate());
            if (deducted) {
                 currentUser.setBalance(userBalance.subtract(entryFee));
                 session.setAttribute("user", currentUser);

                 com.example.model.entity.PaymentTransaction tx = new com.example.model.entity.PaymentTransaction();
                 tx.setUserId(currentUser.getUserId());
                 tx.setTournamentId(tournamentId);
                 tx.setType("EntryFee");
                 tx.setAmount(entryFee.negate());
                 tx.setBalanceAfter(currentUser.getBalance());
                 tx.setDescription("Đăng ký giải đấu " + tournament.getTournamentName());
                 
                 com.example.DAO.PaymentDAO pDao = new com.example.DAO.PaymentDAO();
                 pDao.insertTransactionAndUpdateParticipant(tx, participantId);
            }

            Map<String, Object> data = new HashMap<>();
            data.put("needPayment", false);
            data.put("participantId", participantId);
            notifyLeaderOfNewRegistration(tournament, resolvedFullName);
            write(resp, HttpServletResponse.SC_OK, true, "Đăng ký giải thành công bằng số dư ví.", data);

        } catch (RuntimeException ex) {
            ex.printStackTrace();
            String userMsg = ex.getMessage() != null ? ex.getMessage().trim() : "";
            if (userMsg.startsWith("Bạn đã đăng ký")) {
                write(resp, HttpServletResponse.SC_CONFLICT, false, userMsg, null);
            } else if (userMsg.contains("Dữ liệu không hợp lệ")) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, userMsg, null);
            } else {
                write(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false,
                        userMsg.isEmpty() ? "Lỗi máy chủ. Vui lòng thử lại sau." : userMsg, null);
            }
        } catch (Exception ex) {
            ex.printStackTrace();
            write(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false,
                    "Lỗi máy chủ: " + (ex.getMessage() != null ? ex.getMessage() : "Vui lòng thử lại sau."), null);
        }
    }

    private void write(HttpServletResponse resp, int status, boolean success, String message, Object data) throws IOException {
        resp.setStatus(status);
        Map<String, Object> res = new HashMap<>();
        res.put("success", success);
        if (message != null) res.put("message", message);
        if (data != null) res.put("data", data);
        resp.getWriter().write(gson.toJson(res));
    }

    private String getString(JsonObject obj, String key) {
        if (obj == null || !obj.has(key) || obj.get(key).isJsonNull()) return null;
        return obj.get(key).getAsString();
    }

    private Integer firstInteger(JsonObject obj, String... keys) {
        if (keys == null) return null;
        for (String key : keys) {
            if (obj == null || !obj.has(key) || obj.get(key).isJsonNull()) continue;
            try {
                return obj.get(key).getAsInt();
            } catch (Exception ignored) { }
        }
        return null;
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private String validateRegistrationInput(String fullName, String username, String email, String phone, Integer rankAtRegistration) {
        if (isBlank(fullName)) return "Họ và tên không được để trống.";
        if (isBlank(username)) return "Tên in-game không được để trống.";
        if (isBlank(email)) return "Email không được để trống.";
        if (isBlank(phone)) return "SĐT không được để trống.";
        if (rankAtRegistration == null) return "Bậc rank không được để trống.";
        if (!EMAIL_PATTERN.matcher(email).matches()) return "Email không đúng định dạng.";
        if (!PHONE_PATTERN.matcher(phone).matches()) return "SĐT không hợp lệ.";
        if (rankAtRegistration < 0) return "Bậc rank phải là số nguyên >= 0.";
        return null;
    }

    private void notifyLeaderOfNewRegistration(TournamentDTO tournament, String playerName) {
        if (tournament == null || tournament.getCreateBy() == null) return;
        try {
            NotificationDAO notifDao = new NotificationDAO();
            Notification n = new Notification();
            n.setTitle("Có người chơi mới đăng ký giải đấu");
            n.setMessage("Người chơi '" + playerName + "' đã đăng ký tham gia giải '" + tournament.getTournamentName() + "'.");
            n.setType("Tournament");
            n.setActionUrl("/leader/tournaments/" + tournament.getTournamentId());
            n.setUserId(tournament.getCreateBy());
            notifDao.createNotification(n);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

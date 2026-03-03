package com.example.controller.user;

import com.example.DAO.ParticipantDAO;
import com.example.DAO.TournamentDAO;
import com.example.model.dto.TournamentDTO;
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
 * Giải có phí: tạo Participant is_paid=false → trả participantId để FE chuyển VNPay; chỉ coi là thành công khi thanh toán xong (vnpay-return cập nhật is_paid=1).
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

            Timestamp registrationDeadline = tournament.getRegistrationDeadline();
            if (registrationDeadline != null && registrationDeadline.before(new Timestamp(System.currentTimeMillis()))) {
                write(resp, HttpServletResponse.SC_CONFLICT, false, "Đã quá hạn đăng ký", null);
                return;
            }

            int uid = currentUser.getUserId() != null ? currentUser.getUserId() : 0;
            Participant existingAny = participantDAO.getByTournamentAndUser(tournamentId, uid);
            if (existingAny != null && existingAny.getStatus() == ParticipantStatus.Active && Boolean.TRUE.equals(existingAny.getIsPaid())) {
                write(resp, HttpServletResponse.SC_CONFLICT, false, "Bạn đã đăng ký giải này rồi.", null);
                return;
            }
            if (existingAny != null && existingAny.getStatus() == ParticipantStatus.PendingPayment && !Boolean.TRUE.equals(existingAny.getIsPaid())) {
                java.sql.Timestamp exp = existingAny.getPaymentExpiresAt();
                if (exp != null && exp.after(new Timestamp(System.currentTimeMillis()))) {
                    Map<String, Object> data = new HashMap<>();
                    data.put("needPayment", true);
                    data.put("participantId", existingAny.getParticipantId());
                    data.put("entryFee", tournament.getEntryFee() != null ? tournament.getEntryFee().doubleValue() : 0);
                    data.put("paymentExpiresAt", exp.getTime());
                    write(resp, HttpServletResponse.SC_OK, true, "Vui lòng hoàn tất thanh toán.", data);
                    return;
                }
            }
            if (participantDAO.isBlockedByUnpaidExpiry(tournamentId, currentUser.getUserId())) {
                write(resp, HttpServletResponse.SC_FORBIDDEN, false,
                        "Bạn đã hết hạn thanh toán lần trước. Vui lòng thử lại sau 24 giờ.", null);
                return;
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
                write(resp, HttpServletResponse.SC_OK, true, "Đăng ký thành công. Bạn đã là thành viên giải.", data);
                return;
            }

            long expiresAtMillis = System.currentTimeMillis() + (PAYMENT_DEADLINE_HOURS * 3600L * 1000L);
            Timestamp paymentExpiresAt = new Timestamp(expiresAtMillis);

            Integer participantId;
            if (existingAny != null && existingAny.getStatus() == ParticipantStatus.Withdrawn
                    && existingAny.getRemovedAt() != null) {
                long blockEnd = existingAny.getRemovedAt().getTime() + (24L * 3600 * 1000);
                if (System.currentTimeMillis() >= blockEnd) {
                    existingAny.setStatus(ParticipantStatus.PendingPayment);
                    existingAny.setIsPaid(false);
                    existingAny.setPaymentExpiresAt(paymentExpiresAt);
                    existingAny.setRemovedAt(null);
                    existingAny.setTitleAtRegistration(resolvedFullName != null && !resolvedFullName.isEmpty() ? resolvedFullName : "Player");
                    existingAny.setNotes(note);
                    if (!participantDAO.updateParticipant(existingAny)) {
                        write(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Không thể tạo đăng ký. Vui lòng thử lại.", null);
                        return;
                    }
                    participantId = existingAny.getParticipantId();
                } else {
                    write(resp, HttpServletResponse.SC_FORBIDDEN, false, "Bạn đã hết hạn thanh toán lần trước. Vui lòng thử lại sau 24 giờ.", null);
                    return;
                }
            } else {
                Participant p = new Participant();
                p.setTournamentId(tournamentId);
                p.setUserId(currentUser.getUserId());
                p.setTitleAtRegistration(resolvedFullName != null && !resolvedFullName.isEmpty() ? resolvedFullName : "Player");
                p.setStatus(ParticipantStatus.PendingPayment);
                p.setIsPaid(false);
                p.setPaymentExpiresAt(paymentExpiresAt);
                p.setNotes(note);
                participantId = participantDAO.createParticipantAndReturnId(p);
                if (participantId == null) {
                    write(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Không thể tạo đăng ký. Vui lòng thử lại.", null);
                    return;
                }
            }

            Map<String, Object> data = new HashMap<>();
            data.put("needPayment", true);
            data.put("participantId", participantId);
            data.put("entryFee", entryFee != null ? entryFee.doubleValue() : 0);
            data.put("paymentExpiresAt", paymentExpiresAt.getTime());
            write(resp, HttpServletResponse.SC_OK, true, "Đang chuyển đến cổng thanh toán.", data);
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
}

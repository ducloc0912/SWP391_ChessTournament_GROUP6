package com.example.service.common;

import com.example.DAO.NotificationDAO;
import com.example.DAO.ReportDAO;
import com.example.DAO.UserDAO;
import com.example.model.dto.ReportDTO;
import com.example.model.entity.BlogPost;
import com.example.model.entity.Notification;
import com.example.model.entity.User;
import com.example.model.enums.BlogCategory;
import com.example.model.enums.BlogStatus;
import com.example.service.staff.BlogPostStaffService;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

public class ReportService {

    private final ReportDAO reportDAO;
    private final UserDAO userDAO;
    private final BlogPostStaffService blogService;
    private final NotificationDAO notificationDAO;

    public ReportService() {
        this.reportDAO = new ReportDAO();
        this.userDAO = new UserDAO();
        this.blogService = new BlogPostStaffService();
        this.notificationDAO = new NotificationDAO();
    }

    public int createReport(ReportDTO dto) {
        // Các validate nghiệp vụ sẽ ném IllegalArgumentException nếu có lỗi.
        // Không được nuốt (catch) IllegalArgumentException ở đây để servlet có thể trả
        // lại đúng message cho frontend.
        if (dto.getReporterId() == null) {
            throw new IllegalArgumentException("Reporter is required");
        }
        if (dto.getAccusedId() != null && dto.getAccusedId().equals(dto.getReporterId())) {
            throw new IllegalArgumentException("Bạn không thể tố cáo chính mình.");
        }
        if (dto.getDescription() == null || dto.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Description is required");
        }
        if (dto.getType() == null || dto.getType().trim().isEmpty()) {
            throw new IllegalArgumentException("Type is required");
        }

        // Chuẩn hóa evidenceUrl: cột DB không cho NULL -> dùng chuỗi rỗng nếu không có
        if (dto.getEvidenceUrl() == null) {
            dto.setEvidenceUrl("");
        } else {
            dto.setEvidenceUrl(dto.getEvidenceUrl().trim());
        }

        // Không cho phép 1 user gửi trùng report cho cùng 1 trận và người bị tố cáo (violation)
        String type = dto.getType().trim();
        try {
            if (dto.getMatchId() != null && dto.getAccusedId() != null
                    && ("Cheating".equalsIgnoreCase(type) || "Misconduct".equalsIgnoreCase(type))) {
                if (reportDAO.existsByReporterMatchAndAccused(dto.getReporterId(), dto.getMatchId(), dto.getAccusedId())) {
                    throw new IllegalArgumentException("Bạn đã gửi report cho người chơi này trong trận đấu này rồi.");
                }
            }

            dto.setStatus("Pending");
            int newId = reportDAO.createReport(dto);
            if (newId > 0) {
                try {
                    notificationDAO.createNotificationsForRole(
                            "Staff",
                            "Có report mới từ người dùng",
                            "Người dùng vừa gửi một report mới (" + type + "). Vui lòng xem xét và xử lý.",
                            "Report",
                            "/staff/reports"
                    );
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            return newId;
        } catch (IllegalArgumentException e) {
            // Đẩy tiếp cho servlet xử lý và trả message cụ thể cho client
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    public List<ReportDTO> getReportsByReporter(int reporterId) {
        try {
            return reportDAO.getReportsByReporter(reporterId);
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }

    public List<ReportDTO> getSystemReportsForStaff(String status) {
        try {
            return reportDAO.getSystemReportsForStaff(status);
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }

    /** Admin xem cùng tập system report (TechnicalIssue / Other). */
    public List<ReportDTO> getSystemReportsForAdmin(String status) {
        return getSystemReportsForStaff(status);
    }

    public List<ReportDTO> getViolationReportsByTournament(int tournamentId, String status) {
        try {
            return reportDAO.getViolationReportsByTournament(tournamentId, status);
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }

    public boolean decideSystemReport(int reportId, boolean valid, String note, int staffId) {
        try {
            String status = valid ? "Resolved" : "Dismissed";
            String finalNote = note != null ? note.trim() : "";
            boolean ok = reportDAO.updateReportDecision(reportId, status, finalNote, staffId);
            if (!ok) return false;

            ReportDTO dto = reportDAO.getById(reportId);
            if (dto != null) {
                handleSystemReportSideEffects(dto, finalNote, valid);
            }
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean decideViolationReport(int reportId, boolean valid, String note, int leaderId) {
        try {
            String status = valid ? "Resolved" : "Dismissed";
            String finalNote = note != null ? note.trim() : "";
            boolean ok = reportDAO.updateReportDecision(reportId, status, finalNote, leaderId);
            if (!ok) return false;

            ReportDTO dto = reportDAO.getById(reportId);
            if (dto != null) {
                handleViolationSideEffects(dto, finalNote, leaderId, valid);
            }
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    private void handleViolationSideEffects(ReportDTO report, String note, int leaderId, boolean valid) {
        try {
            // Nếu có vi phạm -> tạo blog thông báo công khai
            if (valid) {
                BlogPost blog = new BlogPost();
                blog.setTitle("Thông báo xử lý vi phạm trận #" + (report.getMatchId() != null ? report.getMatchId() : report.getReportId()));
                blog.setSummary("Thông báo xử lý vi phạm trong giải đấu, do Tournament Leader đăng.");
                StringBuilder content = new StringBuilder();
                content.append("Báo cáo vi phạm đã được xác nhận là HỢP LỆ.\n\n");
                content.append("Mô tả report:\n").append(report.getDescription() != null ? report.getDescription() : "").append("\n\n");
                if (note != null && !note.isBlank()) {
                    content.append("Hình phạt / Ghi chú từ Tournament Leader:\n").append(note).append("\n\n");
                }
                content.append("Vui lòng tuân thủ luật chơi và quy tắc ứng xử của hệ thống.");
                blog.setContent(content.toString());
                blog.setAuthorId(leaderId);
                blog.setCategories(BlogCategory.News);
                blog.setStatus(BlogStatus.Public);
                blog.setPublishAt(Timestamp.from(Instant.now()));
                blogService.createBlogPost(blog);
            }

            // Tạo thông báo in-app cho người tố cáo trong cả 2 trường hợp (vi phạm / không vi phạm)
            if (report.getReporterId() != null) {
                User reporter = userDAO.getUserById(report.getReporterId());
                if (reporter != null) {
                    Notification n = new Notification();
                    n.setUserId(reporter.getUserId());
                    n.setType("Report");
                    n.setActionUrl("/user/reports");
                    if (valid) {
                        n.setTitle("Báo cáo vi phạm của bạn đã được xử lý");
                        String msg = """
                                Báo cáo vi phạm của bạn đã được xác nhận là HỢP LỆ và đã được áp dụng hình phạt.

                                Mô tả report: %s

                                Hình phạt / Ghi chú từ Tournament Leader: %s
                                """.formatted(
                                report.getDescription() != null ? report.getDescription() : "",
                                note != null && !note.isBlank() ? note : "(Không có ghi chú thêm)"
                        );
                        n.setMessage(msg.trim());
                    } else {
                        n.setTitle("Báo cáo vi phạm của bạn đã được xem xét");
                        String msg = """
                                Báo cáo vi phạm của bạn đã được xem xét và kết quả là: KHÔNG VI PHẠM.

                                Mô tả report: %s

                                Ghi chú / Lý do từ Tournament Leader: %s
                                """.formatted(
                                report.getDescription() != null ? report.getDescription() : "",
                                note != null && !note.isBlank() ? note : "(Không có ghi chú thêm)"
                        );
                        n.setMessage(msg.trim());
                    }
                    notificationDAO.createNotification(n);
                }
            }

            // Chỉ tạo thông báo in-app cho người bị tố cáo nếu có vi phạm
            if (valid && report.getAccusedId() != null) {
                User accused = userDAO.getUserById(report.getAccusedId());
                if (accused != null) {
                    Notification n2 = new Notification();
                    n2.setUserId(accused.getUserId());
                    n2.setType("Report");
                    n2.setActionUrl("/user/reports");
                    n2.setTitle("Bạn đã bị xử lý vi phạm");
                    String msg2 = """
                            Hệ thống xin thông báo: bạn đã bị xác nhận VI PHẠM trong một trận đấu.

                            Mô tả report: %s

                            Hình phạt / Ghi chú từ Tournament Leader: %s

                            Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ ban tổ chức để được hỗ trợ thêm.
                            """.formatted(
                            report.getDescription() != null ? report.getDescription() : "",
                            note != null && !note.isBlank() ? note : "(Không có ghi chú thêm)"
                    );
                    n2.setMessage(msg2.trim());
                    notificationDAO.createNotification(n2);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void handleSystemReportSideEffects(ReportDTO report, String note, boolean valid) {
        try {
            // Thông báo cho người gửi system report (dù hợp lệ hay không)
            if (report.getReporterId() != null) {
                User reporter = userDAO.getUserById(report.getReporterId());
                if (reporter != null) {
                    Notification noti = new Notification();
                    noti.setUserId(reporter.getUserId());
                    noti.setType("Report");
                    noti.setActionUrl("/user/reports");
                    if (valid) {
                        noti.setTitle("System report của bạn đã được chuyển cho Admin");
                        String msg = """
                                System report của bạn đã được staff xác nhận là HỢP LỆ và chuyển cho Admin để xử lý tiếp.

                                Mô tả report: %s

                                Ghi chú từ Staff: %s
                                """.formatted(
                                report.getDescription() != null ? report.getDescription() : "",
                                note != null && !note.isBlank() ? note : "(Không có ghi chú thêm)"
                        );
                        noti.setMessage(msg.trim());
                    } else {
                        noti.setTitle("System report của bạn đã được xem xét");
                        String msg = """
                                System report của bạn đã được staff xem xét và kết luận: KHÔNG HỢP LỆ.

                                Mô tả report: %s

                                Lý do / ghi chú từ Staff: %s
                                """.formatted(
                                report.getDescription() != null ? report.getDescription() : "",
                                note != null && !note.isBlank() ? note : "(Không có ghi chú thêm)"
                        );
                        noti.setMessage(msg.trim());
                    }
                    notificationDAO.createNotification(noti);
                }
            }

            // Nếu hợp lệ: tạo thông báo hệ thống để Admin chú ý (notification global, user_id = NULL)
            if (valid) {
                Notification adminNoti = new Notification();
                adminNoti.setUserId(null);
                adminNoti.setType("System");
                adminNoti.setActionUrl("/admin/dashboard");
                adminNoti.setTitle("Có system report mới đã được xác thực");
                String msg = """
                        Staff đã xác nhận một system report là HỢP LỆ và chuyển cho Admin.

                        Mô tả report: %s
                        """.formatted(
                        report.getDescription() != null ? report.getDescription() : ""
                );
                adminNoti.setMessage(msg.trim());
                notificationDAO.createNotification(adminNoti);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private String safeName(User u) {
        if (u == null) return "bạn";
        String full = (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : "");
        full = full.trim();
        return full.isEmpty() ? (u.getUsername() != null ? u.getUsername() : "bạn") : full;
    }
}


package com.example.service.common;

import com.example.DAO.ReportDAO;
import com.example.DAO.UserDAO;
import com.example.model.dto.ReportDTO;
import com.example.model.entity.BlogPost;
import com.example.model.entity.User;
import com.example.model.enums.BlogCategory;
import com.example.model.enums.BlogStatus;
import com.example.service.staff.BlogPostStaffService;
import com.example.util.EmailUtil;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

public class ReportService {

    private final ReportDAO reportDAO;
    private final UserDAO userDAO;
    private final BlogPostStaffService blogService;

    public ReportService() {
        this.reportDAO = new ReportDAO();
        this.userDAO = new UserDAO();
        this.blogService = new BlogPostStaffService();
    }

    public int createReport(ReportDTO dto) {
        try {
            if (dto.getReporterId() == null) {
                throw new IllegalArgumentException("Reporter is required");
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

            // Không cho phép 1 user gửi trùng report cho cùng 1 trận (violation)
            String type = dto.getType().trim();
            if (dto.getMatchId() != null
                    && ("Cheating".equalsIgnoreCase(type) || "Misconduct".equalsIgnoreCase(type))) {
                if (reportDAO.existsByReporterAndMatch(dto.getReporterId(), dto.getMatchId())) {
                    throw new IllegalArgumentException("Bạn đã gửi report cho trận đấu này rồi.");
                }
            }

            dto.setStatus("Pending");
            return reportDAO.createReport(dto);
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
            return reportDAO.updateReportDecision(reportId, status, finalNote, staffId);
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
            // Nếu có vi phạm -> tạo blog + gửi email cho cả 2
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

            // Gửi email cho người tố cáo trong cả 2 trường hợp (vi phạm / không vi phạm)
            if (report.getReporterId() != null) {
                User reporter = userDAO.getUserById(report.getReporterId());
                if (reporter != null && reporter.getEmail() != null) {
                    String subject;
                    String contentReporter;
                    if (valid) {
                        subject = "[Chess Tournament] Báo cáo vi phạm của bạn đã được xử lý";
                        contentReporter = """
                                Xin chào %s,

                                Báo cáo vi phạm của bạn đã được xác nhận là HỢP LỆ và đã được áp dụng hình phạt.

                                Mô tả report:
                                %s

                                Hình phạt / Ghi chú từ Tournament Leader:
                                %s

                                Trân trọng,
                                Chess Tournament Management System
                                """.formatted(
                                safeName(reporter),
                                report.getDescription() != null ? report.getDescription() : "",
                                note != null && !note.isBlank() ? note : "(Không có ghi chú thêm)"
                        );
                    } else {
                        subject = "[Chess Tournament] Báo cáo vi phạm của bạn đã được xem xét";
                        contentReporter = """
                                Xin chào %s,

                                Báo cáo vi phạm của bạn đã được xem xét và kết quả là: KHÔNG VI PHẠM.

                                Mô tả report:
                                %s

                                Ghi chú / Lý do từ Tournament Leader:
                                %s

                                Trân trọng,
                                Chess Tournament Management System
                                """.formatted(
                                safeName(reporter),
                                report.getDescription() != null ? report.getDescription() : "",
                                note != null && !note.isBlank() ? note : "(Không có ghi chú thêm)"
                        );
                    }
                    EmailUtil.sendEmail(reporter.getEmail(), subject, contentReporter);
                }
            }

            // Chỉ gửi email cho người bị tố cáo nếu có vi phạm
            if (valid && report.getAccusedId() != null) {
                User accused = userDAO.getUserById(report.getAccusedId());
                if (accused != null && accused.getEmail() != null) {
                    String subject = "[Chess Tournament] Bạn đã bị xử lý vi phạm";
                    String contentAccused = """
                            Xin chào %s,

                            Hệ thống xin thông báo: bạn đã bị xác nhận VI PHẠM trong một trận đấu.

                            Mô tả report:
                            %s

                            Hình phạt / Ghi chú từ Tournament Leader:
                            %s

                            Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ ban tổ chức để được hỗ trợ thêm.

                            Trân trọng,
                            Chess Tournament Management System
                            """.formatted(
                            safeName(accused),
                            report.getDescription() != null ? report.getDescription() : "",
                            note != null && !note.isBlank() ? note : "(Không có ghi chú thêm)"
                    );
                    EmailUtil.sendEmail(accused.getEmail(), subject, contentAccused);
                }
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


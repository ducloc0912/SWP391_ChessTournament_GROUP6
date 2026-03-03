# Tournament Setup Wizard – Refactor Plan & Summary

## 1. Refactor plan (bullet)

- **State machine / workflow**
  - Enum `SetupStep`: BRACKET, PLAYERS, SCHEDULE, REFEREES, COMPLETED.
  - Enum `StepStatus`: DRAFT, FINALIZED.
  - Progress persisted per tournament: `current_step` + per-step status (bracket_status, players_status, schedule_status, referees_status) + updated_at, updated_by.
  - Central service `TournamentSetupService`: `getSetupState`, `finalizeStep`, `unlockStep`, `validateBeforeFinalize`.

- **Backend**
  - DB migration: extend `Tournament_Setup_State` with step status columns; add `Setup_Audit_Log`.
  - REST-style endpoints (action-based): `GET setupState` (full state), `POST finalizeStep`, `POST unlockStep`.
  - Validation per step before finalize; transaction-safe finalize/unlock; audit log on finalize/unlock.

- **Frontend**
  - Feature folder `features/tournamentSetup/`: SetupWizardPage, steps (Bracket, Players, Schedule, Referees), api, hooks, types.
  - Wizard UI: stepper with Draft/Finalized badges; auto-navigate to current step; Finalize and Unlock (with confirm) per step.

- **Match generation**
  - Module `MatchGenerationService`: `generateRoundRobinMatches`, `generateKnockoutMatches`, `generateHybridMatches` (RR + KO with placeholders).

- **Edit finalized steps**
  - Unlock step K sets step K and steps K+1..4 to DRAFT; current_step = K; audit logged; UI shows confirm: “Sửa bước này sẽ làm các bước sau cần finalize lại.”

---

## 2. Files created/updated

### DB
- **Created:** `ctms/src/main/resources/db/migration_tournament_setup_wizard.sql`  
  - Add columns to `Tournament_Setup_State`: bracket_status, players_status, schedule_status, referees_status, updated_by.  
  - Create `Setup_Audit_Log` (tournament_id, step, action, before_json, after_json, created_at, created_by).

### Backend (Java)
- **Created:**  
  - `model/enums/SetupStep.java`  
  - `model/enums/StepStatus.java`  
  - `model/dto/TournamentSetupStateDTO.java`  
  - `service/leader/TournamentSetupService.java`  
  - `service/leader/MatchGenerationService.java`  
- **Updated:**  
  - `DAO/TournamentSetupDAO.java` – getSetupStateFull, ensureSetupStateRow, finalizeStep, unlockStep, insertAuditLog, legacy fallback.  
  - `service/leader/TournamentService.java` – getNormalizedFormat, validate*StepInternal, normalizeMatchesInternal (for setup service).  
  - `controller/leader/TournamentController.java` – setupState returns full state; doPost: finalizeStep, unlockStep; getUserIdFromSession.

### Frontend (React)
- **Created:**  
  - `features/tournamentSetup/types.js`  
  - `features/tournamentSetup/api/setupApi.js`  
  - `features/tournamentSetup/hooks/useSetupState.js`  
  - `features/tournamentSetup/steps/BracketStep.jsx`, PlayersStep.jsx, ScheduleStep.jsx, RefereesStep.jsx  
  - `features/tournamentSetup/SetupWizardPage.jsx`  
- **Updated:**  
  - `App.jsx` – route `/tournaments/:id/setup` → SetupWizardPage.  
  - `page/tournamentleader/TournamentDetail.jsx` – “Setup Wizard” button → navigate to `/tournaments/:id/setup`.  
  - `assets/css/tournament-leader/TournamentSetupTab.css` – styles for wizard page, stepper badges, modal, buttons.

---

## 3. API summary

| Method | URL (action) | Description |
|--------|----------------|-------------|
| GET | `/api/tournaments?action=setupState&id={id}` | Full setup state (currentStep, stepStatuses, updatedAt, updatedBy). |
| POST | `/api/tournaments?action=finalizeStep&id={id}&step=BRACKET\|PLAYERS\|SCHEDULE\|REFEREES` | Finalize step; body for BRACKET/PLAYERS/SCHEDULE: `{ format, matches }`. |
| POST | `/api/tournaments?action=unlockStep&id={id}&step=...` | Unlock step; steps after it set to DRAFT. |

Existing actions (schedule, players, referees, manualSetup, saveRefereeAssignments, etc.) unchanged.

---

## 4. End-to-end test flow

1. **Chạy migration**  
   `migration_tournament_setup_wizard.sql` trên DB SWP391.

2. **Tạo giải**  
   Đăng nhập Leader → Tạo giải mới (Create Tournament) → vào chi tiết giải.

3. **Vào Setup Wizard**  
   Trang chi tiết giải → nút **Setup Wizard** → chuyển tới `/tournaments/{id}/setup`.  
   Stepper hiển thị 4 bước; bước hiện tại (thường BRACKET) có trạng thái DRAFT.

4. **Step 1 – Finalize Bracket**  
   - Trong tab **Setup & Schedule** của chi tiết giải: chọn Manual hoặc Auto Setup, tạo cấu trúc (format + matches).  
   - Quay lại **Setup Wizard** → bước 1 → chọn thể thức (nếu cần) → **Finalize bước này**.  
   - Kết quả: Step 1 chuyển FINALIZED, current step sang PLAYERS; bước 2 mở khóa.

5. **Step 2 – Finalize Players**  
   - Ở tab Setup & Schedule: gán người chơi vào các trận (đủ theo format).  
   - Trong wizard → bước 2 → **Finalize bước này**.  
   - Step 2 FINALIZED, current step sang SCHEDULE.

6. **Step 3 – Finalize Schedule**  
   - Tab Setup & Schedule: nhập start time cho từng trận.  
   - Wizard → bước 3 → **Finalize bước này**.  
   - Step 3 FINALIZED, current step sang REFEREES.

7. **Step 4 – Finalize Referees**  
   - Tab Referees: thêm/gán trọng tài; tab Setup & Schedule: gán trọng tài cho từng trận (nếu cần).  
   - Wizard → bước 4 → **Finalize & Hoàn tất**.  
   - Step 4 FINALIZED, current step = COMPLETED.

8. **Edit step đã finalize**  
   - Trong wizard, chọn bước đã FINALIZED (ví dụ bước 2).  
   - Nhấn **Mở khóa / Chỉnh sửa** → modal: “Sửa bước này sẽ làm các bước sau cần finalize lại.” → **Mở khóa**.  
   - Kết quả: Step 2 và các bước 3, 4 chuyển về DRAFT; current step = PLAYERS.  
   - Chỉnh sửa dữ liệu (players/schedule/referees) ở các tab tương ứng, rồi lần lượt Finalize lại từ bước 2 → 3 → 4.

9. **Resume**  
   Đóng trình duyệt, mở lại `/tournaments/{id}/setup`: API `setupState` trả về current step và step statuses; wizard mở đúng bước chưa finalize (hoặc bước hiện tại).

---

## 5. Ghi chú

- **Placeholder referee invite (chưa có tài khoản):** Giữ nguyên luồng hiện tại (invite by email); khi user đăng ký/claim có thể link với invitation (referee_id cập nhật). Không xóa referee sau giải; chỉ remove khỏi tournament nếu cần.
- **Match generation:** `MatchGenerationService` dùng cho auto-setup hoặc công cụ nội bộ; lịch thực tế vẫn được lưu khi finalize Schedule (Step 3) qua `replaceManualSetup`.
- **Quyền:** Chỉ Leader (hoặc Admin) mới được finalize/unlock; controller lấy user từ session (getUserIdFromSession).

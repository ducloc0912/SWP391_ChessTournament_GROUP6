# Setup & Schedule – Logic và Luồng (Logic & Flow)

Tài liệu mô tả logic, luồng xử lý và vị trí code của tính năng **Setup & Schedule** trong CTMS.

---

## 1. TỔNG QUAN LUỒNG

```
Structure (BRACKET) → Players → Schedule → Referee → COMPLETED
     ↓                    ↓           ↓         ↓
  Dựng bracket      Gán người    Đặt lịch   Gán trọng tài
  (round, board)    (W/B)        (start_time) (Match_Referee)
```

- Mỗi bước có trạng thái **DRAFT** hoặc **FINALIZED**
- Phải finalize bước trước mới finalize bước sau
- Unlock bước K → bước K và các bước sau về DRAFT

---

## 2. DATABASE

### 2.1 Bảng chính

| Bảng | Mục đích |
|------|----------|
| `Tournament_Setup_State` | Trạng thái wizard: current_step, bracket_status, players_status, schedule_status, referees_status |
| `Bracket` | Bracket theo stage (RoundRobin, KnockOut) |
| `Round` | Vòng đấu (round_index, name, group_id cho Group Stage) |
| `Matches` | Trận đấu (round_id, board_number, white/black_player_id, start_time, group_id) |
| `Tournament_Group` | Bảng trong Group Stage (Hybrid) |
| `Match_Referee` | Gán trọng tài cho trận |

**Vị trí schema:**
- `scripts/ctms_full_schema_and_seed.sql` – lines 271–284 (Tournament_Setup_State), 198–238 (Bracket, Round, Matches)
- `scripts/migration_group_stage.sql` – Tournament_Group, group_id

---

## 3. BACKEND

### 3.1 API Endpoints (TournamentController)

| Action | Method | Mục đích | Vị trí |
|--------|--------|----------|--------|
| `setupState` | GET | Lấy current_step + stepStatuses | `TournamentController.java` ~253–278 |
| `schedule` | GET | Lấy danh sách matches (round, board, players, start_time, referee) | ~234–249 |
| `groups` | GET | Lấy danh sách groups (Group Stage) | ~145–161 |
| `players` | GET | Lấy danh sách người chơi đã duyệt | ~126–141 |
| `autoSetup` | POST | Tạo structure + players (không persist) | ~341–364 |
| `saveGroupStructure` | POST | Tạo Tournament_Group (số bảng, người/bảng) | ~367–390 |
| `saveGroupAssignments` | POST | Gán participant vào group | ~392–418 |
| `manualSetup` | POST | Lưu schedule (legacy) | ~730–756 |
| `finalizeStep` | POST | Finalize bước: validate → persist → cập nhật status | ~835–880 |
| `unlockStep` | POST | Mở khóa bước K và các bước sau | ~884–915 |
| `saveRefereeAssignments` | POST | Gán trọng tài cho từng trận | ~759–791 |

**File:** `ctms/src/main/java/com/example/controller/leader/TournamentController.java`

---

### 3.2 TournamentSetupService – State Machine

| Method | Mục đích | Vị trí |
|--------|----------|--------|
| `getSetupState(tournamentId)` | Lấy trạng thái setup đầy đủ | ~34–37 |
| `validateBeforeFinalize(...)` | Validate trước finalize: bước trước FINALIZED, bước sau chưa FINALIZED, validate dữ liệu | ~45–88 |
| `finalizeStep(...)` | Validate → saveStepData (replaceManualSetup) → cập nhật DB → audit log | ~93–121 |
| `saveStepData(...)` | Gọi replaceManualSetup cho BRACKET/PLAYERS/SCHEDULE | ~124–143 |
| `unlockStep(...)` | Set bước K và các bước sau về DRAFT | ~151–166 |
| `validateBracketStep` | Validate format, matches không rỗng, structure hợp lệ | ~180–190 |
| `validatePlayersStep` | Validate người chơi đủ, không trùng | ~192–199 |
| `validateScheduleStep` | Validate có matches, schedule hợp lệ | ~201–211 |

**File:** `ctms/src/main/java/com/example/service/leader/TournamentSetupService.java`

---

### 3.3 TournamentSetupDAO – Persist

| Method | Mục đích | Vị trí |
|--------|----------|--------|
| `getSetupStep(tournamentId)` | Lấy current_step | ~39–52 |
| `getSetupStateFull(tournamentId)` | Lấy current_step + bracket/players/schedule/referees_status | ~105–137 |
| `ensureSetupStateRow(tournamentId)` | Đảm bảo có dòng trong Tournament_Setup_State | (gọi từ nhiều nơi) |
| `finalizeStep(tournamentId, step, userId)` | Cập nhật status bước = FINALIZED, current_step = bước tiếp theo | ~200–299 |
| `unlockStep(tournamentId, step, userId)` | Set bước K và sau về DRAFT | ~329–357 |
| `getManualSetupMatches(tournamentId)` | Lấy matches JOIN Round, Bracket, Users, Tournament_Group, Match_Referee | ~441–499 |
| `replaceManualSetup(tournamentId, format, matches)` | Xóa Matches, Round, Bracket cũ → tạo mới từ matches (có Group Stage) | ~505–640 |
| `updateMatchReferees(tournamentId, matches)` | Xóa Match_Referee cũ → insert mới theo refereeId | ~647–680 |

**File:** `ctms/src/main/java/com/example/DAO/TournamentSetupDAO.java`

---

### 3.4 TournamentService – Business Logic

| Method | Mục đích | Vị trí |
|--------|----------|--------|
| `generateAutoSetup(tournamentId)` | Tạo matches: RR/KO/Hybrid (hoặc Hybrid Group Stage) | ~883–920 |
| `autoFillPlayersIntoStructure(tournamentId, structureMatches)` | Điền players vào structure có sẵn | ~925–1005 |
| `validateStructureStepInternal(format, matches)` | Validate structure: format, round/board, RR/KO order | ~583–640 |
| `validatePlayersStepInternal(tournamentId, format, matches)` | Validate players: đủ W/B, không trùng, Hybrid KO để trống | ~605–670 |
| `validateScheduleStepInternal(...)` | Validate schedule | ~671–680 |
| `saveManualSetup(tournamentId, body)` | Gọi replaceManualSetup | ~320–350 |
| `saveRefereeAssignments(tournamentId, matches)` | Gọi updateMatchReferees | ~392–435 |
| `getManualSetupMatches(tournamentId)` | Delegate → setupDAO.getManualSetupMatches | ~260–265 |
| `saveGroupStructure(...)` | Tạo Tournament_Group | ~108–122 |
| `saveGroupAssignments(...)` | Cập nhật Participants.group_id | ~125–136 |

**File:** `ctms/src/main/java/com/example/service/leader/TournamentService.java`

---

### 3.5 MatchGenerationService – Tạo cặp đấu

| Method | Mục đích | Vị trí |
|--------|----------|--------|
| `generateRoundRobinMatches(playerIds, doubleRR)` | Circle method: mỗi người đấu mỗi người 1 lần | ~20–63 |
| `generateKnockoutMatches(playerIds, seeding)` | Bracket KO, seeding chuẩn (1v8, 4v5, 2v7, 3v6) | ~69–98 |
| `generateHybridMatches(playerIds, topNForKo)` | RR full + KO structure (placeholders) | ~135–150 |
| `generateHybridMatchesWithGroups(groupPlayers, topNForKo)` | RR theo từng group + KO placeholders | ~131–155 |

**File:** `ctms/src/main/java/com/example/service/leader/MatchGenerationService.java`

---

## 4. FRONTEND

### 4.1 BracketTab – Setup & Schedule UI

| Phần | Mục đích | Vị trí |
|------|----------|--------|
| State: `rows`, `laneStep`, `stepStatuses`, `groups`, `groupConfig` | Dữ liệu matches, bước hiện tại, trạng thái | `TournamentDetail.jsx` ~1320–1335 |
| `useEffect` load schedule + setupState | Gọi GET schedule, GET setupState khi mount | ~1341–1410 |
| `stageRows` (roundRobinRounds, knockOutRounds) | Nhóm rows theo round | ~1471–1481 |
| `validateStructureRows`, `validateRows` | Validate structure, players | ~1483–1570 |
| `handleFinalizeCurrentStep` | Gửi POST finalizeStep với payload format + matches | ~2064–2200 |
| `handleUnlockStep` | Gửi POST unlockStep | ~1820–1850 |
| `runAutoSetup` | POST autoSetup → setRows từ matches | ~2044–2060 |
| `autoFillPlayersIntoStructure` | POST autoFillPlayers → merge vào rows | ~1987–2040 |
| Stepper (4 bước) | UI chuyển tab structure/players/schedule/referee | ~2660–2710 |
| Group Stage config (Hybrid) | Số bảng, người/bảng, Lưu cấu hình | ~3031–3098 |
| Assign Players to Groups | Phân bổ người vào bảng, Auto Setup từ phân bổ | ~2925–3055 |
| `renderRoundRobinPreview`, `renderKnockoutPreview` | Hiển thị matches theo round | ~2353–2638 |

**File:** `FE/my-app/src/page/tournamentleader/TournamentDetail.jsx`

- Component `BracketTab` bắt đầu ~line 1254
- Setup steps config ~2641–2646
- CSS: `FE/my-app/src/assets/css/tournament-leader/TournamentSetupTab.css`

---

### 4.2 Luồng FE chính

1. **Load:** `GET schedule?id=X` + `GET setupState?id=X` → setRows, setStepStatuses, setLaneStep
2. **Structure:** Auto Setup → setRows. Finalize Structure → POST finalizeStep (step=BRACKET, body: format + matches)
3. **Players:** Chọn W/B cho từng match (hoặc Assign to Groups nếu Hybrid). Finalize Players → POST finalizeStep (step=PLAYERS)
4. **Schedule:** Nhập start_time. Auto schedule (phân bổ trong khoảng start–end). Finalize Schedule → POST finalizeStep (step=SCHEDULE)
5. **Referee:** Chọn trọng tài cho từng trận. Finalize Referees → POST finalizeStep (step=REFEREES)
6. **Unlock:** Unlock Structure → POST unlockStep (step=BRACKET) → các bước sau về DRAFT

---

## 5. SƠ ĐỒ LUỒNG (Flow Diagram)

```
[Leader vào Setup tab]
        │
        ▼
┌───────────────────┐
│ GET setupState    │ ──► current_step, stepStatuses
│ GET schedule      │ ──► rows (matches)
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Bước 1: Structure │
│ - Auto Setup      │ ──► POST autoSetup ──► matches (chưa lưu)
│ - Hoặc thêm round │
│ - Finalize        │ ──► POST finalizeStep(BRACKET) ──► replaceManualSetup
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Bước 2: Players   │
│ - Gán W/B         │
│ - Hoặc Assign     │     (Hybrid Group: saveGroupStructure, saveGroupAssignments)
│   to Groups       │
│ - Finalize        │ ──► POST finalizeStep(PLAYERS) ──► replaceManualSetup
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Bước 3: Schedule  │
│ - Nhập start_time │
│ - Auto schedule   │
│ - Finalize        │ ──► POST finalizeStep(SCHEDULE) ──► replaceManualSetup
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Bước 4: Referee   │
│ - Gán trọng tài   │ ──► POST saveRefereeAssignments
│ - Finalize        │ ──► POST finalizeStep(REFEREES)
└───────────────────┘
        │
        ▼
   COMPLETED
```

---

## 6. ENUM & DTO

| Class | Vị trí | Mục đích |
|-------|--------|----------|
| `SetupStep` | `model/enums/SetupStep.java` | BRACKET, PLAYERS, SCHEDULE, REFEREES, COMPLETED |
| `TournamentSetupStateDTO` | `model/dto/TournamentSetupStateDTO.java` | currentStep, stepStatuses |
| `TournamentSetupMatchDTO` | `model/dto/TournamentSetupMatchDTO.java` | matchId, stage, roundIndex, boardNumber, white/blackPlayerId, startTime, groupId, groupName, refereeId |
| `TournamentManualSetupRequestDTO` | `model/dto/TournamentManualSetupRequestDTO.java` | format, matches |

---

## 7. LƯU Ý

- **Auto Setup** không persist: FE nhận matches, phải Finalize để lưu.
- **replaceManualSetup** xóa toàn bộ Matches, Round, Bracket cũ rồi tạo mới.
- **Hybrid Group Stage:** Cần saveGroupStructure trước, sau đó saveGroupAssignments, rồi Auto Setup mới dùng được group assignments.
- **Unlock:** Chỉ set status về DRAFT, không xóa dữ liệu. Leader phải chỉnh và Finalize lại.

# PROMPT CHO AI STUDIO – UI & Backend: Round Robin có Group trong Hybrid

**Mục đích:** Minh họa UI và mô tả Backend cho tính năng **Round Robin có Group Stage** trong giải Hybrid (cờ vua).

---

## 1. BỐI CẢNH HỆ THỐNG HIỆN TẠI

- **Hybrid** = Bracket 1 (Round Robin) + Bracket 2 (Knock Out)
- Bracket 1: tất cả người chơi đấu vòng tròn với nhau
- Bracket 2: top N từ Bracket 1 vào loại trực tiếp
- Setup wizard: Structure → Players → Schedule → Referee

---

## 2. YÊU CẦU MỚI: ROUND ROBIN CÓ GROUP

**Ý tưởng:** Thay vì 1 bảng Round Robin lớn, chia người chơi thành **nhiều bảng (groups)**. Mỗi bảng đấu vòng tròn nội bộ. Top N mỗi bảng vào Knock Out.

**Ví dụ:** 16 người → 4 bảng (A, B, C, D), mỗi bảng 4 người. Mỗi bảng 3 round RR. Top 2 mỗi bảng (8 người) vào Knock Out.

---

## 3. PROMPT UI CHO AI STUDIO (copy nguyên đoạn dưới)

```
Thiết kế UI cho trang Tournament Setup (wizard) của hệ thống quản lý giải cờ vua. 
Format giải: Hybrid (Round Robin + Knock Out). 
Tính năng mới: Round Robin có Group Stage.

YÊU CẦU GIAO DIỆN:

1. TAB "Bracket 1: Round Robin" (đang chọn)
   - Phía trên có 2 chế độ: [Single Table] [Group Stage] (radio hoặc toggle)
   - Khi chọn "Group Stage":
     + Hiện form: "Số bảng:" [4 ▼] | "Người mỗi bảng:" [4] (tự tính từ tổng người)
     + Preview: "Bảng A (4 người), Bảng B (4 người), Bảng C (4 người), Bảng D (4 người)"
     + Nút: "+ Thêm round Round Robin" (số round = n-1 với n = người mỗi bảng)

2. BƯỚC "2. Players" – khi Group Stage bật
   - Danh sách người đã duyệt bên trái (checkbox, có thể kéo thả)
   - Bên phải: 4 cột tương ứng 4 bảng (A, B, C, D)
   - Mỗi cột có header "Bảng A (0/4)", "Bảng B (0/4)"...
   - Kéo thả hoặc click để gán người vào bảng
   - Cảnh báo nếu chưa đủ người mỗi bảng

3. BƯỚC "3. Schedule" – khi Group Stage bật
   - Sub-tabs theo bảng: [Bảng A] [Bảng B] [Bảng C] [Bảng D]
   - Mỗi tab hiển thị lịch đấu Round Robin của bảng đó (Round 1, Round 2, Round 3...)
   - Mỗi trận: White vs Black | Bàn | Thời gian | [Chọn ngày giờ]

4. BƯỚC "4. Select Referee"
   - Giữ nguyên logic hiện tại, nhưng có filter theo bảng (optional)

5. STYLE
   - Giao diện sạch, hiện đại, màu trung tính (cream/white background, accent đỏ hoặc xanh navy)
   - Font rõ ràng, spacing thoáng
   - Các cột bảng có viền nhẹ, hover highlight
   - Responsive: trên mobile có thể chuyển sang accordion theo bảng

Vẽ wireframe hoặc mockup chi tiết cho toàn bộ flow trên.
```

---

## 4. MÔ TẢ BACKEND (cho developer)

### 4.1 Schema Database

```sql
-- Bảng mới: Tournament_Group (các bảng trong Group Stage)
CREATE TABLE Tournament_Group (
    group_id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    bracket_id INT NULL,                    -- FK Bracket (Round Robin bracket)
    name NVARCHAR(20) NOT NULL,             -- "A", "B", "C", "D"
    sort_order INT DEFAULT 0,
    max_players INT NULL,                  -- số người tối đa mỗi bảng
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (bracket_id) REFERENCES Bracket(bracket_id)
);

-- Participants: thêm group_id (nullable)
ALTER TABLE Participants ADD group_id INT NULL;
ALTER TABLE Participants ADD FOREIGN KEY (group_id) REFERENCES Tournament_Group(group_id);

-- Round: thêm group_id (nullable) – round thuộc bảng nào
ALTER TABLE Round ADD group_id INT NULL;
ALTER TABLE Round ADD FOREIGN KEY (group_id) REFERENCES Tournament_Group(group_id);

-- Matches: thêm group_id (nullable) – trận thuộc bảng nào
ALTER TABLE Matches ADD group_id INT NULL;
ALTER TABLE Matches ADD FOREIGN KEY (group_id) REFERENCES Tournament_Group(group_id);
```

### 4.2 API / DTO

**Structure step (khi Group Stage):**
- Request: `{ format: "Hybrid", structure: { roundRobinMode: "GroupStage", numGroups: 4, playersPerGroup: 4 } }`
- Hoặc: `roundRobinMode: "SingleTable"` (như hiện tại)

**Players step:**
- Request: `{ assignments: [ { participantId, groupId } ] }`
- Validate: mỗi group đủ người, không vượt max

**Match generation:**
- Với Group Stage: gọi `generateRoundRobinMatches(playerIds)` **cho từng group** riêng
- Mỗi match/round gắn `group_id` tương ứng
- Knock Out: top N từ mỗi group (config: `topNPerGroup` = 2)

### 4.3 Luồng xử lý

1. **Structure:** Leader chọn Group Stage → nhập số bảng, hệ thống tạo `Tournament_Group` (A, B, C, D)
2. **Players:** Leader gán participant vào group → cập nhật `Participants.group_id`
3. **Schedule:** Auto Setup / Manual: tạo Round + Match với `group_id`, generate RR matches per group
4. **Knock Out:** Lấy top N mỗi group (theo điểm RR) → seed vào bracket KO

### 4.4 Các file Backend cần sửa/bổ sung

| File | Thay đổi |
|------|----------|
| `Tournament_Group` (entity mới) | Model mới |
| `TournamentGroupDAO` | CRUD group, list by tournament |
| `Participants` | Thêm `group_id` |
| `Round`, `Matches` | Thêm `group_id` |
| `TournamentSetupMatchDTO` | Thêm `groupId`, `groupName` |
| `MatchGenerationService` | `generateRoundRobinMatchesPerGroup(Map<groupId, List<playerIds>>)` |
| `TournamentSetupDAO.replaceManualSetup` | Xử lý group_id khi insert Round/Match |
| `TournamentService` | Validate structure có group, validate players per group |
| `TournamentController` | API nhận structure.groupStage, assignments |

---

## 5. TÓM TẮT CHO AI STUDIO (prompt ngắn gọn)

```
Vẽ mockup UI cho Tournament Setup Wizard – bước cấu hình Round Robin có Group Stage trong giải Hybrid cờ vua:
- Toggle Single Table / Group Stage
- Form chọn số bảng (4) và xem preview
- Bước Players: kéo thả người vào 4 cột bảng A, B, C, D
- Bước Schedule: tab theo bảng, mỗi bảng có Round 1, 2, 3...
- Style: sạch, hiện đại, màu cream/navy
```

---

*File này dùng để copy prompt vào AI Studio (Google AI Studio, v.v.) để tạo mockup minh họa.*

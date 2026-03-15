# Tournament Setup Wizard BA Cleanup Proposal

## 1. Muc tieu

Tai lieu nay chot lai mot nguon su that chung cho flow setup tournament, de:

- Tournament Leader thao tac de hieu, de doan, khong bi "an nut nay ma step kia doi trang thai khong ro ly do".
- FE va BE dung chung cung 1 state machine va cung 1 bo rule.
- Team co the xoa dan flow legacy ma khong bi lech nghiep vu.

Phan vi:

- Setup wizard 4 buoc: `BRACKET`, `PLAYERS`, `SCHEDULE`, `REFEREES`
- Trang setup cua Tournament Leader
- API setup lien quan

## 2. Dinh nghia nghiep vu

### 2.1 Setup steps

1. `BRACKET`
- Dung cau truc giai: round, board, match slots
- Chua yeu cau player, start time, referee

2. `PLAYERS`
- Gan player vao structure da tao

3. `SCHEDULE`
- Gan start time vao cac match da co player

4. `REFEREES`
- Gan referee vao cac match da co lich

5. `PUBLISHED`
- Trang thai sau cung sau khi Tournament Leader bam `Save & Publish`
- Day la business milestone, khong chi la "current_step = COMPLETED"

### 2.2 Step statuses

Moi step chi duoc co 1 trong 3 trang thai sau:

- `DRAFT`
- `DIRTY`
- `FINALIZED`

Y nghia:

- `DRAFT`: step chua tung finalize, hoac du lieu chua san sang
- `DIRTY`: step da tung `FINALIZED`, nhung co thay doi o step nay hoac step truoc no, nen can finalize lai
- `FINALIZED`: step da qua validate va du lieu hien tai duoc xem la hop le

Luu y:

- `DIRTY` khong phai la loi
- `DIRTY` nghia la "du lieu da thay doi, can xac nhan lai"

## 3. State machine chuan

### 3.1 Nguyen tac tong quat

- User duoc phep mo bat ky tab nao de xem du lieu
- User chi duoc sua step X neu step truoc X da `FINALIZED`
- User luon duoc phep bam `Finalize` o step hien tai de validate lai
- Khi sua step X, step X va tat ca step sau X phai chuyen tu `FINALIZED` sang `DIRTY`
- Khi finalize step X thanh cong:
- Step X -> `FINALIZED`
- Cac step truoc X giu nguyen
- Cac step sau X khong tu dong ve `DRAFT`
- Cac step sau X giu `DIRTY` neu da bi anh huong

### 3.2 Transition rules

#### Rule A. Edit

Neu user sua du lieu thuoc step:

- `BRACKET`:
- `BRACKET`, `PLAYERS`, `SCHEDULE`, `REFEREES`

- `PLAYERS`:
- `PLAYERS`, `SCHEDULE`, `REFEREES`

- `SCHEDULE`:
- `SCHEDULE`, `REFEREES`

- `REFEREES`:
- `REFEREES`

Tat ca cac step trong tap bi anh huong:

- Neu dang `FINALIZED` -> chuyen thanh `DIRTY`
- Neu dang `DRAFT` -> giu `DRAFT`
- Neu dang `DIRTY` -> giu `DIRTY`

#### Rule B. Finalize

Khi finalize step X thanh cong:

- Step X -> `FINALIZED`
- Khong tu dong doi trang thai step sau

Vi du:

- `BRACKET = FINALIZED`
- User sua `BRACKET`
- `PLAYERS`, `SCHEDULE`, `REFEREES` thanh `DIRTY`
- User finalize lai `BRACKET`
- Ket qua:
- `BRACKET = FINALIZED`
- `PLAYERS`, `SCHEDULE`, `REFEREES` van `DIRTY`

#### Rule C. Publish

Chi duoc `Publish` neu:

- `BRACKET = FINALIZED`
- `PLAYERS = FINALIZED`
- `SCHEDULE = FINALIZED`
- `REFEREES = FINALIZED`

Khi publish thanh cong:

- setup milestone = `PUBLISHED`
- tournament duoc coi la da cong bo setup

## 4. Rule nghiep vu theo tung buoc

### 4.1 BRACKET

User duoc phep:

- Them/xoa round
- Them/xoa match
- Sua round name
- Sua board number
- Auto Generate Bracket
- Finalize bat ky luc nao

Dieu kien finalize:

- Co it nhat 1 match
- Structure hop le theo format
- Round index, board number hop le
- Khong co match duplicate theo logic format

### 4.2 PLAYERS

User duoc phep sua chi khi:

- `BRACKET = FINALIZED`

User duoc phep:

- Chon player cho tung match
- Auto Fill Players
- Finalize bat ky luc nao

Dieu kien finalize:

- Structure da ton tai va hop le
- Danh sach player active hop le theo format
- Match player assignment hop le
- Khong bi duplicate sai rule

### 4.3 SCHEDULE

User duoc phep sua chi khi:

- `PLAYERS = FINALIZED`

User duoc phep:

- Chon start time
- Auto Schedule
- Finalize bat ky luc nao

Dieu kien finalize:

- Tat ca rule cua `PLAYERS` van dung
- Match scheduling hop le
- Neu business cho phep de trong start time, phai ghi ro trong spec

Khuyen nghi BA:

- Chot ro mot trong 2 lua chon:
- `Strict`: tat ca match phai co start time moi finalize duoc
- `Flexible`: cho phep mot so match chua co start time, nhung `Publish` thi khong duoc

Neu la giai that, nen uu tien `Strict` de tranh publish lich dang do dang.

### 4.4 REFEREES

User duoc phep sua chi khi:

- `SCHEDULE = FINALIZED`

User duoc phep:

- Chon referee cho tung match
- Finalize bat ky luc nao

Dieu kien finalize:

- Tat ca rule cua `SCHEDULE` van dung
- Referee phai thuoc tournament
- Referee assignment khong xung dot business rule

Khuyen nghi BA:

- Chot ro:
- Co bat buoc moi match phai co referee khong
- Mot referee co duoc trung gio nhieu match khong
- Mot referee co duoc vua la `Chief` level tournament, vua lam match referee tren moi board khong

De van hanh that, nen co it nhat 2 rule:

- Match da publish phai co referee hoac explicit "Unassigned"
- 1 referee khong duoc bi trung lich tai 2 match overlap

### 4.5 PUBLISH

User duoc phep:

- Bam `Save & Publish` chi khi ca 4 step deu `FINALIZED`

Dieu kien publish:

- Ca 4 step `FINALIZED`
- Khong co validation error toan cuc

Hieu ung business khi publish:

- Danh dau setup da cong bo
- Public bracket/schedule duoc xem
- Ghi audit log publish
- Co the trigger notification neu san pham can

## 5. UI contract de team FE code dung

### 5.1 Stepper

Stepper chi co 2 vai tro:

- Dieu huong giua cac tab
- Hien status cua moi step

Stepper khong co vai tro:

- Khong tu khoa navigation
- Khong chua business logic finalize

Hien thi badge cho tung step:

- `DRAFT`
- `DIRTY`
- `FINALIZED`

### 5.2 Action area

Moi step chi co mot cum action ro rang:

- `BRACKET`
- `Auto Generate Bracket`
- `Finalize Bracket`

- `PLAYERS`
- `Auto Fill Players`
- `Finalize Players`

- `SCHEDULE`
- `Auto Schedule`
- `Finalize Schedule`

- `REFEREES`
- `Finalize Referees`
- `Save & Publish`

Rule UI:

- Nut `Finalize` luon hien
- Nut `Finalize` chi disable khi:
- Dang loading
- User khong co quyen sua step do vi step truoc chua `FINALIZED`

Nut `Finalize` khong disable chi vi step dang `FINALIZED`

### 5.3 Dirty messaging

Khi sua 1 step da finalized:

- Hien inline banner:
- "Ban da thay doi [step]. Step nay va cac step sau can finalize lai."

Khi step sau dang `DIRTY`:

- Hien nho gon tai action area:
- "Step nay dang DIRTY do du lieu truoc do da thay doi."

### 5.4 Publish messaging

Neu chua publish duoc:

- Hien danh sach step chua `FINALIZED`

Vi du:

- "Chua the Publish. Can hoan tat: Players, Schedule."

Khong nen chi bao chung chung "khong hop le".

## 6. API contract de team BE code dung

### 6.1 APIs nen giu

1. `GET /api/tournaments?action=setupState&id={id}`
- Tra ve:
- `currentStep`
- `stepStatuses`
- `published`

2. `GET /api/tournaments?action=schedule&id={id}`
- Tra ve current setup snapshot

3. `POST /api/tournaments?action=autoSetup&id={id}`
- Input: none hoac format context
- Output: structure only

4. `POST /api/tournaments?action=autoFillPlayers&id={id}`
- Input: current matches
- Output: matches after player assignment

5. `POST /api/tournaments?action=autoSchedule&id={id}`
- Input: current matches
- Output: matches after schedule assignment

6. `POST /api/tournaments?action=markDirtyStep&id={id}&step={step}`
- Input: none
- Output: updated `stepStatuses`

7. `POST /api/tournaments?action=finalizeStep&id={id}&step={step}`
- Input: current matches payload
- Output:
- `success`
- `message`
- `stepStatuses`
- `currentStep`

8. `POST /api/tournaments?action=publishSetup&id={id}`
- Input: none
- Output:
- `success`
- `message`
- `published`

### 6.2 APIs nen deprecate

Nhung API sau dang lam mo nghia flow moi:

- `manualSetup`
- `setupStep`
- `saveRefereeAssignments`

Ly do:

- Business flow moi da dua tat ca ve `finalizeStep`
- Duy tri 2 ngon ngu nghiep vu cung luc se gay bug va confusion

Khuyen nghi:

1. Danh dau deprecated trong code comment ngay
2. Ngung goi tu FE setup page
3. Sau khi xac nhan khong con consumer nao, xoa khoi controller/service

## 7. Nguon su that nghiep vu

Rule nghiep vu bat buoc phai nam o BE:

- Step truoc co duoc finalized chua
- Step nao duoc mark dirty
- Step nao duoc finalize
- Co duoc publish hay khong

FE chi nen:

- Goi API
- Hien status
- Chan sua o muc UX

FE khong nen la noi quyet dinh cuoi cung cho business state.

## 8. Data model khuyen nghi

### 8.1 Tournament_Setup_State

Nen co ro:

- `current_step`
- `bracket_status`
- `players_status`
- `schedule_status`
- `referees_status`
- `is_published`
- `published_at`
- `published_by`
- `updated_at`
- `updated_by`

Khuyen nghi:

- `PUBLISHED` la milestone rieng
- Khong dung `current_step = COMPLETED` de thay cho publish business

## 9. Test cases BA/UAT can co

1. Finalize Bracket thanh cong khi chua co player
2. Finalize Players bi chan neu Bracket chua finalized
3. Sua Bracket sau khi ca 4 step da finalized
- Ket qua: `BRACKET`, `PLAYERS`, `SCHEDULE`, `REFEREES` doi status dung theo rule
4. Finalize lai Bracket
- Ket qua: `BRACKET = FINALIZED`, cac step sau van `DIRTY`
5. Finalize Referees bi fail neu Schedule chua finalized
6. Publish bi fail neu con it nhat 1 step `DIRTY`
7. Publish bi fail neu con it nhat 1 step `DRAFT`
8. Publish thanh cong khi ca 4 step deu finalized
9. Auto actions khong duoc an sai nghia
- Auto Fill Players chi dung khi `BRACKET = FINALIZED`
- Auto Schedule chi dung khi `PLAYERS = FINALIZED`
10. Referee conflict validation

## 10. Ke hoach cleanup cho team code

### Phase 1. Chot behavior

- Chot state machine trong tai lieu nay
- Chot rule `DIRTY`
- Chot business meaning cua `Publish`

### Phase 2. Chot BE

- `finalizeStep` la cong finalize duy nhat
- `publishSetup` la cong publish duy nhat
- `markDirtyStep` la cong dirty duy nhat
- Deprecate API legacy

### Phase 3. Chot FE

- Stepper chi hien status va dieu huong
- Action area theo tung step
- Dirty banner va publish readiness ro rang

### Phase 4. Xoa legacy

- Xoa `manualSetup`
- Xoa `setupStep`
- Xoa `saveRefereeAssignments`
- Xoa code UI/BE khong con consumer

## 11. Quyet dinh BA de team can chot ngay

1. `Publish` co doi `Tournament.status` hay khong
2. Public bracket/schedule mo ra o thoi diem nao
3. `Schedule` co bat buoc full start time truoc finalize/publish hay khong
4. `Referees` co bat buoc gan cho moi match truoc finalize/publish hay khong
5. Co check xung dot lich referee hay khong

Neu 5 diem nay chua chot, code se tiep tuc dung nghia "tam dung duoc" thay vi "dung nghiep vu".

## 12. De xuat chot cuoi cung

De team khong bi lech nua, de xuat chot nhu sau:

- State machine chinh thuc: `DRAFT -> FINALIZED -> DIRTY -> FINALIZED`
- `DIRTY` duoc tao khi sua step hien tai hoac step truoc
- `Finalize` luon bam duoc neu step do duoc phep sua
- `Publish` la action rieng, khong gop voi `Finalize Referees`
- `Publish` chi thanh cong khi ca 4 step deu `FINALIZED`
- Xoa toan bo API legacy sau khi FE migrate xong


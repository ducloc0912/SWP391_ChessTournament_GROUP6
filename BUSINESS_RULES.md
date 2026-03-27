# BUSINESS RULES DOCUMENT
## Chess Tournament Management System (CTMS)

---

| Thông tin | Chi tiết |
|---|---|
| **Dự án** | Chess Tournament Management System |
| **Phiên bản** | 2.0 |
| **Ngày cập nhật** | 2026-03-22 |
| **Trạng thái** | Đã chuẩn hóa hoàn chỉnh |

---

## MỤC LỤC

1. [Module 1 — User & Account Management](#module-1--user--account-management)
2. [Module 2 — Tournament Management](#module-2--tournament-management)
3. [Module 3 — Player Registration](#module-3--player-registration)
4. [Module 4 — Payment & Wallet](#module-4--payment--wallet)
5. [Module 5 — Bracket & Match Scheduling](#module-5--bracket--match-scheduling)
6. [Module 6 — Match Operations](#module-6--match-operations)
7. [Module 7 — Scoring & Standings](#module-7--scoring--standings)
8. [Module 8 — Referee Management](#module-8--referee-management)
9. [Module 9 — Feedback & Report](#module-9--feedback--report)
10. [Module 10 — Content & Notification](#module-10--content--notification)
11. [Bảng tổng hợp & Ma trận truy xuất](#bảng-tổng-hợp--ma-trận-truy-xuất)

---

## MODULE 1 — USER & ACCOUNT MANAGEMENT

### Quy tắc dữ liệu đầu vào

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR01** | Tên người dùng (display name) không được vượt quá **50 ký tự** | Bắt buộc | System |
| **BR02** | Email phải đúng định dạng chuẩn RFC 5322: có ký tự `@`, tên miền hợp lệ (ví dụ: `user@domain.com`). Không chấp nhận email có khoảng trắng hoặc ký tự đặc biệt không hợp lệ | Bắt buộc | System |
| **BR03** | Mật khẩu phải có **tối thiểu 8 ký tự**, bao gồm ít nhất: 1 chữ hoa (A–Z), 1 chữ số (0–9), và 1 ký tự đặc biệt (`!@#$%^&*`) | Bắt buộc | System |
| **BR04** | Mỗi địa chỉ email chỉ được đăng ký **một tài khoản duy nhất** trong hệ thống | Bắt buộc | System |

### Xác thực tài khoản

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR05** | Sau khi đăng ký, người dùng phải **xác thực email qua OTP** trước khi tài khoản được kích hoạt. Tài khoản chưa xác thực không thể đăng nhập | Bắt buộc | System |
| **BR06** | Người dùng phải hoàn thành xác thực tài khoản (BR05) trước khi được phép đăng ký tham gia bất kỳ tournament nào | Bắt buộc | System |

### Trạng thái tài khoản

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR07** | Nếu tài khoản bị **Locked**, người dùng lập tức mất quyền truy cập toàn bộ chức năng hệ thống, kể cả các session đang hoạt động | Bắt buộc | Admin / System |
| **BR08** | Tài khoản bị **Suspended** (tạm ngưng) có thể được Admin khôi phục. Tài khoản bị **Banned** yêu cầu quy trình xét duyệt riêng và không tự động được khôi phục | Bắt buộc | Admin |

### Bảo mật đăng nhập

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR09** | Hệ thống giới hạn số lần đăng nhập sai liên tiếp tối đa **5 lần**. Sau 5 lần sai, tài khoản bị tạm khóa **15 phút** trước khi cho phép thử lại | Bắt buộc | System |
| **BR10** | Hệ thống giới hạn gửi email quên mật khẩu tối đa **1 lần/phút** và **5 lần/ngày** cho mỗi địa chỉ email | Bắt buộc | System |

---

## MODULE 2 — TOURNAMENT MANAGEMENT

### 2.1 Tạo và cấu hình Tournament

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR11** | Tên tournament phải là **duy nhất trong toàn bộ hệ thống**, không phân biệt chữ hoa/thường | Bắt buộc | System |
| **BR12** | Tên tournament không được vượt quá **100 ký tự** | Bắt buộc | System |
| **BR13** | Thời gian kết thúc (`end_date`) phải **sau** thời gian bắt đầu (`start_date`) | Bắt buộc | System |
| **BR14** | Thời gian đăng ký mở (`registration_open`) phải xảy ra trước thời gian đóng đăng ký (`registration_close`) **ít nhất 24 giờ** | Bắt buộc | System |
| **BR15** | Thời gian đóng đăng ký (`registration_close`) phải xảy ra trước thời gian bắt đầu tournament (`start_date`) **ít nhất 24 giờ** | Bắt buộc | System |
| **BR16** | `max_player` phải lớn hơn `min_player`. Giá trị `min_player` tối thiểu là **2** | Bắt buộc | System |
| **BR17** | Tournament chỉ có thể chuyển sang trạng thái **Ongoing** khi số player đã được accept nằm trong khoảng `[min_player, max_player]` (bao gồm cả hai đầu) | Bắt buộc | System |
| **BR18** | Tournament Leader **không thể chỉnh sửa** thông tin cơ bản của tournament (tên, ngày, phí...) khi trạng thái là `Ongoing` hoặc `Completed` | Bắt buộc | System |
| **BR19** | Các tournament đã kết thúc (`Completed` hoặc `Cancelled`) **không bị xóa vĩnh viễn** khỏi hệ thống. Chỉ được lưu trữ (archive) | Bắt buộc | System |
| **BR20** | Nếu đến thời điểm `registration_close` mà số player đã accept **chưa đạt `min_player`**, hệ thống tự động chuyển tournament sang `Cancelled` và kích hoạt quy trình hoàn tiền toàn bộ | Bắt buộc | System |

### 2.2 Luồng trạng thái Tournament

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR21** | Tournament có các trạng thái rõ ràng và chuyển đổi theo thứ tự: `Draft` → `Pending Approval` → `Upcoming` → `Ongoing` → `Completed`. Các trạng thái ngoại lệ bao gồm: `Rejected`, `Cancelled`, `Delayed`. Không được bỏ qua bước trong luồng chính | Bắt buộc | System |
| **BR22** | Chỉ **Admin hoặc Staff** mới có quyền phê duyệt (chuyển `Pending Approval` → `Upcoming`) hoặc từ chối (chuyển sang `Rejected`) tournament | Bắt buộc | Admin / Staff |
| **BR23** | Chỉ **Admin** mới có quyền tạm ngưng (Suspend/Delay) tournament đang diễn ra khi có số lượng báo cáo vi phạm vượt ngưỡng hoặc xảy ra tranh chấp kỹ thuật nghiêm trọng | Bắt buộc | Admin |

---

## MODULE 3 — PLAYER REGISTRATION

### Điều kiện đăng ký

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR24** | Đăng ký tham gia tournament tự động đóng **24 giờ trước** thời điểm bắt đầu chính thức (`start_date`). Sau thời điểm này, hệ thống không chấp nhận đăng ký mới | Bắt buộc | System |
| **BR25** | Chỉ yêu cầu thanh toán phí đăng ký nếu `entry_fee > 0`. Tournament miễn phí (`entry_fee = 0`) không yêu cầu bước thanh toán | Bắt buộc | System |
| **BR26** | Để đăng ký tournament có phí (`entry_fee > 0`), số dư ví của player phải **≥ entry_fee** tại thời điểm đăng ký | Bắt buộc | System |
| **BR27** | Khi player đăng ký, hệ thống **tạm giữ (hold)** số tiền tương ứng `entry_fee` trong ví. Tiền chỉ chính thức bị trừ khi Tournament Leader **Accept** player vào giải | Bắt buộc | System |
| **BR28** | Nếu số dư ví của player giảm xuống dưới `entry_fee` trong khoảng thời gian từ lúc đăng ký đến lúc được accept, đăng ký đó **tự động bị hủy** và slot được giải phóng. Player nhận thông báo về việc này | Bắt buộc | System |
| **BR29** | Một player **không thể đăng ký cùng một tournament nhiều lần**, kể cả sau khi hủy đăng ký trước đó (nếu tournament vẫn còn trong thời gian đăng ký) | Bắt buộc | System |
| **BR30** | Player đang trong trạng thái **Banned do vi phạm** không được phép đăng ký bất kỳ tournament nào trong thời gian bị ban | Bắt buộc | System |

---

## MODULE 4 — PAYMENT & WALLET

### Phí tham gia

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR31** | Phí tham gia áp dụng theo mức phí được cấu hình **tại thời điểm tournament mở đăng ký**. Nếu Tournament Leader thay đổi phí sau khi đã có người đăng ký, mức phí mới chỉ áp dụng cho đăng ký mới | Bắt buộc | System |
| **BR32** | Nếu giao dịch thanh toán qua cổng thanh toán không được xác nhận trong vòng **15 phút**, giao dịch tự động hủy và đăng ký trở về trạng thái chờ | Bắt buộc | System |

### Hoàn tiền (Refund)

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR33** | Hoàn tiền chỉ áp dụng cho player đã thanh toán phí nhưng **chưa tham gia trận đấu nào** trước khi tournament bắt đầu, **hoặc** khi tournament bị hủy sau khi đăng ký đã xác nhận | Bắt buộc | System |
| **BR34** | Player bị cấm thi đấu do vi phạm (Banned/Disqualified) **không được hoàn tiền** dưới bất kỳ hình thức nào | Bắt buộc | System |
| **BR35** | Tournament bị hủy sau khi đăng ký nhưng trước khi bắt đầu — **toàn bộ phí đã thu phải được hoàn trả 100%** | Bắt buộc | System |
| **BR36** | Mọi yêu cầu hoàn tiền phải được xử lý và hoàn tất trong vòng **7 ngày làm việc** kể từ khi phát sinh điều kiện hoàn tiền | Bắt buộc | Admin / System |

### Rút tiền (Withdrawal)

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR37** | Yêu cầu rút tiền phải được **Admin phê duyệt** (status = Approved) và thông tin ngân hàng (`BankAccountNumber`, `BankName`) phải khớp với thông tin đã đăng ký trước khi chuyển sang `Completed` | Bắt buộc | Admin |
| **BR38** | Số tiền rút tối thiểu mỗi lần là **50,000 VNĐ** | Bắt buộc | System |
| **BR39** | Player **không thể rút tiền** nếu đang có tournament registration ở trạng thái `PendingPayment` (tiền đang bị tạm giữ) | Bắt buộc | System |

### Lịch sử giao dịch

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR40** | Lịch sử giao dịch được phân trang, mặc định **10 giao dịch/trang**, sắp xếp theo thời gian tạo giảm dần (mới nhất lên đầu) | Bắt buộc | System |

---

## MODULE 5 — BRACKET & MATCH SCHEDULING

### 5.1 Bracket

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR41** | Quyền truy cập vào Bracket Dashboard chỉ dành cho tournament có trạng thái: **Closed for Registration**, **Ongoing**, hoặc **Completed** | Bắt buộc | System |
| **BR42** | Bracket chỉ được generate **một lần duy nhất**. Sau khi finalize, không thể tái tạo trừ khi Admin reset tournament về bước setup kèm lý do ghi rõ trong audit log | Bắt buộc | Admin / System |
| **BR43** | Trong format **KnockOut**: tổng số slot trong bracket phải là **lũy thừa của 2 gần nhất ≥ số player tham gia** (ví dụ: 10 players → 16 slots, 5 players → 8 slots) | Bắt buộc | System |
| **BR44** | Các slot trống trong KnockOut bracket được điền bởi **BYE**. Player được ghép với BYE **tự động thắng** và đi tiếp vòng sau mà không cần diễn ra trận đấu | Bắt buộc | System |
| **BR45** | Trong format **Round Robin**: mỗi player phải đấu với **mỗi player còn lại trong nhóm ít nhất 1 lần** | Bắt buộc | System |
| **BR46** | Trong Round Robin, số vòng tối thiểu = `(n - 1)` nếu n chẵn, `n` nếu n lẻ (với n là số player trong nhóm) | Bắt buộc | System |

### 5.2 Lập lịch trận đấu

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR47** | Thời gian bắt đầu của một trận đấu phải **sau thời gian kết thúc dự kiến** của tất cả các trận đấu vòng trước (parent matches) trong bracket | Bắt buộc | System |
| **BR48** | Mỗi trận đấu phải có **ít nhất 1 referee được assign** trước khi tournament được publish | Bắt buộc | Tournament Leader / System |
| **BR49** | Referee được assign cho trận đấu phải có trạng thái **Active** và đã **chấp nhận lời mời** tham gia tournament | Bắt buộc | System |

---

## MODULE 6 — MATCH OPERATIONS

### 6.1 Check-in

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR50** | Referee chỉ được thực hiện **check-in cho các trận đấu được assign cụ thể** cho họ trong bảng `Match_Referee`. Không có quyền với trận đấu của referee khác | Bắt buộc | System |
| **BR51** | Trận đấu bắt đầu khi **cả hai player đã check-in**. Nếu một player không check-in trong vòng **10 phút** kể từ giờ thi đấu đã định, Referee có quyền tuyên bố **forfeit** sau khi đã ghi nhận cảnh báo chính thức | Bắt buộc | Referee |

### 6.2 Cập nhật kết quả

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR52** | Referee chỉ được ghi nhận kết quả trong thời gian trận đấu diễn ra (match status = `Ongoing`). Sau khi trận kết thúc, **chỉ Tournament Leader** mới có quyền chỉnh sửa kết quả | Bắt buộc | Referee / Tournament Leader |
| **BR53** | Kết quả trận đấu sau khi Tournament Leader **xác nhận (Confirmed)** không thể thay đổi, trừ khi có **Admin override** kèm lý do bằng văn bản được lưu vào audit log | Bắt buộc | Admin |
| **BR54** | Mọi hành động cập nhật điểm số đều **bắt buộc kèm bằng chứng**: ảnh chụp màn hình, ảnh thực tế, hoặc link video | Bắt buộc | Referee / Tournament Leader |
| **BR55** | Kết quả tournament phải được công bố trong vòng **6 giờ** sau khi trận đấu cuối cùng kết thúc. Nếu Tournament Leader không thực hiện, **hệ thống tự động công bố** dựa trên kết quả đã nhập | Bắt buộc | System / Tournament Leader |
| **BR56** | Dữ liệu **standings, bracket và notifications** phải được đồng bộ **ngay lập tức** sau mỗi hành động cập nhật kết quả trận đấu | Bắt buộc | System |
| **BR57** | Một trận đấu đã có **winner** không thể được cập nhật kết quả thêm, trừ khi Tournament Leader hoặc Admin mở lại trạng thái với lý do được ghi nhận | Bắt buộc | System |

---

## MODULE 7 — SCORING & STANDINGS

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR58** | Hệ thống tính điểm chuẩn: **Thắng = 1 điểm**, **Hòa = 0.5 điểm**, **Thua = 0 điểm** | Bắt buộc | System |
| **BR59** | Khi có đồng điểm, hệ thống sử dụng **Buchholz Score** (tổng điểm của các đối thủ đã gặp) làm tie-break chính. Nếu vẫn bằng nhau, áp dụng **Direct Encounter** (kết quả trận đấu trực tiếp giữa các player đồng điểm) | Bắt buộc | System |
| **BR60** | Elo rating của player được cập nhật **sau mỗi trận đấu** (không phải sau mỗi tournament), dựa trên kết quả trận và hệ số K phù hợp với rating hiện tại | Bắt buộc | System |
| **BR61** | Hệ số K cho tính Elo: `K = 32` cho player có rating **< 2000**, `K = 24` cho rating **2000–2400**, `K = 16` cho rating **> 2400** (theo chuẩn FIDE) | Bắt buộc | System |

---

## MODULE 8 — REFEREE MANAGEMENT

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR62** | Một người dùng **không thể đồng thời là referee và player** trong cùng một tournament | Bắt buộc | System |
| **BR63** | Referee chỉ có thể chấp nhận hoặc từ chối lời mời tham gia tournament **trước khi** tournament bắt đầu (`start_date`) | Bắt buộc | System |
| **BR64** | Nếu referee **từ chối lời mời**, Tournament Leader phải nhận thông báo ngay lập tức để assign referee thay thế trước khi tournament publish | Bắt buộc | System |
| **BR65** | Referee chỉ được thực hiện check-in và cập nhật kết quả cho các **trận đấu được assign cụ thể**. Không có quyền với trận đấu của referee khác | Bắt buộc | System |

---

## MODULE 9 — FEEDBACK & REPORT

### Feedback

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR66** | Chỉ player đã **tham gia thi đấu thực tế** (participant có trạng thái Active trong tournament) mới được gửi feedback | Bắt buộc | System |
| **BR67** | Mỗi player chỉ được gửi **1 feedback cho mỗi tournament** | Bắt buộc | System |
| **BR68** | Rating trong feedback phải là số nguyên từ **1 đến 5** | Bắt buộc | System |
| **BR69** | Nội dung feedback tối đa **500 ký tự** | Bắt buộc | System |
| **BR70** | Feedback chỉ có thể được gửi khi tournament có trạng thái **Completed** | Bắt buộc | System |

### Report & Support

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR71** | Nội dung phản hồi hỗ trợ (Response to Support) là **trường bắt buộc** phải điền trước khi gửi email phản hồi đến người dùng | Bắt buộc | Admin / Staff |
| **BR72** | Referee phải gửi báo cáo vi phạm trong vòng **24 giờ** kể từ khi vi phạm xảy ra. Báo cáo quá hạn sẽ bị hệ thống từ chối | Bắt buộc | System |

---

## MODULE 10 — CONTENT & NOTIFICATION

### Thông báo

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR73** | Thông báo được phân trang, mặc định **20 thông báo/trang**, sắp xếp theo thời gian tạo **giảm dần** (mới nhất lên đầu) | Bắt buộc | System |

### Upload file & hình ảnh

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR74** | Định dạng file ảnh được phép upload: **JPG, JPEG, PNG, WEBP**. Các định dạng khác bị từ chối | Bắt buộc | System |
| **BR75** | Kích thước tối đa mỗi file ảnh: **5 MB**. File vượt quá giới hạn này bị từ chối | Bắt buộc | System |

### Blog / Nội dung

| ID | Business Rule | Mức độ | Actor |
|---|---|---|---|
| **BR76** | Blog post phải trải qua trạng thái **Draft** trước khi được publish (`Public`). Staff không thể xuất bản bài viết trực tiếp mà không qua bước Draft | Bắt buộc | System |

---

## BẢNG TỔNG HỢP & MA TRẬN TRUY XUẤT

### Thống kê

| Phân loại | Số lượng |
|---|---|
| Tổng số BR | **76** |
| BR kế thừa từ bản gốc (đã chuẩn hóa) | 44 |
| BR mới bổ sung | 32 |
| BR bị loại bỏ (trùng lặp / implementation detail) | 2 (BR14 gốc trống, BR15 gốc) |

### Ma trận truy xuất nguồn gốc

| BR Gốc | BR Mới | Trạng thái | Lý do thay đổi |
|---|---|---|---|
| BR01 | BR01 | Giữ nguyên | |
| BR02 | BR02 | Giữ nguyên | |
| BR03 | BR03 | **Nâng cấp** | Bổ sung complexity rule (uppercase, number, special char) |
| BR04 | BR07 | Giữ nguyên | |
| BR05 | BR10 | **Nâng cấp** | Thêm giới hạn 5 lần/ngày |
| BR06 | BR26 | Giữ nguyên | |
| BR07 | BR06 | **Làm rõ** | Định nghĩa rõ "verify" = xác thực OTP |
| BR08 | BR15 | **Làm rõ** | Nêu rõ 24h trước `start_date` |
| BR09 | BR33 | Giữ nguyên | |
| BR10 | BR34 | Giữ nguyên | |
| BR11 | BR36 | Giữ nguyên | |
| BR12 | BR35 | Giữ nguyên | |
| BR13 | BR25 | Giữ nguyên | |
| **BR14** | — | **Loại bỏ** | Nội dung trống |
| **BR15** | BR31 | **Viết lại** | BR gốc là implementation detail (tên field DB), không phải Business Rule |
| BR16 | BR11 | Giữ nguyên | |
| BR17 | BR13 | Giữ nguyên | |
| BR18 | BR41 | **Làm rõ** | Cần map đúng với TournamentStatus enum |
| BR19 | BR43 + BR44 | **Bổ sung** | Thêm quy tắc xử lý BYE slot |
| BR20 | BR47 | Giữ nguyên | |
| BR21 | BR51 | **Sửa lỗi** | Câu gốc mâu thuẫn "10 minutes ago [after]", thêm bước cảnh báo trước forfeit |
| BR22 | BR55 | **Nâng cấp** | Thêm fallback tự động nếu TL không publish |
| BR23 | BR49 | **Làm rõ** | Cụ thể hoá: Active + đã chấp nhận lời mời |
| BR24 | BR54 | Giữ nguyên | |
| BR25 | BR52 | **Làm rõ** | Định nghĩa rõ "real-time only" = match status Ongoing |
| BR26 | BR50 | Giữ nguyên | |
| BR27 | BR56 | **Làm rõ** | Liệt kê cụ thể: standings, bracket, notifications |
| BR28 + BR29 | BR73 | **Hợp nhất** | Cùng module, cùng entity |
| BR30 + BR31 | BR74 + BR75 | Tách riêng | |
| BR32 | BR40 | Giữ nguyên | |
| BR33 | BR19 | Giữ nguyên | |
| BR34 | BR21 | Chuẩn hóa | |
| BR35 | BR71 | Giữ nguyên | |
| BR36 | BR58 | Giữ nguyên | |
| BR37 | BR59 | **Làm rõ** | Định nghĩa rõ loại tie-break: Buchholz + Direct Encounter |
| BR38 | BR60 + BR61 | **Sửa lỗi** | Gốc: update per-tournament (sai chess domain). Sửa: per-match + thêm K-factor chuẩn FIDE |
| BR39 | BR45 | Giữ nguyên | |
| BR40 | BR17 | **Làm rõ** | Nêu rõ bao gồm cả đầu min và max |
| BR41 | BR26 | Giữ nguyên | |
| BR42 | BR37 | Giữ nguyên | |
| BR43 | BR27 + BR28 | **Tách + bổ sung** | Tách thành 2 BR; bổ sung edge case balance giảm sau khi đăng ký |
| BR44 | BR50 + BR65 | **Hợp nhất** | Cùng nghĩa, cùng actor |
| Unnamed (Feedback x4) | BR66–BR70 | **Đánh số chính thức** | |

---

*Tài liệu này được chuẩn hóa theo tiêu chuẩn BA và áp dụng cho phiên bản hệ thống CTMS hiện tại.*
*Mọi thay đổi Business Rule phải được cập nhật vào tài liệu này kèm ngày hiệu lực và lý do thay đổi.*

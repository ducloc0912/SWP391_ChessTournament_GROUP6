# Chạy project CTMS

Project có **2 phần**: Backend (Java/Tomcat) và Frontend (React/Vite). Cả hai phải chạy cùng lúc.

## 1. Chạy Backend (bắt buộc trước khi Login / Home hoạt động)

Mở **một terminal** trong Cursor, chạy:

```bash
cd ctms
mvn package cargo:run
```

- Lần đầu có thể tải Tomcat 10, đợi vài phút.
- Khi thấy dòng kiểu `Tomcat started on port(s): 8080` thì backend đã sẵn sàng.
- API: `http://localhost:8080/ctms/api/login`, `http://localhost:8080/ctms/api/home`, ...

**Giữ terminal này mở** (đừng tắt).

## 2. Chạy Frontend

Mở **terminal thứ hai** trong Cursor, chạy:

```bash
cd FE/my-app
npm install
npm run dev
```

- Truy cập URL Vite báo (thường `http://localhost:5173`).
- Trang Login và Home sẽ gọi backend tại `http://localhost:8080/ctms`.

---

**Lưu ý:** Lệnh `run dev` trong Cursor thường chỉ chạy frontend. Nếu không chạy backend (bước 1), sẽ gặp lỗi **"Không kết nối được server"** hoặc **ERR_CONNECTION_REFUSED**.

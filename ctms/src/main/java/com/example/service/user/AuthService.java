package com.example.service.user;

import java.util.HashMap;
import java.util.Map;

import com.example.DAO.UserDAO;
import com.example.model.entity.User;
import com.example.util.PasswordUtil;

public class AuthService {

    // Gọi DAO để tương tác Database
    private UserDAO userDAO = new UserDAO();

    // ==========================================================
    // XỬ LÝ ĐĂNG NHẬP (LOGIN)
    // ==========================================================
    public Map<String, Object> login(String email, String password) {
        Map<String, Object> response = new HashMap<>();

        // 1. Gọi DAO để lấy dữ liệu User và Role (trả về Map)
        // Map này chứa: key "user" -> Object User, key "role" -> String RoleName
        Map<String, Object> dbData = userDAO.authenticate(email);

        // Trường hợp 1: Email không tồn tại trong DB
        if (dbData == null) {
            response.put("success", false);
            response.put("message", "Email không tồn tại hoặc chưa đăng ký.");
            return response;
        }

        // Lấy dữ liệu ra từ Map
        User user = (User) dbData.get("user");
        String role = (String) dbData.get("role");

        // Trường hợp 2: Sai mật khẩu
        // Hash password người dùng nhập vào rồi so sánh với DB
        String hashedInputPass = PasswordUtil.hashPassword(password);
        if (!hashedInputPass.equals(user.getPassword())) {
            response.put("success", false);
            response.put("message", "Mật khẩu không chính xác.");
            return response;
        }

        // Trường hợp 3: Tài khoản bị khóa (IsActive = 0)
        if (!user.getIsActive()) {
            response.put("success", false);
            response.put("message", "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Admin.");
            return response;
        }

        // ================= ĐĂNG NHẬP THÀNH CÔNG =================

        // 4. Xóa password trong object User để bảo mật (Không gửi pass về Frontend)
        user.setPassword(null);

        // 5. Xác định trang sẽ chuyển hướng (Redirect) dựa trên Role
        String redirectUrl = "/"; // Mặc định là trang chủ (cho Player)
        
        if (role != null) {
            switch (role.toLowerCase()) {
                case "admin":
                    redirectUrl = "/admin/dashboard";
                    break;
                case "staff":
                    redirectUrl = "/staff/dashboard";
                    break;
                case "referee": // Trọng tài
                    redirectUrl = "/referee/dashboard";
                    break;
                case "leader": // Trưởng ban tổ chức
                    redirectUrl = "/leader/dashboard";
                    break;
                default:
                    redirectUrl = "/";
            }
        }

        // 6. Đóng gói kết quả trả về Controller
        response.put("success", true);
        response.put("message", "Đăng nhập thành công!");
        response.put("user", user);       // Object User (đã xóa pass)
        response.put("role", role);       // String Role name (để lưu Session)
        response.put("redirect", redirectUrl); // Đường dẫn chuyển trang

        return response;
    }

    // ==========================================================
    // XỬ LÝ ĐĂNG KÝ (REGISTER)
    // ==========================================================
    public Map<String, Object> register(User user, String confirmPassword) {
        Map<String, Object> response = new HashMap<>();

        // 1. Validate: Mật khẩu xác nhận phải khớp
        if (confirmPassword == null || !confirmPassword.equals(user.getPassword())) {
            response.put("success", false);
            response.put("message", "Mật khẩu xác nhận không khớp.");
            return response;
        }

        // 2. Validate: Kiểm tra Email đã tồn tại chưa
        // (Lưu ý: UserDAO cần có hàm checkExist, nếu chưa có bạn cần thêm vào UserDAO)
        if (userDAO.checkExist("email", user.getEmail())) {
            response.put("success", false);
            response.put("message", "Email này đã được sử dụng.");
            return response;
        }

        // 3. Validate: Kiểm tra Username đã tồn tại chưa
        if (userDAO.checkExist("username", user.getUsername())) {
            response.put("success", false);
            response.put("message", "Tên đăng nhập đã tồn tại.");
            return response;
        }
        
        // 4. Validate: Kiểm tra Số điện thoại
        if (userDAO.checkExist("phone_number", user.getPhoneNumber())) {
            response.put("success", false);
            response.put("message", "Số điện thoại đã được sử dụng.");
            return response;
        }

        // 5. Hash mật khẩu trước khi lưu xuống DB (Bảo mật)
        String hashedPassword = PasswordUtil.hashPassword(user.getPassword());
        user.setPassword(hashedPassword);

        // 6. Gọi DAO để thực hiện Transaction (Lưu User -> Lưu Role)
        boolean isRegistered = userDAO.register(user);

        if (isRegistered) {
            response.put("success", true);
            response.put("message", "Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.");
        } else {
            response.put("success", false);
            response.put("message", "Lỗi hệ thống. Vui lòng thử lại sau.");
        }

        return response;
    }
}
package com.example.service.user;

import com.example.DAO.OTPDAO;
import com.example.DAO.UserDAO;
import com.example.model.User;
import com.example.util.EmailUtil;
import com.example.util.OTPUtil;
import java.util.HashMap;

public class ForgotPasswordService {

    public HashMap<String, Object> forgotPassword(String email) {

        HashMap<String, Object> result = new HashMap<>();
        UserDAO userDAO = new UserDAO();

        // 1️⃣ Chưa nhập email
        if (email == null || email.trim().isEmpty()) {
            result.put("success", false);
            result.put("message", "Please enter your email");
            return result;
        }

        // 2️⃣ Email không tồn tại
        User user = userDAO.findByEmail(email);
        if (user == null) {
            result.put("success", false);
            result.put("message", "Email does not exist");
            return result;
        }

        // 3️⃣ Tạo & lưu OTP
        String otp = OTPUtil.generateOTP();
        OTPDAO otpDAO = new OTPDAO();
        otpDAO.saveOTP(email, otp);

        // 4️⃣ Gửi mail
        EmailUtil.sendOTP(email, otp);

        // 5️⃣ Thành công
        result.put("success", true);
        result.put("message", "OTP has been sent to your email");
        return result;
    }
}

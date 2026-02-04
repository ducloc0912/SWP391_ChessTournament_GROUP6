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
        
        if (email == null || email.trim().isEmpty()) {
            result.put("success", false);
            result.put("message", "Email is required");
            return result;
        }
        
        UserDAO userDAO = new UserDAO();
        User user = userDAO.findByEmail(email);

        if (user == null) {
            result.put("success", false);
            result.put("message", "Email does not exist");
            return result;
        }

        String otp = OTPUtil.generateOTP();
        OTPDAO otpDAO = new OTPDAO();
        otpDAO.saveOTP(email, otp);

        EmailUtil.sendOTP(email, otp);

        result.put("success", true);
        result.put("message", "OTP has been sent to your email");
        return result;
    }
}

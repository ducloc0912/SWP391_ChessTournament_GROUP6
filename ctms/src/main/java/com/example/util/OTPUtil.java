package com.example.util;

import java.util.Random;

public class OTPUtil {

    public static String generateOTP() {
        Random r = new Random();
        return String.valueOf(100000 + r.nextInt(900000));
    }
}

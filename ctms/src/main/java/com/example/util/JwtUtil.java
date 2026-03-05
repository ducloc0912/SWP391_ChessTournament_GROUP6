package com.example.util;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import com.example.model.entity.User;

import java.util.Date;

public class JwtUtil {

    // Đơn giản dùng chung secret với VNPayConfig hoặc đặt riêng
    private static final String SECRET = "CTMS_DEMO_JWT_SECRET_CHANGE_ME";
    private static final String ISSUER = "ctms-auth";
    private static final long EXPIRES_IN_MS = 24 * 60 * 60 * 1000L; // 24h

    private static Algorithm algorithm() {
        return Algorithm.HMAC256(SECRET);
    }

    public static String generateToken(User user, String role) {
        long now = System.currentTimeMillis();
        return JWT.create()
                .withIssuer(ISSUER)
                .withIssuedAt(new Date(now))
                .withExpiresAt(new Date(now + EXPIRES_IN_MS))
                .withClaim("userId", user.getUserId())
                .withClaim("email", user.getEmail())
                .withClaim("username", user.getUsername())
                .withClaim("role", role)
                .sign(algorithm());
    }

    public static DecodedJWT verifyToken(String token) {
        JWTVerifier verifier = JWT.require(algorithm())
                .withIssuer(ISSUER)
                .build();
        return verifier.verify(token);
    }
}


package com.example.util;
import java.io.BufferedReader;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServletRequest;

public class BodyUtil {
    public static String readBody(HttpServletRequest req) {
        try (BufferedReader br = req.getReader()) {
            return br.lines().collect(Collectors.joining());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
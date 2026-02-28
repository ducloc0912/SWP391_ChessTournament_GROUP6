package com.example.util;

import java.nio.charset.StandardCharsets;

/**
 * Sửa lỗi hiển thị tiếng Việt khi dữ liệu UTF-8 bị đọc sai thành Latin-1 (mojibake).
 * VD: "LÃª" -> "Lê", "Sáº§m SÆ¡n" -> "Sầm Sơn"
 */
public final class EncodingUtil {

    /**
     * Nếu s có dấu hiệu mojibake (UTF-8 bị hiểu nhầm là ISO-8859-1), thử chuyển lại thành UTF-8 đúng.
     * Nếu null hoặc không cần sửa, trả về nguyên bản.
     */
    public static String fixUtf8Mojibake(String s) {
        if (s == null || s.isEmpty()) return s;
        if (!looksLikeMojibake(s)) return s;
        try {
            byte[] asLatin1 = s.getBytes(StandardCharsets.ISO_8859_1);
            String fixed = new String(asLatin1, StandardCharsets.UTF_8);
            if (!fixed.contains("\uFFFD")) return fixed;
        } catch (Exception ignored) { }
        return s;
    }

    private static boolean looksLikeMojibake(String s) {
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == '\u00C3' || s.charAt(i) == '\u00C6' || s.charAt(i) == '\u00C2') return true;
        }
        return false;
    }
}

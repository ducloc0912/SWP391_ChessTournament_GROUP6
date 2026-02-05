package com.example.util;

import java.util.ArrayList;
import java.util.List;
public class JsonMiniUtil {
    public static String getString(String json, String key) {
        String k = "\"" + key + "\"";
        int i = json.indexOf(k);
        if (i < 0) return null;

        int colon = json.indexOf(":", i);
        if (colon < 0) return null;

        // tìm dấu " bắt đầu value
        int q1 = json.indexOf("\"", colon + 1);
        if (q1 < 0) return null;

        int q2 = json.indexOf("\"", q1 + 1);
        if (q2 < 0) return null;

        return json.substring(q1 + 1, q2);
    }

    // Parse mảng số: {"permissionIds":[1,2,3]}
    public static List<Integer> getIntList(String json, String arrayKey) {
        String k = "\"" + arrayKey + "\"";
        int i = json.indexOf(k);
        if (i < 0) return new ArrayList<>();

        int lb = json.indexOf("[", i);
        int rb = json.indexOf("]", i);
        if (lb < 0 || rb < 0 || rb <= lb) return new ArrayList<>();

        String inside = json.substring(lb + 1, rb).trim();
        List<Integer> out = new ArrayList<>();
        if (inside.isEmpty()) return out;

        String[] parts = inside.split(",");
        for (String p : parts) {
            String t = p.trim();
            if (!t.isEmpty()) out.add(Integer.parseInt(t));
        }
        return out;
    }
}
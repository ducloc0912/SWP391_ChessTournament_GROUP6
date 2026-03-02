package com.example.model.enums;

public enum BlogCategory {
    Strategy, News, Guide;

    public static BlogCategory getStrategy() {
        return Strategy;
    }

    public static BlogCategory getNews() {
        return News;
    }

    public static BlogCategory getGuide() {
        return Guide;
    }
}

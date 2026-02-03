package com.example.model.enums;

public enum BlogStatus {
    Draft, Public, Private;

    public static BlogStatus getDraft() {
        return Draft;
    }

    public static BlogStatus getPublic() {
        return Public;
    }

    public static BlogStatus getPrivate() {
        return Private;
    }
}
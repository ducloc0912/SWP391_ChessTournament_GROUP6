package com.example.model.entity;

public class Permission {
    private Integer permissionId;
    private String permissionName;
    private String permissionCode;
    private String module;

    public Integer getPermissionId() {
        return permissionId;
    }

    public void setPermissionId(Integer permissionId) {
        this.permissionId = permissionId;
    }

    public String getPermissionName() {
        return permissionName;
    }

    public void setPermissionName(String permissionName) {
        this.permissionName = permissionName;
    }

    public String getPermissionCode() {
        return permissionCode;
    }

    public void setPermissionCode(String permissionCode) {
        this.permissionCode = permissionCode;
    }

    public String getModule() {
        return module;
    }

    public void setModule(String module) {
        this.module = module;
    }

    public Permission() {}

    public Permission(Integer permissionId, String permissionName, String permissionCode, String module) {
        this.permissionId = permissionId;
        this.permissionName = permissionName;
        this.permissionCode = permissionCode;
        this.module = module;
    }
}

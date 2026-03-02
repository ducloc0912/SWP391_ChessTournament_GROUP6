package com.example.service.user;

import java.util.Set;

import com.example.DAO.RbacDAO;

import jakarta.servlet.http.HttpSession;

public class AuthorizationService {
    private final RbacDAO dao = new RbacDAO();

    @SuppressWarnings("unchecked")
    public Set<String> getPermissionsCached(int userId, HttpSession session) {
        Object cached = session.getAttribute("permissionCodes");
        if (cached != null) return (Set<String>) cached;

        Set<String> perms = dao.getPermissionCodesByUser(userId);
        session.setAttribute("permissionCodes", perms);
        return perms;
    }

    public void invalidatePermissionCache(HttpSession session) {
        session.removeAttribute("permissionCodes");
    }
    
}
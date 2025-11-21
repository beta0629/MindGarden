package com.coresolution.consultation.utils;

import com.coresolution.consultation.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import jakarta.servlet.http.HttpSession;

@Component
public class SessionUtils {
    
    /**
     * 현재 사용자 정보 조회
     * 1. 세션에서 조회 (우선순위 1)
     * 2. SecurityContext에서 조회 (세션이 null이거나 사용자 정보가 없을 때)
     */
    public static User getCurrentUser(HttpSession session) {
        // 1. 세션이 있으면 세션에서 조회
        if (session != null) {
            User sessionUser = (User) session.getAttribute("user");
            if (sessionUser != null) {
                return sessionUser;
            }
        }
        
        // 2. 세션이 null이거나 사용자 정보가 없으면 SecurityContext에서 조회
        // (SessionBasedAuthenticationFilter에서 데이터베이스 조회 후 SecurityContext에 설정한 경우)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            // details에서 User 객체 조회 (createAuthentication에서 setDetails(user)로 설정됨)
            Object details = authentication.getDetails();
            if (details instanceof User) {
                return (User) details;
            }
            
            // principal이 User 객체인 경우 (드물지만 가능)
            Object principal = authentication.getPrincipal();
            if (principal instanceof User) {
                return (User) principal;
            }
        }
        
        return null;
    }
    
    public static boolean isLoggedIn(HttpSession session) {
        return getCurrentUser(session) != null;
    }
    
    public static void setCurrentUser(HttpSession session, User user) {
        if (session != null) {
            session.setAttribute("user", user);
        }
    }
    
    public static void clearSession(HttpSession session) {
        if (session != null) {
            session.invalidate();
        }
    }
}

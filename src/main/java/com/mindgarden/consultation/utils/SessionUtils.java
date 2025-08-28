package com.mindgarden.consultation.utils;

import com.mindgarden.consultation.entity.User;
import org.springframework.stereotype.Component;
import jakarta.servlet.http.HttpSession;

@Component
public class SessionUtils {
    
    public static User getCurrentUser(HttpSession session) {
        return (User) session.getAttribute("user");
    }
    
    public static boolean isLoggedIn(HttpSession session) {
        return getCurrentUser(session) != null;
    }
    
    public static void setCurrentUser(HttpSession session, User user) {
        session.setAttribute("user", user);
    }
    
    public static void clearSession(HttpSession session) {
        session.invalidate();
    }
}

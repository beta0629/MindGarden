package com.mindgarden.consultation.dto;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class SessionInfo {
    private String sessionId;
    private LocalDateTime creationTime;
    private LocalDateTime lastAccessedTime;
    private int maxInactiveInterval;
    private UserInfo userInfo;
    
    @Data
    public static class UserInfo {
        private Long id;
        private String username;
        private String email;
        private String role;
        private String nickname;
    }
}

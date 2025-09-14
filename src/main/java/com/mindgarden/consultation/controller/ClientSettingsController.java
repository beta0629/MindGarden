package com.mindgarden.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 클라이언트 설정 관리 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/client")
@RequiredArgsConstructor
public class ClientSettingsController {
    
    private final UserService userService;
    
    /**
     * 클라이언트 설정 조회
     * @return 클라이언트 설정 정보
     */
    @GetMapping("/settings")
    public ResponseEntity<?> getClientSettings() {
        try {
            log.info("📋 클라이언트 설정 조회 요청");
            
            // 현재 로그인된 사용자 정보 가져오기
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            String userEmail = auth.getName();
            User user = userService.findByEmail(userEmail).orElse(null);
            
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "message", "사용자 정보를 찾을 수 없습니다."
                ));
            }
            
            // 클라이언트 설정 정보 구성
            Map<String, Object> settings = new HashMap<>();
            settings.put("notifications", Map.of(
                "email", user.getEmailNotification() != null ? user.getEmailNotification() : true,
                "sms", user.getSmsNotification() != null ? user.getSmsNotification() : false,
                "push", user.getPushNotification() != null ? user.getPushNotification() : true
            ));
            
            settings.put("privacy", Map.of(
                "profileVisibility", user.getProfileVisibility() != null ? user.getProfileVisibility() : "private",
                "dataSharing", user.getDataSharing() != null ? user.getDataSharing() : false
            ));
            
            settings.put("consultation", Map.of(
                "autoReminder", user.getAutoReminder() != null ? user.getAutoReminder() : true,
                "sessionDuration", user.getPreferredSessionDuration() != null ? user.getPreferredSessionDuration() : 50
            ));
            
            log.info("✅ 클라이언트 설정 조회 성공 - 사용자: {}", userEmail);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", settings
            ));
            
        } catch (Exception e) {
            log.error("❌ 클라이언트 설정 조회 오류: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "설정 조회 중 오류가 발생했습니다."
            ));
        }
    }
    
    /**
     * 클라이언트 설정 저장
     * @param settings 저장할 설정 정보
     * @return 저장 결과
     */
    @PutMapping("/settings")
    public ResponseEntity<?> updateClientSettings(@RequestBody Map<String, Object> settings) {
        try {
            log.info("💾 클라이언트 설정 저장 요청");
            
            // 현재 로그인된 사용자 정보 가져오기
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            String userEmail = auth.getName();
            User user = userService.findByEmail(userEmail).orElse(null);
            
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "message", "사용자 정보를 찾을 수 없습니다."
                ));
            }
            
            // 설정 정보 파싱 및 업데이트
            @SuppressWarnings("unchecked")
            Map<String, Object> notifications = (Map<String, Object>) settings.get("notifications");
            if (notifications != null) {
                user.setEmailNotification((Boolean) notifications.get("email"));
                user.setSmsNotification((Boolean) notifications.get("sms"));
                user.setPushNotification((Boolean) notifications.get("push"));
            }
            
            @SuppressWarnings("unchecked")
            Map<String, Object> privacy = (Map<String, Object>) settings.get("privacy");
            if (privacy != null) {
                user.setProfileVisibility((String) privacy.get("profileVisibility"));
                user.setDataSharing((Boolean) privacy.get("dataSharing"));
            }
            
            @SuppressWarnings("unchecked")
            Map<String, Object> consultation = (Map<String, Object>) settings.get("consultation");
            if (consultation != null) {
                user.setAutoReminder((Boolean) consultation.get("autoReminder"));
                user.setPreferredSessionDuration((Integer) consultation.get("sessionDuration"));
            }
            
            // 사용자 정보 저장
            User updatedUser = userService.save(user);
            
            log.info("✅ 클라이언트 설정 저장 성공 - 사용자: {}", userEmail);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "설정이 성공적으로 저장되었습니다.",
                "data", Map.of(
                    "userId", updatedUser.getId(),
                    "email", updatedUser.getEmail(),
                    "updatedAt", updatedUser.getUpdatedAt()
                )
            ));
            
        } catch (Exception e) {
            log.error("❌ 클라이언트 설정 저장 오류: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "설정 저장 중 오류가 발생했습니다."
            ));
        }
    }
}

package com.mindgarden.consultation.controller;

import java.util.Map;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.PrivacyConsentService;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 개인정보 동의 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@RestController
@RequestMapping("/api/privacy-consent")
@RequiredArgsConstructor
public class PrivacyConsentController {
    
    private final PrivacyConsentService privacyConsentService;
    
    /**
     * 사용자의 개인정보 동의 상태 조회
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getConsentStatus(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            Map<String, Object> consentStatus = privacyConsentService.getUserConsentStatus(currentUser.getId());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", consentStatus
            ));
            
        } catch (Exception e) {
            log.error("❌ 개인정보 동의 상태 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "개인정보 동의 상태 조회 중 오류가 발생했습니다."
            ));
        }
    }
    
    /**
     * 개인정보 동의 상태 업데이트
     */
    @PostMapping("/update")
    public ResponseEntity<Map<String, Object>> updateConsentStatus(
            @RequestBody Map<String, Object> consentData,
            HttpSession session,
            HttpServletRequest request) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // IP 주소와 User-Agent 추가
            consentData.put("ipAddress", getClientIpAddress(request));
            consentData.put("userAgent", request.getHeader("User-Agent"));
            
            Map<String, Object> result = privacyConsentService.updateConsentStatus(
                currentUser.getId(), consentData);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ 개인정보 동의 상태 업데이트 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "개인정보 동의 상태 업데이트 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 개인정보 동의 이력 조회
     */
    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getConsentHistory(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            Map<String, Object> history = privacyConsentService.getConsentHistory(currentUser.getId());
            
            return ResponseEntity.ok(history);
            
        } catch (Exception e) {
            log.error("❌ 개인정보 동의 이력 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "개인정보 동의 이력 조회 중 오류가 발생했습니다."
            ));
        }
    }
    
    /**
     * 클라이언트 IP 주소 추출
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}

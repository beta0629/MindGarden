package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.EmailRequest;
import com.coresolution.consultation.entity.Alert;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.AlertRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.SecurityAlertService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 보안 이벤트 알림 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SecurityAlertServiceImpl implements SecurityAlertService {
    
    private final EmailService emailService;
    private final AlertRepository alertRepository;
    private final UserRepository userRepository;
    
    @Value("${security.alert.email.enabled:true}")
    private boolean emailAlertEnabled;
    
    @Value("${security.alert.email.recipients:security@mindgarden.com}")
    private String securityAlertRecipients;
    
    @Override
    public void sendSecurityAlert(String eventType, String severity, Map<String, Object> details) {
        try {
            log.warn("🔒 보안 이벤트 발생: eventType={}, severity={}, details={}", eventType, severity, details);
            
            // CRITICAL 또는 HIGH 심각도 이벤트는 즉시 알림
            if ("CRITICAL".equals(severity) || "HIGH".equals(severity)) {
                sendEmailAlert(eventType, severity, details);
                createSystemAlert(eventType, severity, details);
            } else {
                // MEDIUM, LOW는 시스템 알림만
                createSystemAlert(eventType, severity, details);
            }
            
        } catch (Exception e) {
            log.error("보안 이벤트 알림 발송 실패: {}", e.getMessage(), e);
        }
    }
    
    @Override
    public void sendLoginFailureAlert(String email, String ipAddress, int failureCount) {
        Map<String, Object> details = new HashMap<>();
        details.put("email", email);
        details.put("ipAddress", ipAddress);
        details.put("failureCount", failureCount);
        details.put("timestamp", LocalDateTime.now());
        
        String severity = failureCount >= 5 ? "HIGH" : failureCount >= 3 ? "MEDIUM" : "LOW";
        
        sendSecurityAlert("LOGIN_FAILURE", severity, details);
    }
    
    @Override
    public void sendUnauthorizedAccessAlert(Long userId, String resource, String ipAddress) {
        Map<String, Object> details = new HashMap<>();
        details.put("userId", userId);
        details.put("resource", resource);
        details.put("ipAddress", ipAddress);
        details.put("timestamp", LocalDateTime.now());
        
        // 사용자 정보 조회
        if (userId != null) {
            userRepository.findById(userId).ifPresent(user -> {
                details.put("userEmail", user.getEmail());
                details.put("userName", user.getName());
            });
        }
        
        sendSecurityAlert("UNAUTHORIZED_ACCESS", "HIGH", details);
    }
    
    @Override
    public void sendSuspiciousActivityAlert(Long userId, String activity, Map<String, Object> activityDetails) {
        Map<String, Object> details = new HashMap<>();
        details.put("userId", userId);
        details.put("activity", activity);
        details.put("timestamp", LocalDateTime.now());
        details.putAll(activityDetails);
        
        // 사용자 정보 조회
        if (userId != null) {
            userRepository.findById(userId).ifPresent(user -> {
                details.put("userEmail", user.getEmail());
                details.put("userName", user.getName());
            });
        }
        
        sendSecurityAlert("SUSPICIOUS_ACTIVITY", "MEDIUM", details);
    }
    
    /**
     * 이메일 알림 발송
     */
    private void sendEmailAlert(String eventType, String severity, Map<String, Object> details) {
        if (!emailAlertEnabled) {
            log.debug("이메일 알림이 비활성화되어 있습니다.");
            return;
        }
        
        try {
            String subject = String.format("[보안 알림] %s - %s", severity, eventType);
            String body = buildEmailBody(eventType, severity, details);
            
            // 보안팀에게 이메일 발송
            String[] recipients = securityAlertRecipients.split(",");
            for (String recipient : recipients) {
                EmailRequest emailRequest = EmailRequest.builder()
                    .toEmail(recipient.trim())
                    .subject(subject)
                    .content(body)
                    .type("TEXT")
                    .priority("HIGH")
                    .sendImmediately(true)
                    .build();
                emailService.sendEmail(emailRequest);
            }
            
            log.info("✅ 보안 이벤트 이메일 알림 발송 완료: eventType={}, recipients={}", eventType, securityAlertRecipients);
            
        } catch (Exception e) {
            log.error("보안 이벤트 이메일 알림 발송 실패: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 시스템 알림 생성
     */
    private void createSystemAlert(String eventType, String severity, Map<String, Object> details) {
        try {
            Alert alert = new Alert();
            alert.setType("SECURITY_ALERT");
            alert.setPriority(severity);
            alert.setStatus("UNREAD");
            alert.setTitle(String.format("[보안] %s", eventType));
            alert.setContent(buildAlertContent(eventType, severity, details));
            alert.setSummary(String.format("보안 이벤트 발생: %s (심각도: %s)", eventType, severity));
            alert.setIcon("security");
            alert.setColor(getSeverityColor(severity));
            alert.setIsDismissible(false); // 보안 알림은 자동 닫기 불가
            alert.setAutoDismissSeconds(null);
            
            // 본사 관리자에게만 알림 발송
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                log.error("❌ tenantId가 설정되지 않았습니다");
                return;
            }
            
            // 표준화 2025-12-05: HQ_ADMIN, HQ_MASTER → ADMIN으로 통합
            List<User> hqAdmins = userRepository.findByRole(tenantId, UserRole.ADMIN)
                .stream()
                .filter(user -> user.getIsActive() != null && user.getIsActive())
                .collect(Collectors.toList());
            
            for (User admin : hqAdmins) {
                Alert adminAlert = new Alert();
                adminAlert.setUserId(admin.getId());
                adminAlert.setType("SECURITY_ALERT");
                adminAlert.setPriority(severity);
                adminAlert.setStatus("UNREAD");
                adminAlert.setTitle(alert.getTitle());
                adminAlert.setContent(alert.getContent());
                adminAlert.setSummary(alert.getSummary());
                adminAlert.setIcon(alert.getIcon());
                adminAlert.setColor(alert.getColor());
                adminAlert.setIsDismissible(false);
                adminAlert.setAutoDismissSeconds(null);
                
                alertRepository.save(adminAlert);
            }
            
            log.info("✅ 보안 이벤트 시스템 알림 생성 완료: eventType={}, severity={}", eventType, severity);
            
        } catch (Exception e) {
            log.error("보안 이벤트 시스템 알림 생성 실패: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 이메일 본문 생성
     */
    private String buildEmailBody(String eventType, String severity, Map<String, Object> details) {
        StringBuilder body = new StringBuilder();
        body.append("보안 이벤트가 발생했습니다.\n\n");
        body.append("이벤트 유형: ").append(eventType).append("\n");
        body.append("심각도: ").append(severity).append("\n");
        body.append("발생 시간: ").append(LocalDateTime.now()).append("\n\n");
        body.append("상세 정보:\n");
        
        for (Map.Entry<String, Object> entry : details.entrySet()) {
            body.append("- ").append(entry.getKey()).append(": ").append(entry.getValue()).append("\n");
        }
        
        body.append("\n즉시 조치가 필요할 수 있습니다.");
        
        return body.toString();
    }
    
    /**
     * 알림 내용 생성
     */
    private String buildAlertContent(String eventType, String severity, Map<String, Object> details) {
        StringBuilder content = new StringBuilder();
        content.append("이벤트 유형: ").append(eventType).append("\n");
        content.append("심각도: ").append(severity).append("\n");
        content.append("발생 시간: ").append(LocalDateTime.now()).append("\n\n");
        
        for (Map.Entry<String, Object> entry : details.entrySet()) {
            content.append(entry.getKey()).append(": ").append(entry.getValue()).append("\n");
        }
        
        return content.toString();
    }
    
    /**
     * 심각도에 따른 색상 반환
     */
    private String getSeverityColor(String severity) {
        return switch (severity) {
            case "CRITICAL" -> "red";
            case "HIGH" -> "orange";
            case "MEDIUM" -> "yellow";
            case "LOW" -> "blue";
            default -> "gray";
        };
    }
}


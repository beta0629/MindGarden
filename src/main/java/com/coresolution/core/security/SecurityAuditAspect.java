package com.coresolution.core.security;

import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.SecurityAuditLog;
import com.coresolution.core.repository.SecurityAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * 보안 감사 AOP
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class SecurityAuditAspect {
    
    private final SecurityAuditLogRepository auditLogRepository;
    private final TenantContextHolder tenantContextHolder;
    
    /**
     * @SecurityAudit 어노테이션이 붙은 메서드 자동 로깅
     */
    @Around("@annotation(securityAudit)")
    public Object auditSecurityEvent(ProceedingJoinPoint joinPoint, SecurityAudit securityAudit) throws Throwable {
        String eventType = securityAudit.eventType();
        LocalDateTime startTime = LocalDateTime.now();
        String result = "SUCCESS";
        String errorMessage = null;
        
        try {
            Object returnValue = joinPoint.proceed();
            return returnValue;
            
        } catch (Exception e) {
            result = "FAILED";
            errorMessage = e.getMessage();
            throw e;
            
        } finally {
            // 보안 감사 로그 저장
            saveAuditLog(eventType, result, errorMessage, startTime);
        }
    }
    
    /**
     * 보안 감사 로그 저장
     */
    private void saveAuditLog(String eventType, String result, String errorMessage, LocalDateTime startTime) {
        try {
            // 테넌트 ID 조회
            String tenantId = null;
            try {
                tenantId = tenantContextHolder.getCurrentTenantId();
            } catch (Exception e) {
                // 테넌트 컨텍스트가 없는 경우 무시
            }
            
            // 사용자 정보 조회
            String userEmail = null;
            Long userId = null;
            try {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication != null && authentication.isAuthenticated()) {
                    userEmail = authentication.getName();
                    // userId는 Principal에서 추출 (구현에 따라 다름)
                }
            } catch (Exception e) {
                // 인증 정보가 없는 경우 무시
            }
            
            // HTTP 요청 정보 조회
            String ipAddress = null;
            String userAgent = null;
            try {
                ServletRequestAttributes attributes = 
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
                if (attributes != null) {
                    HttpServletRequest request = attributes.getRequest();
                    ipAddress = getClientIpAddress(request);
                    userAgent = request.getHeader("User-Agent");
                }
            } catch (Exception e) {
                // HTTP 요청 정보가 없는 경우 무시
            }
            
            // 실행 시간 계산
            long executionTime = Duration.between(startTime, LocalDateTime.now()).toMillis();
            
            // 로그 저장
            SecurityAuditLog log = SecurityAuditLog.builder()
                .tenantId(tenantId)
                .eventType(eventType)
                .userId(userId)
                .userEmail(userEmail)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .result(result)
                .errorMessage(errorMessage)
                .executionTime(executionTime)
                .build();
            
            auditLogRepository.save(log);
            
            log.debug("🔐 보안 감사 로그 저장: eventType={}, result={}, executionTime={}ms", 
                eventType, result, executionTime);
            
        } catch (Exception e) {
            log.error("보안 감사 로그 저장 실패: eventType={}", eventType, e);
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


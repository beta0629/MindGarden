package com.mindgarden.consultation.aspect;

import java.util.Map;
import com.mindgarden.consultation.annotation.RequireRole;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.util.SecurityUtils;
import com.mindgarden.consultation.utils.SessionUtils;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;

/**
 * 보안 권한 체크 AOP
 * @RequireRole 어노테이션이 붙은 메서드의 권한을 자동으로 체크
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@Aspect
@Component
public class SecurityAspect {
    
    @Around("@annotation(requireRole)")
    public Object checkPermission(ProceedingJoinPoint joinPoint, RequireRole requireRole) throws Throwable {
        try {
            // HTTP 세션 가져오기
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                log.warn("❌ HTTP 요청 컨텍스트를 찾을 수 없습니다.");
                return createUnauthorizedResponse();
            }
            
            HttpSession session = attributes.getRequest().getSession(false);
            if (session == null) {
                log.warn("❌ 세션이 없습니다.");
                return createUnauthorizedResponse();
            }
            
            // 권한 체크
            UserRole[] requiredRoles = requireRole.value();
            ResponseEntity<Map<String, Object>> permissionCheck = SecurityUtils.checkPermission(session, requiredRoles);
            
            if (permissionCheck != null) {
                log.warn("❌ 권한 없음: 필요한 역할={}, 현재 사용자={}", 
                    java.util.Arrays.toString(requiredRoles), 
                    SessionUtils.getCurrentUser(session) != null ? SessionUtils.getCurrentUser(session).getRole() : "null");
                return permissionCheck;
            }
            
            // 권한 있음 - 원래 메서드 실행
            return joinPoint.proceed();
            
        } catch (Exception e) {
            log.error("❌ 권한 체크 중 오류 발생: {}", e.getMessage(), e);
            return createForbiddenResponse("권한 체크 중 오류가 발생했습니다.");
        }
    }
    
    private ResponseEntity<Map<String, Object>> createUnauthorizedResponse() {
        return SecurityUtils.createUnauthorizedResponse();
    }
    
    private ResponseEntity<Map<String, Object>> createForbiddenResponse(String message) {
        return SecurityUtils.createForbiddenResponse(message);
    }
}

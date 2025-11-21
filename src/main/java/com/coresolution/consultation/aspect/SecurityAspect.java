package com.coresolution.consultation.aspect;

import java.util.Map;
import com.coresolution.consultation.annotation.RequireRole;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.util.SecurityUtils;
import com.coresolution.consultation.utils.SessionUtils;
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
 * <p><b>⚠️ Deprecated 경고:</b> 이 클래스는 SecurityUtils를 사용하며, 
 * 역할 기반 권한 체크를 수행합니다. 동적 권한 시스템으로 마이그레이션하려면 
 * {@link PermissionCheckUtils}를 사용하는 새로운 AOP를 고려하세요.</p>
 * 
 * <p><b>참고:</b> @RequireRole 어노테이션은 UserRole enum을 사용하므로, 
 * 완전한 마이그레이션을 위해서는 어노테이션도 권한 코드 기반으로 변경해야 합니다.</p>
 * 
 * @author MindGarden
 * @version 1.1.0 (Deprecated 경고 추가)
 * @since 2025-01-17
 * @deprecated SecurityUtils 기반 권한 체크는 하위 호환성을 위해 유지되지만, 
 *             새로운 코드에서는 {@link PermissionCheckUtils}를 사용하는 것을 권장합니다.
 */
@Deprecated
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

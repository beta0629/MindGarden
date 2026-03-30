/**
 * 업종 검증 AOP (동적 관리)
 * @RequireBusinessType 어노테이션 처리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
package com.coresolution.core.aspect;

import com.coresolution.core.annotation.RequireBusinessType;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class BusinessTypeAspect {
    
    private final TenantService tenantService;
    
    /**
     * @RequireBusinessType 어노테이션이 적용된 메서드 실행 전 업종 검증
     */
    @Around("@annotation(requireBusinessType)")
    public Object checkBusinessTypeOnMethod(ProceedingJoinPoint joinPoint, RequireBusinessType requireBusinessType) throws Throwable {
        return executeBusinessTypeCheck(joinPoint, requireBusinessType);
    }
    
    /**
     * @RequireBusinessType 어노테이션이 적용된 클래스의 모든 메서드 실행 전 업종 검증
     */
    @Around("@within(requireBusinessType)")
    public Object checkBusinessTypeOnClass(ProceedingJoinPoint joinPoint, RequireBusinessType requireBusinessType) throws Throwable {
        return executeBusinessTypeCheck(joinPoint, requireBusinessType);
    }
    
    /**
     * 업종 검증 실행
     */
    private Object executeBusinessTypeCheck(ProceedingJoinPoint joinPoint, RequireBusinessType requireBusinessType) throws Throwable {
        try {
            // 1. 테넌트 정보 조회
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                log.warn("업종 검증 실패: 테넌트 정보가 없습니다. 메서드: {}", joinPoint.getSignature().getName());
                throw new AccessDeniedException("테넌트 정보가 없습니다.");
            }
            
            // 2. 업종 정보 조회 (캐시 적용)
            String businessType = getBusinessTypeWithCache(tenantId);
            if (businessType == null) {
                log.warn("업종 검증 실패: 업종 정보를 찾을 수 없습니다. 테넌트: {}", tenantId);
                throw new AccessDeniedException("업종 정보를 찾을 수 없습니다.");
            }
            
            // 3. 업종 검증
            BusinessTypeValidationResult validationResult = validateBusinessType(
                businessType, requireBusinessType, joinPoint.getSignature().getName()
            );
            
            if (!validationResult.isValid()) {
                log.warn("업종 접근 거부: {}", validationResult.getReason());
                throw new AccessDeniedException(validationResult.getMessage());
            }
            
            // 4. 추가 검증 (역할, 기능 플래그)
            if (requireBusinessType.requireRoleCheck()) {
                validateRoles(requireBusinessType.requiredRoles(), joinPoint.getSignature().getName());
            }
            
            if (requireBusinessType.requiredFeatures().length > 0) {
                validateFeatures(requireBusinessType.requiredFeatures(), tenantId);
            }
            
            log.debug("업종 검증 성공: 테넌트={}, 업종={}, 메서드={}", 
                tenantId, businessType, joinPoint.getSignature().getName());
            
            // 5. 원본 메서드 실행
            return joinPoint.proceed();
            
        } catch (AccessDeniedException e) {
            // 접근 거부 예외는 그대로 전파
            throw e;
        } catch (Exception e) {
            log.error("업종 검증 중 예상치 못한 오류 발생: 메서드={}", joinPoint.getSignature().getName(), e);
            throw new AccessDeniedException("업종 검증 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 캐시를 적용한 업종 정보 조회
     */
    @Cacheable(value = "tenantBusinessType", key = "#tenantId")
    private String getBusinessTypeWithCache(String tenantId) {
        try {
            return tenantService.getBusinessType(tenantId);
        } catch (Exception e) {
            log.error("업종 정보 조회 실패: 테넌트={}", tenantId, e);
            return null;
        }
    }
    
    /**
     * 업종 검증
     */
    private BusinessTypeValidationResult validateBusinessType(String actualBusinessType, RequireBusinessType annotation, String methodName) {
        String[] requiredTypes = annotation.value();
        boolean strict = annotation.strict();
        String customMessage = annotation.message();
        
        if (requiredTypes == null || requiredTypes.length == 0) {
            return BusinessTypeValidationResult.invalid(
                "필요한 업종이 지정되지 않았습니다.",
                customMessage
            );
        }
        
        List<String> allowedTypes = Arrays.asList(requiredTypes);
        
        // 엄격한 모드: 정확히 일치해야 함
        if (strict) {
            if (allowedTypes.contains(actualBusinessType)) {
                return BusinessTypeValidationResult.valid();
            } else {
                return BusinessTypeValidationResult.invalid(
                    String.format("업종 불일치: 필요=%s, 실제=%s, 메서드=%s", 
                        Arrays.toString(requiredTypes), actualBusinessType, methodName),
                    customMessage
                );
            }
        }
        
        // 일반 모드: 포함되면 허용
        boolean isAllowed = allowedTypes.stream()
            .anyMatch(requiredType -> 
                requiredType.equalsIgnoreCase(actualBusinessType) ||
                actualBusinessType.toUpperCase().contains(requiredType.toUpperCase())
            );
        
        if (isAllowed) {
            return BusinessTypeValidationResult.valid();
        } else {
            return BusinessTypeValidationResult.invalid(
                String.format("업종 접근 거부: 허용=%s, 실제=%s, 메서드=%s", 
                    Arrays.toString(requiredTypes), actualBusinessType, methodName),
                customMessage
            );
        }
    }
    
    /**
     * 역할 검증
     */
    private void validateRoles(String[] requiredRoles, String methodName) {
        if (requiredRoles == null || requiredRoles.length == 0) {
            return; // 필요한 역할이 없으면 통과
        }
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("인증이 필요합니다.");
        }
        
        String userRole = getUserRole(authentication);
        if (userRole == null) {
            throw new AccessDeniedException("사용자 역할 정보가 없습니다.");
        }
        
        List<String> allowedRoles = Arrays.asList(requiredRoles);
        boolean hasRequiredRole = allowedRoles.stream()
            .anyMatch(role -> role.equalsIgnoreCase(userRole));
        
        if (!hasRequiredRole) {
            log.warn("역할 접근 거부: 필요={}, 실제={}, 메서드={}", 
                Arrays.toString(requiredRoles), userRole, methodName);
            throw new AccessDeniedException("필요한 역할 권한이 없습니다.");
        }
    }
    
    /**
     * 기능 플래그 검증
     */
    private void validateFeatures(String[] requiredFeatures, String tenantId) {
        if (requiredFeatures == null || requiredFeatures.length == 0) {
            return; // 필요한 기능이 없으면 통과
        }
        
        for (String feature : requiredFeatures) {
            if (!isFeatureEnabled(tenantId, feature)) {
                log.warn("기능 플래그 접근 거부: 기능={}, 테넌트={}", feature, tenantId);
                throw new AccessDeniedException("필요한 기능이 활성화되지 않았습니다: " + feature);
            }
        }
    }
    
    /**
     * 사용자 역할 추출
     */
    private String getUserRole(Authentication authentication) {
        // Spring Security의 Authentication에서 역할 정보 추출
        // 구현은 실제 인증 시스템에 따라 달라질 수 있음
        
        if (authentication.getAuthorities() != null && !authentication.getAuthorities().isEmpty()) {
            return authentication.getAuthorities().iterator().next().getAuthority();
        }
        
        // Principal에서 역할 정보 추출 시도
        Object principal = authentication.getPrincipal();
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            org.springframework.security.core.userdetails.UserDetails userDetails = 
                (org.springframework.security.core.userdetails.UserDetails) principal;
            if (!userDetails.getAuthorities().isEmpty()) {
                return userDetails.getAuthorities().iterator().next().getAuthority();
            }
        }
        
        return null;
    }
    
    /**
     * 기능 플래그 활성화 여부 확인 (캐시 적용)
     */
    @Cacheable(value = "tenantFeatureFlag", key = "#tenantId + '_' + #feature")
    private boolean isFeatureEnabled(String tenantId, String feature) {
        try {
            // TODO: FeatureFlagService를 통해 기능 플래그 확인
            // 현재는 기본적으로 모든 기능이 활성화된 것으로 처리
            return true;
        } catch (Exception e) {
            log.error("기능 플래그 확인 실패: 테넌트={}, 기능={}", tenantId, feature, e);
            return false;
        }
    }
    
    /**
     * 업종 검증 결과 클래스
     */
    private static class BusinessTypeValidationResult {
        private final boolean valid;
        private final String reason;
        private final String message;
        
        private BusinessTypeValidationResult(boolean valid, String reason, String message) {
            this.valid = valid;
            this.reason = reason;
            this.message = message;
        }
        
        public static BusinessTypeValidationResult valid() {
            return new BusinessTypeValidationResult(true, null, null);
        }
        
        public static BusinessTypeValidationResult invalid(String reason, String message) {
            return new BusinessTypeValidationResult(false, reason, message);
        }
        
        public boolean isValid() { return valid; }
        public String getReason() { return reason; }
        public String getMessage() { return message; }
    }
}

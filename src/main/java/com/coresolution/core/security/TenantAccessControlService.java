package com.coresolution.core.security;

import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.TenantPgConfiguration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Collection;

/**
 * 테넌트 접근 제어 서비스
 * 
 * <p>테넌트별 리소스 접근 권한을 검증하는 중앙화된 서비스입니다.</p>
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
public class TenantAccessControlService {
    
    /**
     * 테넌트 접근 권한을 확인합니다.
     * 
     * <p>현재 사용자가 요청한 테넌트에 접근할 수 있는지 확인합니다.</p>
     * 
     * @param requestedTenantId 요청한 테넌트 ID
     * @throws AccessDeniedException 접근 권한이 없는 경우
     * @throws IllegalStateException 테넌트 컨텍스트가 설정되지 않은 경우
     */
    public void validateTenantAccess(String requestedTenantId) {
        // 운영 포털 관리자는 모든 테넌트에 접근 가능
        if (hasOpsRole()) {
            log.debug("운영 포털 관리자 접근 허용: requestedTenantId={}", requestedTenantId);
            return;
        }
        
        // 테넌트 컨텍스트 확인
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null) {
            throw new IllegalStateException("테넌트 컨텍스트가 설정되지 않았습니다");
        }
        
        // 현재 테넌트와 요청한 테넌트가 일치해야 함
        if (!currentTenantId.equals(requestedTenantId)) {
            log.warn("테넌트 접근 거부: currentTenantId={}, requestedTenantId={}", 
                    currentTenantId, requestedTenantId);
            throw new AccessDeniedException("해당 테넌트에 대한 접근 권한이 없습니다");
        }
        
        log.debug("테넌트 접근 허용: tenantId={}", requestedTenantId);
    }
    
    /**
     * PG 설정에 대한 테넌트 접근 권한을 확인합니다.
     * 
     * @param configuration PG 설정 엔티티
     * @param requestedTenantId 요청한 테넌트 ID
     * @throws AccessDeniedException 접근 권한이 없는 경우
     */
    public void validateConfigurationAccess(TenantPgConfiguration configuration, String requestedTenantId) {
        // 운영 포털 관리자는 모든 설정에 접근 가능
        if (hasOpsRole()) {
            log.debug("운영 포털 관리자 PG 설정 접근 허용: configId={}, tenantId={}", 
                    configuration.getConfigId(), requestedTenantId);
            return;
        }
        
        // 테넌트 접근 권한 확인
        validateTenantAccess(requestedTenantId);
        
        // PG 설정의 테넌트 ID 확인
        if (!configuration.getTenantId().equals(requestedTenantId)) {
            log.warn("PG 설정 접근 거부: configTenantId={}, requestedTenantId={}, configId={}", 
                    configuration.getTenantId(), requestedTenantId, configuration.getConfigId());
            throw new AccessDeniedException("해당 테넌트의 PG 설정이 아닙니다");
        }
        
        log.debug("PG 설정 접근 허용: configId={}, tenantId={}", 
                configuration.getConfigId(), requestedTenantId);
    }
    
    /**
     * 운영 포털 접근 권한을 확인합니다.
     * 
     * @throws AccessDeniedException 운영 포털 접근 권한이 없는 경우
     */
    public void validateOpsAccess() {
        if (!hasOpsRole()) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication != null ? authentication.getName() : "anonymous";
            log.warn("운영 포털 접근 거부: username={}", username);
            throw new AccessDeniedException("운영 포털 접근 권한이 없습니다 (ADMIN 또는 OPS 역할 필요)");
        }
        
        log.debug("운영 포털 접근 허용");
    }
    
    /**
     * 현재 사용자가 운영 포털 역할을 가지고 있는지 확인합니다.
     * 
     * @return 운영 포털 역할 보유 여부
     */
    public boolean hasOpsRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        return authorities.stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN") || 
                               auth.getAuthority().equals("ROLE_OPS"));
    }
    
    /**
     * 현재 사용자 ID를 가져옵니다.
     * 
     * @return 현재 사용자 ID (인증되지 않은 경우 null)
     */
    public String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        
        return authentication.getName();
    }
    
    /**
     * 현재 테넌트 ID를 가져옵니다.
     * 
     * @return 현재 테넌트 ID (설정되지 않은 경우 null)
     */
    public String getCurrentTenantId() {
        return TenantContextHolder.getTenantId();
    }
}


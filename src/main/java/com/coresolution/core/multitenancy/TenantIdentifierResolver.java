package com.coresolution.core.multitenancy;

import com.coresolution.core.context.TenantContext;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

/**
 * Hibernate MultiTenancy - Tenant Identifier Resolver
 * 현재 요청의 테넌트 ID를 Hibernate에 제공
 * 
 * DISCRIMINATOR 전략 사용: 모든 테이블에 tenant_id 컬럼이 있고,
 * 쿼리 시 자동으로 WHERE tenant_id = ? 조건이 추가됨
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver<String> {
    
    /**
     * 기본 테넌트 ID (테넌트 컨텍스트가 없을 때 사용)
     * 주의: 실제 운영에서는 null을 반환하여 예외를 발생시키는 것이 안전함
     */
    private static final String DEFAULT_TENANT_ID = null;
    
    /**
     * 현재 요청의 테넌트 ID를 반환
     * 
     * @return 테넌트 UUID
     */
    @Override
    public String resolveCurrentTenantIdentifier() {
        String tenantId = TenantContext.getTenantId();
        
        if (tenantId == null || tenantId.isEmpty()) {
            // 테넌트 컨텍스트가 없는 경우
            // HQ 관리자나 시스템 작업의 경우일 수 있음
            if (log.isDebugEnabled()) {
                log.debug("No tenant ID in context, using default: {}", DEFAULT_TENANT_ID);
            }
            return DEFAULT_TENANT_ID;
        }
        
        if (log.isTraceEnabled()) {
            log.trace("Resolved tenant ID: {}", tenantId);
        }
        
        return tenantId;
    }
    
    /**
     * 현재 테넌트 ID가 유효한지 확인
     * 
     * @param tenantId 테넌트 UUID
     * @return 유효하면 true
     */
    @Override
    public boolean validateExistingCurrentSessions() {
        // 기존 세션의 테넌트 ID가 변경되었는지 검증
        // true: 기존 세션 유지, false: 기존 세션 무효화
        return true;
    }
    
    /**
     * 테넌트 ID가 변경되었을 때 기존 세션을 무효화할지 여부
     * 
     * @return true: 세션 무효화, false: 세션 유지
     */
    @Override
    public boolean isRoot(String tenantId) {
        // root 테넌트 (HQ 관리자)인지 확인
        // null이거나 특정 값이면 root로 간주
        return tenantId == null || tenantId.isEmpty();
    }
}


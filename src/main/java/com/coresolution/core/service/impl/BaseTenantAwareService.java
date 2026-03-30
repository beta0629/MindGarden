package com.coresolution.core.service.impl;

import com.coresolution.core.context.TenantContextHolder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 테넌트 인식 기본 서비스 클래스
 * 
 * <p>모든 서비스가 상속받아서 tenantId를 자동으로 처리할 수 있도록 하는 기본 클래스입니다.</p>
 * <p>이 클래스를 상속받으면 tenantId를 매번 가져오는 코드를 반복하지 않아도 됩니다.</p>
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-05
 */
@Slf4j
@Service
@Transactional
public abstract class BaseTenantAwareService {
    
    /**
     * 현재 컨텍스트의 tenantId를 가져옵니다.
     * tenantId가 없으면 예외를 발생시킵니다.
     * 
     * @return tenantId (null이 아님)
     * @throws IllegalStateException tenantId가 설정되지 않은 경우
     */
    protected String getTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
    
    /**
     * 현재 컨텍스트의 tenantId를 가져옵니다 (안전한 방식).
     * tenantId가 없으면 null을 반환합니다.
     * 
     * @return tenantId (없으면 null)
     */
    protected String getTenantIdOrNull() {
        return TenantContextHolder.getTenantId();
    }
    
    /**
     * tenantId가 설정되어 있는지 확인합니다.
     * 
     * @return tenantId가 설정되어 있으면 true
     */
    protected boolean hasTenantId() {
        return TenantContextHolder.isTenantContextSet();
    }
    
    /**
     * tenantId가 없으면 예외를 발생시킵니다.
     * 
     * @throws IllegalStateException tenantId가 설정되지 않은 경우
     */
    protected void requireTenantId() {
        if (!hasTenantId()) {
            throw new IllegalStateException("Tenant ID is required but not set in current context");
        }
    }
}


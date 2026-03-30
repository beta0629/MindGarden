package com.coresolution.core.service;

import com.coresolution.core.dto.PgConfigurationKeysResponse;

/**
 * 테넌트 PG 설정 복호화 서비스
 * 
 * <p>PG 설정의 API Key와 Secret Key를 복호화하여 반환합니다.
 * 보안상 이 서비스는 제한된 권한을 가진 사용자만 사용할 수 있습니다.</p>
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface TenantPgConfigurationDecryptionService {
    
    /**
     * PG 설정의 키를 복호화하여 반환합니다.
     * 
     * <p>권한 요구사항:</p>
     * <ul>
     *   <li>테넌트 소유자: 자신의 테넌트 설정만 복호화 가능</li>
     *   <li>운영 포털 관리자: 모든 테넌트 설정 복호화 가능</li>
     * </ul>
     * 
     * @param tenantId 테넌트 ID
     * @param configId PG 설정 ID
     * @param requestedBy 요청자 (권한 확인용)
     * @return 복호화된 API Key와 Secret Key
     * @throws IllegalArgumentException PG 설정을 찾을 수 없거나 권한이 없는 경우
     * @throws IllegalStateException 복호화 실패 시
     */
    PgConfigurationKeysResponse decryptKeys(String tenantId, String configId, String requestedBy);
    
    /**
     * 운영 포털에서 PG 설정의 키를 복호화하여 반환합니다.
     * 
     * <p>권한 요구사항: ADMIN 또는 OPS 역할 필요</p>
     * 
     * @param configId PG 설정 ID
     * @param requestedBy 요청자 (권한 확인용)
     * @return 복호화된 API Key와 Secret Key
     * @throws IllegalArgumentException PG 설정을 찾을 수 없거나 권한이 없는 경우
     * @throws IllegalStateException 복호화 실패 시
     */
    PgConfigurationKeysResponse decryptKeysForOps(String configId, String requestedBy);
}


/**
 * 테넌트 서비스 인터페이스
 * 테넌트 정보 관리를 위한 서비스 계층
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
package com.coresolution.core.service;

import com.coresolution.core.domain.Tenant;
import com.coresolution.core.dto.TenantNameUpdateRequest;
import com.coresolution.core.dto.TenantNameUpdateResponse;
import java.util.Optional;

public interface TenantService {

    /**
     * 테넌트 단건 조회 (캐싱 적용, Phase1 B7).
     *
     * <p>{@code /auth/current-user} 등 빈번한 호출 경로에서 매 요청마다 DB 조회가 발생하지 않도록
     * Caffeine {@code tenantById} 캐시(TTL 10분, maximumSize 1000)에 보관한다. 테넌트 정보 변경 API
     * ({@link #updateTenantDisplayName(String, TenantNameUpdateRequest)})에서 evict 한다.</p>
     *
     * @param tenantId 테넌트 UUID
     * @return 활성(=is_deleted=false) 테넌트 Optional
     */
    Optional<Tenant> getTenantById(String tenantId);

    /**
     * 테넌트의 업종 타입 조회
     * @param tenantId 테넌트 ID
     * @return 업종 타입
     */
    String getBusinessType(String tenantId);
    
    /**
     * 테넌트 정보 존재 여부 확인
     * @param tenantId 테넌트 ID
     * @return 존재 여부
     */
    boolean existsTenant(String tenantId);
    
    /**
     * 테넌트 활성 상태 확인
     * @param tenantId 테넌트 ID
     * @return 활성 상태 여부
     */
    boolean isActiveTenant(String tenantId);
    
    /**
     * 모든 활성 테넌트 ID 목록 조회
     * @return 활성 테넌트 ID 목록
     */
    java.util.List<String> getAllActiveTenantIds();

    /**
     * 테넌트 표시명({@code tenants.name})을 변경합니다.
     *
     * @param tenantId 테넌트 ID
     * @param request  새 이름 요청
     * @return 갱신 후 스냅샷
     */
    TenantNameUpdateResponse updateTenantDisplayName(String tenantId, TenantNameUpdateRequest request);
}

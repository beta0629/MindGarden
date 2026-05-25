package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, Long> {
    
    // ==================== tenantId 필터링 메서드 ====================
    
    @Query("SELECT sc FROM SystemConfig sc WHERE sc.tenantId = :tenantId AND sc.configKey = :configKey AND sc.isActive = true")
    Optional<SystemConfig> findByTenantIdAndConfigKeyAndIsActiveTrue(@Param("tenantId") String tenantId, @Param("configKey") String configKey);
    
    @Query("SELECT sc FROM SystemConfig sc WHERE sc.tenantId = :tenantId AND sc.category = :category AND sc.isActive = true")
    List<SystemConfig> findByTenantIdAndCategoryAndIsActiveTrue(@Param("tenantId") String tenantId, @Param("category") String category);

    /**
     * 전역(테넌트 비종속) 설정 조회.
     *
     * <p>{@code tenant_id = ''} (빈 문자열, V20260228_001 표준화) 시 단일 행을 조회한다.
     * 발송 스케줄러 ON/OFF 같은 운영 전역 토글 키에 사용 — 자세한 규약은
     * {@code com.coresolution.consultation.constant.NotificationSchedulerFlagKeys} 참조.
     *
     * @param configKey 설정 키
     * @return 활성 전역 행 (없으면 empty)
     */
    @Query("SELECT sc FROM SystemConfig sc WHERE sc.tenantId = '' AND sc.configKey = :configKey AND sc.isActive = true")
    Optional<SystemConfig> findGlobalByConfigKey(@Param("configKey") String configKey);
    
    // ==================== @Deprecated 메서드 (하위 호환성) ====================
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndConfigKeyAndIsActiveTrue 사용하세요.
     */
    @Deprecated
    Optional<SystemConfig> findByConfigKeyAndIsActiveTrue(String configKey);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndCategoryAndIsActiveTrue 사용하세요.
     */
    @Deprecated
    List<SystemConfig> findByCategoryAndIsActiveTrue(String category);
}

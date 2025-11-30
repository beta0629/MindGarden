package com.coresolution.consultation.repository;

import java.util.List;
import com.coresolution.consultation.entity.WarmWords;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 따뜻한 말 데이터 레포지토리
 */
@Repository
public interface WarmWordsRepository extends JpaRepository<WarmWords, Long> {
    
    // ==================== tenantId 필터링 메서드 ====================
    
    /**
     * 대상 역할별 랜덤 따뜻한 말 조회 (tenantId 필터링)
     * @param tenantId 테넌트 ID
     * @param consultantRole 대상 역할
     * @return 랜덤 따뜻한 말
     */
    @Query(value = "SELECT * FROM warm_words WHERE tenant_id = :tenantId AND consultant_role = :consultantRole AND is_active = true ORDER BY RAND() LIMIT 1", nativeQuery = true)
    WarmWords findRandomByTenantIdAndTargetRole(@Param("tenantId") String tenantId, @Param("consultantRole") String consultantRole);
    
    /**
     * 랜덤 따뜻한 말 조회 (역할 무관) (tenantId 필터링)
     * @param tenantId 테넌트 ID
     * @return 랜덤 따뜻한 말
     */
    @Query(value = "SELECT * FROM warm_words WHERE tenant_id = :tenantId AND is_active = true ORDER BY RAND() LIMIT 1", nativeQuery = true)
    WarmWords findRandomByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 대상 역할별 따뜻한 말 목록 조회 (tenantId 필터링)
     * @param tenantId 테넌트 ID
     * @param consultantRole 대상 역할
     * @param isActive 활성 상태
     * @return 따뜻한 말 목록
     */
    @Query("SELECT w FROM WarmWords w WHERE w.tenantId = :tenantId AND w.consultantRole = :consultantRole AND w.isActive = :isActive")
    List<WarmWords> findByTenantIdAndConsultantRoleAndIsActive(@Param("tenantId") String tenantId, @Param("consultantRole") String consultantRole, @Param("isActive") Boolean isActive);
    
    // ==================== @Deprecated 메서드 (하위 호환성) ====================
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findRandomByTenantIdAndTargetRole 사용하세요.
     */
    @Deprecated
    @Query(value = "SELECT * FROM warm_words WHERE consultant_role = ?1 AND is_active = true ORDER BY RAND() LIMIT 1", nativeQuery = true)
    WarmWords findRandomByTargetRole(String consultantRole);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findRandomByTenantId 사용하세요.
     */
    @Deprecated
    @Query(value = "SELECT * FROM warm_words WHERE is_active = true ORDER BY RAND() LIMIT 1", nativeQuery = true)
    WarmWords findRandom();
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndConsultantRoleAndIsActive 사용하세요.
     */
    @Deprecated
    List<WarmWords> findByConsultantRoleAndIsActive(String consultantRole, Boolean isActive);
}

package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.CommonCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CommonCodeRepository extends JpaRepository<CommonCode, Long> {

    // 코드 그룹별 조회
    List<CommonCode> findByCodeGroupOrderBySortOrderAsc(String codeGroup);
    
    // 활성 코드만 조회
    List<CommonCode> findByCodeGroupAndIsActiveTrueOrderBySortOrderAsc(String codeGroup);
    
    // 코드 그룹과 값으로 조회
    Optional<CommonCode> findByCodeGroupAndCodeValue(String codeGroup, String codeValue);
    
    // 코드 그룹과 값으로 활성 코드 조회
    Optional<CommonCode> findByCodeGroupAndCodeValueAndIsActiveTrue(String codeGroup, String codeValue);
    
    // 상위 코드 그룹별 조회
    List<CommonCode> findByParentCodeGroupOrderBySortOrderAsc(String parentCodeGroup);
    
    // 모든 코드 그룹 목록 조회 (상담패키지 관련 항목을 먼저 표시)
    @Query("SELECT DISTINCT c.codeGroup FROM CommonCode c WHERE c.isActive = true ORDER BY " +
           "CASE " +
           "WHEN c.codeGroup = 'CONSULTATION_PACKAGE' THEN 1 " +
           "WHEN c.codeGroup = 'PACKAGE_TYPE' THEN 2 " +
           "WHEN c.codeGroup LIKE '%PACKAGE%' THEN 3 " +
           "WHEN c.codeGroup LIKE '%CONSULTATION%' THEN 4 " +
           "ELSE 5 " +
           "END, c.codeGroup")
    List<String> findAllActiveCodeGroups();
    
    // 코드 그룹별 개수 조회
    @Query("SELECT COUNT(c) FROM CommonCode c WHERE c.codeGroup = :codeGroup")
    long countByCodeGroup(@Param("codeGroup") String codeGroup);
    
    // 활성 코드 그룹별 개수 조회
    @Query("SELECT COUNT(c) FROM CommonCode c WHERE c.codeGroup = :codeGroup AND c.isActive = true")
    long countActiveByCodeGroup(@Param("codeGroup") String codeGroup);
    
    // 코드 값이 특정 문자열로 시작하는 활성 코드 조회
    List<CommonCode> findByCodeGroupAndCodeValueStartingWithAndIsActiveTrue(String codeGroup, String codeValuePrefix);
    
    // 코드 값이 특정 문자열로 끝나는 활성 코드 조회
    List<CommonCode> findByCodeGroupAndCodeValueEndingWithAndIsActiveTrue(String codeGroup, String codeValueSuffix);
    
    // 모든 코드 그룹 목록 조회 (간단한 버전)
    @Query("SELECT DISTINCT c.codeGroup FROM CommonCode c ORDER BY c.codeGroup")
    List<String> findDistinctCodeGroups();
    
    // 코드값으로 조회
    List<CommonCode> findByCodeValue(String codeValue);
    
    // ==================== 코어솔루션 코드 조회 ====================
    
    /**
     * 코어솔루션 코드 그룹별 조회 (tenant_id = NULL)
     */
    @Query("SELECT c FROM CommonCode c WHERE c.tenantId IS NULL AND c.codeGroup = :codeGroup AND c.isActive = true ORDER BY c.sortOrder ASC")
    List<CommonCode> findCoreCodesByGroup(@Param("codeGroup") String codeGroup);
    
    /**
     * 코어솔루션 코드 그룹과 값으로 조회
     */
    @Query("SELECT c FROM CommonCode c WHERE c.tenantId IS NULL AND c.codeGroup = :codeGroup AND c.codeValue = :codeValue AND c.isActive = true")
    Optional<CommonCode> findCoreCodeByGroupAndValue(@Param("codeGroup") String codeGroup, @Param("codeValue") String codeValue);
    
    // ==================== 테넌트별 코드 조회 ====================
    
    /**
     * 테넌트별 코드 그룹별 조회
     */
    @Query("SELECT c FROM CommonCode c WHERE c.tenantId = :tenantId AND c.codeGroup = :codeGroup AND c.isActive = true ORDER BY c.sortOrder ASC")
    List<CommonCode> findTenantCodesByGroup(@Param("tenantId") String tenantId, @Param("codeGroup") String codeGroup);
    
    /**
     * 테넌트별 코드 그룹과 값으로 조회
     */
    @Query("SELECT c FROM CommonCode c WHERE c.tenantId = :tenantId AND c.codeGroup = :codeGroup AND c.codeValue = :codeValue AND c.isActive = true")
    Optional<CommonCode> findTenantCodeByGroupAndValue(@Param("tenantId") String tenantId, @Param("codeGroup") String codeGroup, @Param("codeValue") String codeValue);
    
    // ==================== 통합 조회 (하위 호환성) ====================
    
    /**
     * 현재 테넌트 컨텍스트 기반 코드 조회
     * 1. 테넌트별 코드 조회 시도
     * 2. 없으면 코어솔루션 코드 조회 (폴백)
     */
    @Query("SELECT c FROM CommonCode c WHERE " +
           "((c.tenantId = :tenantId AND c.codeGroup = :codeGroup) OR " +
           "(c.tenantId IS NULL AND c.codeGroup = :codeGroup)) " +
           "AND c.isActive = true " +
           "ORDER BY c.tenantId DESC NULLS LAST, c.sortOrder ASC")
    List<CommonCode> findCodesByGroupWithFallback(@Param("tenantId") String tenantId, @Param("codeGroup") String codeGroup);
    
    /**
     * 현재 테넌트 컨텍스트 기반 코드 조회 (값으로)
     */
    @Query("SELECT c FROM CommonCode c WHERE " +
           "((c.tenantId = :tenantId AND c.codeGroup = :codeGroup AND c.codeValue = :codeValue) OR " +
           "(c.tenantId IS NULL AND c.codeGroup = :codeGroup AND c.codeValue = :codeValue)) " +
           "AND c.isActive = true " +
           "ORDER BY c.tenantId DESC NULLS LAST")
    Optional<CommonCode> findCodeByGroupAndValueWithFallback(
        @Param("tenantId") String tenantId, 
        @Param("codeGroup") String codeGroup, 
        @Param("codeValue") String codeValue
    );
}

package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 정산 결과 Repository
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 */
@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {
    
    /**
     * 테넌트별 정산 목록 조회
     */
    @Query("SELECT s FROM Settlement s WHERE s.tenantId = :tenantId AND s.isDeleted = false ORDER BY s.settlementPeriod DESC, s.createdAt DESC")
    List<Settlement> findByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 테넌트별 정산 번호로 조회
     */
    @Query("SELECT s FROM Settlement s WHERE s.tenantId = :tenantId AND s.settlementNumber = :settlementNumber AND s.isDeleted = false")
    Optional<Settlement> findByTenantIdAndSettlementNumber(@Param("tenantId") String tenantId, 
                                                             @Param("settlementNumber") String settlementNumber);
    
    /**
     * 테넌트별 기간별 정산 조회
     */
    @Query("SELECT s FROM Settlement s WHERE s.tenantId = :tenantId AND s.settlementPeriod = :period AND s.isDeleted = false")
    Optional<Settlement> findByTenantIdAndPeriod(@Param("tenantId") String tenantId, @Param("period") String period);
    
    /**
     * 테넌트별 상태별 정산 조회
     */
    @Query("SELECT s FROM Settlement s WHERE s.tenantId = :tenantId AND s.status = :status AND s.isDeleted = false ORDER BY s.settlementPeriod DESC")
    List<Settlement> findByTenantIdAndStatus(@Param("tenantId") String tenantId, 
                                              @Param("status") Settlement.SettlementStatus status);
    
    /**
     * 테넌트별 연도별 최대 시퀀스 조회 (정산 번호 생성용)
     */
    @Query("SELECT MAX(CAST(SUBSTRING(s.settlementNumber, LENGTH(s.settlementNumber) - 3) AS int)) FROM Settlement s WHERE s.tenantId = :tenantId AND s.settlementNumber LIKE :pattern")
    Integer findMaxSequenceByTenantIdAndPeriod(@Param("tenantId") String tenantId, @Param("pattern") String pattern);
}


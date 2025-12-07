package com.coresolution.consultation.repository;

import java.util.List;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
/**
 * @Deprecated - 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용
 */
public interface ConsultantClientMappingRepository extends JpaRepository<ConsultantClientMapping, Long> {

    // 테넌트별 모든 매칭 조회 (tenantId 필터링)
    List<ConsultantClientMapping> findByTenantId(String tenantId);
    
    // 상담사별 매칭 조회 (tenantId 필터링 필수)
    List<ConsultantClientMapping> findByTenantIdAndConsultant(String tenantId, User consultant);
    
    // 내담자별 매칭 조회 (tenantId 필터링 필수)
    List<ConsultantClientMapping> findByTenantIdAndClient(String tenantId, User client);
    
    // 활성 상태의 매칭만 조회 (tenantId 필터링 필수)
    List<ConsultantClientMapping> findByTenantIdAndStatus(String tenantId, ConsultantClientMapping.MappingStatus status);
    
    // 상담사와 내담자로 특정 매칭 조회 (tenantId 필터링 필수)
    List<ConsultantClientMapping> findByTenantIdAndConsultantAndClient(String tenantId, User consultant, User client);
    
    // 상담사와 내담자로 활성 상태의 매칭 존재 여부 확인 (tenantId 필터링 필수)
    boolean existsByTenantIdAndConsultantAndClientAndStatus(String tenantId, User consultant, User client, ConsultantClientMapping.MappingStatus status);
    
    // 상담사별 활성 매칭 수 조회 (tenantId 필터링)
    @Query("SELECT COUNT(m) FROM ConsultantClientMapping m WHERE m.tenantId = :tenantId AND m.consultant = :consultant AND m.status = 'ACTIVE'")
    long countActiveMappingsByConsultant(@Param("tenantId") String tenantId, @Param("consultant") User consultant);
    
    // 내담자별 활성 매칭 수 조회 (tenantId 필터링)
    @Query("SELECT COUNT(m) FROM ConsultantClientMapping m WHERE m.tenantId = :tenantId AND m.client = :client AND m.status = 'ACTIVE'")
    long countActiveMappingsByClient(@Param("tenantId") String tenantId, @Param("client") User client);
    
    // 날짜 범위로 매칭 조회 (tenantId 필터링)
    @Query("SELECT m FROM ConsultantClientMapping m WHERE m.tenantId = :tenantId AND m.startDate >= :startDate AND m.endDate <= :endDate")
    List<ConsultantClientMapping> findByDateRange(@Param("tenantId") String tenantId,
                                                 @Param("startDate") java.time.LocalDate startDate, 
                                                 @Param("endDate") java.time.LocalDate endDate);
    
    // 테넌트별 모든 매칭을 관련 엔티티와 함께 조회 (tenantId 필터링 필수)
    @Query("SELECT m FROM ConsultantClientMapping m LEFT JOIN FETCH m.consultant LEFT JOIN FETCH m.client WHERE m.tenantId = :tenantId ORDER BY m.updatedAt DESC, m.createdAt DESC")
    List<ConsultantClientMapping> findAllWithDetailsByTenantId(@Param("tenantId") String tenantId);
    
    // 테넌트별 활성 매칭을 관련 엔티티와 함께 조회 (tenantId 필터링 필수)
    @Query("SELECT m FROM ConsultantClientMapping m LEFT JOIN FETCH m.consultant LEFT JOIN FETCH m.client WHERE m.tenantId = :tenantId AND m.status = 'ACTIVE'")
    List<ConsultantClientMapping> findActiveMappingsWithDetailsByTenantId(@Param("tenantId") String tenantId);
    
    // 상담사 ID로 매칭 조회 (특정 상태 제외, tenantId 필터링)
    @Query("SELECT m FROM ConsultantClientMapping m LEFT JOIN FETCH m.consultant LEFT JOIN FETCH m.client WHERE m.tenantId = :tenantId AND m.consultant.id = :consultantId AND m.status != :status")
    List<ConsultantClientMapping> findByConsultantIdAndStatusNot(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId, @Param("status") ConsultantClientMapping.MappingStatus status);
    
    // 상담사 ID와 브랜치 코드로 매칭 조회 (특정 상태 제외, tenantId 필터링)
    @Query("SELECT m FROM ConsultantClientMapping m LEFT JOIN FETCH m.consultant LEFT JOIN FETCH m.client WHERE m.tenantId = :tenantId AND m.consultant.id = :consultantId AND m.branchCode = :branchCode AND m.status != :status")
    List<ConsultantClientMapping> findByConsultantIdAndBranchCodeAndStatusNot(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId, @Param("branchCode") String branchCode, @Param("status") ConsultantClientMapping.MappingStatus status);
    
    // 내담자 ID로 매칭 조회 (특정 상태 제외, tenantId 필터링)
    @Query("SELECT m FROM ConsultantClientMapping m LEFT JOIN FETCH m.consultant LEFT JOIN FETCH m.client WHERE m.tenantId = :tenantId AND m.client.id = :clientId AND m.status != :status")
    List<ConsultantClientMapping> findByClientIdAndStatusNot(@Param("tenantId") String tenantId, @Param("clientId") Long clientId, @Param("status") ConsultantClientMapping.MappingStatus status);
    
    // 상담사 ID로 매칭 조회 (문자열 상태로 특정 상태 제외, tenantId 필터링)
    @Query("SELECT m FROM ConsultantClientMapping m LEFT JOIN FETCH m.consultant LEFT JOIN FETCH m.client WHERE m.tenantId = :tenantId AND m.consultant.id = :consultantId AND m.status != :status")
    List<ConsultantClientMapping> findByConsultantIdAndStatusNotString(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId, @Param("status") String status);
    
    // 상담사 ID로 특정 상태의 매칭 조회 (tenantId 필터링)
    @Query("SELECT m FROM ConsultantClientMapping m LEFT JOIN FETCH m.consultant LEFT JOIN FETCH m.client WHERE m.tenantId = :tenantId AND m.consultant.id = :consultantId AND m.status = :status")
    List<ConsultantClientMapping> findByConsultantIdAndStatus(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId, @Param("status") ConsultantClientMapping.MappingStatus status);
    
    // 상담사 ID로 모든 매칭 조회 (tenantId 필터링)
    @Query("SELECT m FROM ConsultantClientMapping m WHERE m.tenantId = :tenantId AND m.consultant.id = :consultantId")
    List<ConsultantClientMapping> findByConsultantId(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId);
    
    // 테넌트별 결제 상태별 매칭 수 조회 (tenantId 필터링 필수)
    @Query("SELECT COUNT(m) FROM ConsultantClientMapping m WHERE m.tenantId = :tenantId AND m.paymentStatus = :paymentStatus")
    long countByTenantIdAndPaymentStatus(@Param("tenantId") String tenantId, @Param("paymentStatus") ConsultantClientMapping.PaymentStatus paymentStatus);
    
    // 테넌트별 결제 상태별 매칭 조회 (tenantId 필터링 필수)
    @Query("SELECT m FROM ConsultantClientMapping m WHERE m.tenantId = :tenantId AND m.paymentStatus = :paymentStatus")
    List<ConsultantClientMapping> findByTenantIdAndPaymentStatus(@Param("tenantId") String tenantId, @Param("paymentStatus") ConsultantClientMapping.PaymentStatus paymentStatus);
    
    // 상담사 ID와 상태 목록으로 매칭 수 조회 (tenantId 필터링)
    @Query("SELECT COUNT(m) FROM ConsultantClientMapping m WHERE m.tenantId = :tenantId AND m.consultant.id = :consultantId AND m.status IN :statuses")
    long countByConsultantIdAndStatusIn(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId, @Param("statuses") List<ConsultantClientMapping.MappingStatus> statuses);
    
    // ==================== 통계 대시보드용 메서드 ====================
    
    /**
     * 특정 상태 목록의 매칭 수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(m) FROM ConsultantClientMapping m WHERE m.tenantId = :tenantId AND m.status IN :statuses")
    long countByStatusIn(@Param("tenantId") String tenantId, @Param("statuses") List<String> statuses);
    
    /**
     * 최근 매칭 조회 (이름, 생성일시) - tenantId 필터링
     */
    @Query(value = "SELECT CONCAT(m.consultant.name, ' - ', m.client.name), m.createdAt FROM ConsultantClientMapping m WHERE m.tenantId = :tenantId ORDER BY m.createdAt DESC LIMIT :limit", nativeQuery = false)
    List<Object[]> findRecentMappings(@Param("tenantId") String tenantId, @Param("limit") int limit);
}

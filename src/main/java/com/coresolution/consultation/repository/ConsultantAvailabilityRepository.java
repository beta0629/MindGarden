package com.coresolution.consultation.repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.ConsultantAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 상담사 상담 가능 시간 Repository
 */
@Repository
public interface ConsultantAvailabilityRepository extends JpaRepository<ConsultantAvailability, Long> {
    
    // ==================== tenantId 필터링 메서드 ====================
    
    /**
     * 테넌트·PK로 상담 가능 시간 조회
     *
     * @param tenantId 테넌트 ID
     * @param id 엔티티 PK
     * @return 상담 가능 시간 Optional
     */
    @Query("SELECT ca FROM ConsultantAvailability ca WHERE ca.tenantId = :tenantId AND ca.id = :id")
    Optional<ConsultantAvailability> findByTenantIdAndId(@Param("tenantId") String tenantId, @Param("id") Long id);
    
    /**
     * 상담사별 상담 가능 시간 조회 (tenantId 필터링)
     */
    @Query("SELECT ca FROM ConsultantAvailability ca WHERE ca.tenantId = :tenantId AND ca.consultantId = :consultantId AND ca.isActive = true ORDER BY ca.dayOfWeek ASC, ca.startTime ASC")
    List<ConsultantAvailability> findByTenantIdAndConsultantIdAndIsActiveTrueOrderByDayOfWeekAscStartTimeAsc(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId);
    
    /**
     * 상담사별 특정 요일 상담 가능 시간 조회 (tenantId 필터링)
     */
    @Query("SELECT ca FROM ConsultantAvailability ca WHERE ca.tenantId = :tenantId AND ca.consultantId = :consultantId AND ca.dayOfWeek = :dayOfWeek AND ca.isActive = true ORDER BY ca.startTime ASC")
    List<ConsultantAvailability> findByTenantIdAndConsultantIdAndDayOfWeekAndIsActiveTrueOrderByStartTimeAsc(
            @Param("tenantId") String tenantId, @Param("consultantId") Long consultantId, @Param("dayOfWeek") DayOfWeek dayOfWeek);
    
    /**
     * 상담사별 상담 가능 시간 삭제 (tenantId 필터링)
     */
    @Query("DELETE FROM ConsultantAvailability ca WHERE ca.tenantId = :tenantId AND ca.consultantId = :consultantId")
    void deleteByTenantIdAndConsultantId(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId);
    
    /**
     * 상담사별 상담 가능 시간 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(ca) FROM ConsultantAvailability ca WHERE ca.tenantId = :tenantId AND ca.consultantId = :consultantId AND ca.isActive = true")
    Long countByTenantIdAndConsultantIdAndIsActiveTrue(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId);
    
    // ==================== @Deprecated 메서드 (하위 호환성) ====================
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndConsultantIdAndIsActiveTrueOrderByDayOfWeekAscStartTimeAsc 사용하세요.
     */
    @Deprecated
    List<ConsultantAvailability> findByConsultantIdAndIsActiveTrueOrderByDayOfWeekAscStartTimeAsc(Long consultantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndConsultantIdAndDayOfWeekAndIsActiveTrueOrderByStartTimeAsc 사용하세요.
     */
    @Deprecated
    List<ConsultantAvailability> findByConsultantIdAndDayOfWeekAndIsActiveTrueOrderByStartTimeAsc(
            Long consultantId, DayOfWeek dayOfWeek);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! deleteByTenantIdAndConsultantId 사용하세요.
     */
    @Deprecated
    void deleteByConsultantId(Long consultantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! countByTenantIdAndConsultantIdAndIsActiveTrue 사용하세요.
     */
    @Deprecated
    @Query("SELECT COUNT(ca) FROM ConsultantAvailability ca WHERE ca.consultantId = :consultantId AND ca.isActive = true")
    Long countByConsultantIdAndIsActiveTrue(@Param("consultantId") Long consultantId);
}

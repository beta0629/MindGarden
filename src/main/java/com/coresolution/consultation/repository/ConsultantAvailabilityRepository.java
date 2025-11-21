package com.coresolution.consultation.repository;

import java.time.DayOfWeek;
import java.util.List;
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
    
    /**
     * 상담사별 상담 가능 시간 조회
     */
    List<ConsultantAvailability> findByConsultantIdAndIsActiveTrueOrderByDayOfWeekAscStartTimeAsc(Long consultantId);
    
    /**
     * 상담사별 특정 요일 상담 가능 시간 조회
     */
    List<ConsultantAvailability> findByConsultantIdAndDayOfWeekAndIsActiveTrueOrderByStartTimeAsc(
            Long consultantId, DayOfWeek dayOfWeek);
    
    /**
     * 상담사별 상담 가능 시간 삭제
     */
    void deleteByConsultantId(Long consultantId);
    
    /**
     * 상담사별 상담 가능 시간 개수 조회
     */
    @Query("SELECT COUNT(ca) FROM ConsultantAvailability ca WHERE ca.consultantId = :consultantId AND ca.isActive = true")
    Long countByConsultantIdAndIsActiveTrue(@Param("consultantId") Long consultantId);
}

package com.mindgarden.consultation.repository;

import java.time.LocalDate;
import java.util.List;
import com.mindgarden.consultation.entity.Vacation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 휴가 데이터 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-09
 */
@Repository
public interface VacationRepository extends JpaRepository<Vacation, Long> {
    
    /**
     * 특정 상담사의 휴가 목록 조회
     */
    List<Vacation> findByConsultantIdAndIsDeletedFalseOrderByVacationDateAsc(Long consultantId);
    
    /**
     * 특정 상담사의 특정 날짜 휴가 조회
     */
    Vacation findByConsultantIdAndVacationDateAndIsDeletedFalse(Long consultantId, LocalDate vacationDate);
    
    /**
     * 특정 상담사의 날짜 범위 휴가 목록 조회
     */
    @Query("SELECT v FROM Vacation v WHERE v.consultantId = :consultantId " +
           "AND v.vacationDate BETWEEN :startDate AND :endDate " +
           "AND v.isDeleted = false " +
           "ORDER BY v.vacationDate ASC")
    List<Vacation> findByConsultantIdAndDateRange(
        @Param("consultantId") Long consultantId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    /**
     * 모든 상담사의 특정 날짜 휴가 목록 조회
     */
    @Query("SELECT v FROM Vacation v WHERE v.vacationDate = :date " +
           "AND v.isDeleted = false " +
           "ORDER BY v.consultantId ASC")
    List<Vacation> findByVacationDate(@Param("date") LocalDate date);
    
    /**
     * 모든 상담사의 날짜 범위 휴가 목록 조회
     */
    @Query("SELECT v FROM Vacation v WHERE v.vacationDate BETWEEN :startDate AND :endDate " +
           "AND v.isDeleted = false " +
           "ORDER BY v.consultantId ASC, v.vacationDate ASC")
    List<Vacation> findByDateRange(
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    /**
     * 삭제되지 않은 모든 휴가 목록 조회
     */
    List<Vacation> findByIsDeletedFalseOrderByVacationDateAsc();
    
    /**
     * 승인된 휴가 목록 조회
     */
    List<Vacation> findByIsApprovedTrueAndIsDeletedFalseOrderByVacationDateAsc();
    
    /**
     * 미승인 휴가 목록 조회
     */
    List<Vacation> findByIsApprovedFalseAndIsDeletedFalseOrderByVacationDateAsc();
}

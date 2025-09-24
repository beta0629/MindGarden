package com.mindgarden.consultation.repository;

import java.time.LocalDateTime;
import com.mindgarden.consultation.entity.ErpSyncLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * ERP 동기화 로그 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Repository
public interface ErpSyncLogRepository extends JpaRepository<ErpSyncLog, Long> {
    
    /**
     * 특정 시간 이후 생성된 로그 개수 조회
     * 
     * @param syncDate 기준 시간
     * @return 로그 개수
     */
    long countBySyncDateAfter(LocalDateTime syncDate);
    
    /**
     * 동기화 타입별 최신 로그 조회
     * 
     * @param syncType 동기화 타입
     * @return 최신 로그
     */
    java.util.List<ErpSyncLog> findBySyncTypeOrderBySyncDateDesc(ErpSyncLog.SyncType syncType);
    
    /**
     * 특정 기간의 동기화 로그 조회
     * 
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 로그 목록
     */
    @Query("SELECT e FROM ErpSyncLog e WHERE e.syncDate BETWEEN :startDate AND :endDate ORDER BY e.syncDate DESC")
    java.util.List<ErpSyncLog> findBySyncDateBetween(@Param("startDate") LocalDateTime startDate, 
                                                     @Param("endDate") LocalDateTime endDate);
    
    /**
     * 상태별 로그 개수 조회
     * 
     * @param status 상태
     * @return 로그 개수
     */
    long countByStatus(ErpSyncLog.SyncStatus status);
}

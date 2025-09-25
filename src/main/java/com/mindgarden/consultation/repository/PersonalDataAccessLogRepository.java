package com.mindgarden.consultation.repository;

import com.mindgarden.consultation.entity.PersonalDataAccessLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 개인정보 접근 로그 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface PersonalDataAccessLogRepository extends JpaRepository<PersonalDataAccessLog, Long> {
    
    /**
     * 접근자 ID와 개인정보 유형으로 접근 로그 조회
     */
    List<PersonalDataAccessLog> findByAccessorIdAndDataTypeAndAccessTimeBetween(
        String accessorId, String dataType, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 대상 사용자 ID로 접근 이력 조회
     */
    List<PersonalDataAccessLog> findByTargetUserIdAndAccessTimeBetween(
        String targetUserId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 접근자 ID로 접근 로그 조회
     */
    List<PersonalDataAccessLog> findByAccessorIdAndAccessTimeBetween(
        String accessorId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 접근 유형별 통계 조회
     */
    @Query("SELECT p.accessType, COUNT(p) FROM PersonalDataAccessLog p " +
           "WHERE p.accessTime BETWEEN :startDate AND :endDate " +
           "GROUP BY p.accessType")
    Map<String, Long> countByAccessTypeAndAccessTimeBetween(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * 개인정보 유형별 통계 조회
     */
    @Query("SELECT p.dataType, COUNT(p) FROM PersonalDataAccessLog p " +
           "WHERE p.accessTime BETWEEN :startDate AND :endDate " +
           "GROUP BY p.dataType")
    Map<String, Long> countByDataTypeAndAccessTimeBetween(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * 접근자별 통계 조회
     */
    @Query("SELECT p.accessorId, COUNT(p) FROM PersonalDataAccessLog p " +
           "WHERE p.accessTime BETWEEN :startDate AND :endDate " +
           "GROUP BY p.accessorId")
    Map<String, Long> countByAccessorIdAndAccessTimeBetween(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * 전체 접근 횟수 조회
     */
    long countByAccessTimeBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 시간 이전의 로그 삭제
     */
    long deleteByAccessTimeBefore(LocalDateTime cutoffDate);
    
    /**
     * 특정 개인정보 유형의 접근 로그 조회
     */
    List<PersonalDataAccessLog> findByDataTypeAndAccessTimeBetween(
        String dataType, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 접근 유형의 접근 로그 조회
     */
    List<PersonalDataAccessLog> findByAccessTypeAndAccessTimeBetween(
        String accessType, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * IP 주소별 접근 로그 조회
     */
    List<PersonalDataAccessLog> findByIpAddressAndAccessTimeBetween(
        String ipAddress, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 세션 ID별 접근 로그 조회
     */
    List<PersonalDataAccessLog> findBySessionIdAndAccessTimeBetween(
        String sessionId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 결과별 접근 로그 조회
     */
    List<PersonalDataAccessLog> findByResultAndAccessTimeBetween(
        String result, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 사용자의 개인정보 접근 횟수 조회
     */
    long countByTargetUserIdAndAccessTimeBetween(
        String targetUserId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 접근자의 개인정보 접근 횟수 조회
     */
    long countByAccessorIdAndAccessTimeBetween(
        String accessorId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 개인정보 유형의 접근 횟수 조회
     */
    long countByDataTypeAndAccessTimeBetween(
        String dataType, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 접근 유형의 접근 횟수 조회
     */
    long countByAccessTypeAndAccessTimeBetween(
        String accessType, LocalDateTime startDate, LocalDateTime endDate);
}

package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.PersonalDataAccessLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 개인정보 접근 로그 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface PersonalDataAccessLogRepository extends JpaRepository<PersonalDataAccessLog, Long> {
    
    // ==================== tenantId 필터링 메서드 ====================
    
    /**
     * 테넌트별 접근자 ID와 개인정보 유형으로 접근 로그 조회 (tenantId 필터링)
     */
    @Query("SELECT pdal FROM PersonalDataAccessLog pdal WHERE pdal.tenantId = :tenantId AND pdal.accessorId = :accessorId AND pdal.dataType = :dataType AND pdal.accessTime BETWEEN :startDate AND :endDate")
    List<PersonalDataAccessLog> findByTenantIdAndAccessorIdAndDataTypeAndAccessTimeBetween(
        @Param("tenantId") String tenantId, 
        @Param("accessorId") String accessorId, 
        @Param("dataType") String dataType, 
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * 테넌트별 대상 사용자 ID로 접근 이력 조회 (tenantId 필터링)
     */
    @Query("SELECT pdal FROM PersonalDataAccessLog pdal WHERE pdal.tenantId = :tenantId AND pdal.targetUserId = :targetUserId AND pdal.accessTime BETWEEN :startDate AND :endDate")
    List<PersonalDataAccessLog> findByTenantIdAndTargetUserIdAndAccessTimeBetween(
        @Param("tenantId") String tenantId,
        @Param("targetUserId") String targetUserId, 
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * 테넌트별 접근자 ID로 접근 로그 조회 (tenantId 필터링)
     */
    @Query("SELECT pdal FROM PersonalDataAccessLog pdal WHERE pdal.tenantId = :tenantId AND pdal.accessorId = :accessorId AND pdal.accessTime BETWEEN :startDate AND :endDate")
    List<PersonalDataAccessLog> findByTenantIdAndAccessorIdAndAccessTimeBetween(
        @Param("tenantId") String tenantId,
        @Param("accessorId") String accessorId, 
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * 테넌트별 접근 유형별 통계 조회 (tenantId 필터링)
     */
    @Query("SELECT p.accessType, COUNT(p) FROM PersonalDataAccessLog p " +
           "WHERE p.tenantId = :tenantId AND p.accessTime BETWEEN :startDate AND :endDate " +
           "GROUP BY p.accessType")
    Map<String, Long> countByTenantIdAndAccessTypeAndAccessTimeBetween(
        @Param("tenantId") String tenantId,
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * 테넌트별 개인정보 유형별 통계 조회 (tenantId 필터링)
     */
    @Query("SELECT p.dataType, COUNT(p) FROM PersonalDataAccessLog p " +
           "WHERE p.tenantId = :tenantId AND p.accessTime BETWEEN :startDate AND :endDate " +
           "GROUP BY p.dataType")
    Map<String, Long> countByTenantIdAndDataTypeAndAccessTimeBetween(
        @Param("tenantId") String tenantId,
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * 테넌트별 접근자별 통계 조회 (tenantId 필터링)
     */
    @Query("SELECT p.accessorId, COUNT(p) FROM PersonalDataAccessLog p " +
           "WHERE p.tenantId = :tenantId AND p.accessTime BETWEEN :startDate AND :endDate " +
           "GROUP BY p.accessorId")
    Map<String, Long> countByTenantIdAndAccessorIdAndAccessTimeBetween(
        @Param("tenantId") String tenantId,
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * 테넌트별 전체 접근 횟수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(p) FROM PersonalDataAccessLog p WHERE p.tenantId = :tenantId AND p.accessTime BETWEEN :startDate AND :endDate")
    long countByTenantIdAndAccessTimeBetween(@Param("tenantId") String tenantId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * 테넌트별 특정 시간 이전의 로그 삭제 (tenantId 필터링)
     */
    @Query("DELETE FROM PersonalDataAccessLog p WHERE p.tenantId = :tenantId AND p.accessTime < :cutoffDate")
    long deleteByTenantIdAndAccessTimeBefore(@Param("tenantId") String tenantId, @Param("cutoffDate") LocalDateTime cutoffDate);
    
    /**
     * 테넌트별 특정 개인정보 유형의 접근 로그 조회 (tenantId 필터링)
     */
    @Query("SELECT p FROM PersonalDataAccessLog p WHERE p.tenantId = :tenantId AND p.dataType = :dataType AND p.accessTime BETWEEN :startDate AND :endDate")
    List<PersonalDataAccessLog> findByTenantIdAndDataTypeAndAccessTimeBetween(
        @Param("tenantId") String tenantId,
        @Param("dataType") String dataType, 
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * 테넌트별 특정 접근 유형의 접근 로그 조회 (tenantId 필터링)
     */
    @Query("SELECT p FROM PersonalDataAccessLog p WHERE p.tenantId = :tenantId AND p.accessType = :accessType AND p.accessTime BETWEEN :startDate AND :endDate")
    List<PersonalDataAccessLog> findByTenantIdAndAccessTypeAndAccessTimeBetween(
        @Param("tenantId") String tenantId,
        @Param("accessType") String accessType, 
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * 테넌트별 IP 주소별 접근 로그 조회 (tenantId 필터링)
     */
    @Query("SELECT p FROM PersonalDataAccessLog p WHERE p.tenantId = :tenantId AND p.ipAddress = :ipAddress AND p.accessTime BETWEEN :startDate AND :endDate")
    List<PersonalDataAccessLog> findByTenantIdAndIpAddressAndAccessTimeBetween(
        @Param("tenantId") String tenantId,
        @Param("ipAddress") String ipAddress, 
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * 테넌트별 세션 ID별 접근 로그 조회 (tenantId 필터링)
     */
    @Query("SELECT p FROM PersonalDataAccessLog p WHERE p.tenantId = :tenantId AND p.sessionId = :sessionId AND p.accessTime BETWEEN :startDate AND :endDate")
    List<PersonalDataAccessLog> findByTenantIdAndSessionIdAndAccessTimeBetween(
        @Param("tenantId") String tenantId,
        @Param("sessionId") String sessionId, 
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * 테넌트별 결과별 접근 로그 조회 (tenantId 필터링)
     */
    @Query("SELECT p FROM PersonalDataAccessLog p WHERE p.tenantId = :tenantId AND p.result = :result AND p.accessTime BETWEEN :startDate AND :endDate")
    List<PersonalDataAccessLog> findByTenantIdAndResultAndAccessTimeBetween(
        @Param("tenantId") String tenantId,
        @Param("result") String result, 
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * 테넌트별 특정 사용자의 개인정보 접근 횟수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(p) FROM PersonalDataAccessLog p WHERE p.tenantId = :tenantId AND p.targetUserId = :targetUserId AND p.accessTime BETWEEN :startDate AND :endDate")
    long countByTenantIdAndTargetUserIdAndAccessTimeBetween(
        @Param("tenantId") String tenantId,
        @Param("targetUserId") String targetUserId, 
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * 테넌트별 특정 접근자의 개인정보 접근 횟수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(p) FROM PersonalDataAccessLog p WHERE p.tenantId = :tenantId AND p.accessorId = :accessorId AND p.accessTime BETWEEN :startDate AND :endDate")
    long countByTenantIdAndAccessorIdAndAccessTimeBetween(
        @Param("tenantId") String tenantId,
        @Param("accessorId") String accessorId, 
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * 테넌트별 특정 개인정보 유형의 접근 횟수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(p) FROM PersonalDataAccessLog p WHERE p.tenantId = :tenantId AND p.dataType = :dataType AND p.accessTime BETWEEN :startDate AND :endDate")
    long countByTenantIdAndDataTypeAndAccessTimeBetween(
        @Param("tenantId") String tenantId,
        @Param("dataType") String dataType, 
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * 테넌트별 특정 접근 유형의 접근 횟수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(p) FROM PersonalDataAccessLog p WHERE p.tenantId = :tenantId AND p.accessType = :accessType AND p.accessTime BETWEEN :startDate AND :endDate")
    long countByTenantIdAndAccessTypeAndAccessTimeBetween(
        @Param("tenantId") String tenantId,
        @Param("accessType") String accessType, 
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    // ==================== @Deprecated 메서드 (하위 호환성) ====================
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 개인정보 접근 로그 노출! findByTenantIdAndAccessorIdAndDataTypeAndAccessTimeBetween 사용하세요.
     */
    @Deprecated
    List<PersonalDataAccessLog> findByAccessorIdAndDataTypeAndAccessTimeBetween(
        String accessorId, String dataType, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 대상 사용자 접근 이력 노출! findByTenantIdAndTargetUserIdAndAccessTimeBetween 사용하세요.
     */
    @Deprecated
    List<PersonalDataAccessLog> findByTargetUserIdAndAccessTimeBetween(
        String targetUserId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndAccessorIdAndAccessTimeBetween 사용하세요.
     */
    @Deprecated
    List<PersonalDataAccessLog> findByAccessorIdAndAccessTimeBetween(
        String accessorId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! countByTenantIdAndAccessTypeAndAccessTimeBetween 사용하세요.
     */
    @Deprecated
    @Query("SELECT p.accessType, COUNT(p) FROM PersonalDataAccessLog p " +
           "WHERE p.accessTime BETWEEN :startDate AND :endDate " +
           "GROUP BY p.accessType")
    Map<String, Long> countByAccessTypeAndAccessTimeBetween(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! countByTenantIdAndDataTypeAndAccessTimeBetween 사용하세요.
     */
    @Deprecated
    @Query("SELECT p.dataType, COUNT(p) FROM PersonalDataAccessLog p " +
           "WHERE p.accessTime BETWEEN :startDate AND :endDate " +
           "GROUP BY p.dataType")
    Map<String, Long> countByDataTypeAndAccessTimeBetween(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! countByTenantIdAndAccessorIdAndAccessTimeBetween 사용하세요.
     */
    @Deprecated
    @Query("SELECT p.accessorId, COUNT(p) FROM PersonalDataAccessLog p " +
           "WHERE p.accessTime BETWEEN :startDate AND :endDate " +
           "GROUP BY p.accessorId")
    Map<String, Long> countByAccessorIdAndAccessTimeBetween(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! countByTenantIdAndAccessTimeBetween 사용하세요.
     */
    @Deprecated
    long countByAccessTimeBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! deleteByTenantIdAndAccessTimeBefore 사용하세요.
     */
    @Deprecated
    long deleteByAccessTimeBefore(LocalDateTime cutoffDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndDataTypeAndAccessTimeBetween 사용하세요.
     */
    @Deprecated
    List<PersonalDataAccessLog> findByDataTypeAndAccessTimeBetween(
        String dataType, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndAccessTypeAndAccessTimeBetween 사용하세요.
     */
    @Deprecated
    List<PersonalDataAccessLog> findByAccessTypeAndAccessTimeBetween(
        String accessType, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndIpAddressAndAccessTimeBetween 사용하세요.
     */
    @Deprecated
    List<PersonalDataAccessLog> findByIpAddressAndAccessTimeBetween(
        String ipAddress, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndSessionIdAndAccessTimeBetween 사용하세요.
     */
    @Deprecated
    List<PersonalDataAccessLog> findBySessionIdAndAccessTimeBetween(
        String sessionId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndResultAndAccessTimeBetween 사용하세요.
     */
    @Deprecated
    List<PersonalDataAccessLog> findByResultAndAccessTimeBetween(
        String result, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! countByTenantIdAndTargetUserIdAndAccessTimeBetween 사용하세요.
     */
    @Deprecated
    long countByTargetUserIdAndAccessTimeBetween(
        String targetUserId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! countByTenantIdAndAccessorIdAndAccessTimeBetween 사용하세요.
     */
    @Deprecated
    long countByAccessorIdAndAccessTimeBetween(
        String accessorId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! countByTenantIdAndDataTypeAndAccessTimeBetween 사용하세요.
     */
    @Deprecated
    long countByDataTypeAndAccessTimeBetween(
        String dataType, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! countByTenantIdAndAccessTypeAndAccessTimeBetween 사용하세요.
     */
    @Deprecated
    long countByAccessTypeAndAccessTimeBetween(
        String accessType, LocalDateTime startDate, LocalDateTime endDate);
}

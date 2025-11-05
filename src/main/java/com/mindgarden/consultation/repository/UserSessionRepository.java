package com.mindgarden.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 사용자 세션 관리 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-09
 */
@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    
    /**
     * 사용자 ID로 활성 세션 조회
     */
    @Query("SELECT us FROM UserSession us WHERE us.user.id = :userId AND us.isActive = true AND us.expiresAt > :now")
    List<UserSession> findActiveSessionsByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);
    
    /**
     * 세션 ID로 활성 세션 조회 (user를 함께 로드하여 LAZY 로딩 문제 방지)
     */
    @Query("SELECT us FROM UserSession us JOIN FETCH us.user WHERE us.sessionId = :sessionId AND us.isActive = true AND us.expiresAt > :now")
    Optional<UserSession> findActiveSessionBySessionId(@Param("sessionId") String sessionId, @Param("now") LocalDateTime now);
    
    /**
     * 사용자의 모든 활성 세션 조회
     */
    @Query("SELECT us FROM UserSession us WHERE us.user = :user AND us.isActive = true AND us.expiresAt > :now ORDER BY us.lastActivityAt DESC")
    List<UserSession> findAllActiveSessionsByUser(@Param("user") User user, @Param("now") LocalDateTime now);
    
    /**
     * 사용자의 가장 최근 활성 세션 조회
     */
    @Query("SELECT us FROM UserSession us WHERE us.user = :user AND us.isActive = true AND us.expiresAt > :now ORDER BY us.lastActivityAt DESC")
    Optional<UserSession> findLatestActiveSessionByUser(@Param("user") User user, @Param("now") LocalDateTime now);
    
    /**
     * 만료된 세션들을 비활성화
     */
    @Modifying
    @Query("UPDATE UserSession us SET us.isActive = false, us.endedAt = :now, us.endReason = 'EXPIRED' WHERE us.isActive = true AND us.expiresAt <= :now")
    int deactivateExpiredSessions(@Param("now") LocalDateTime now);
    
    /**
     * 사용자의 모든 세션을 비활성화 (중복 로그인 방지)
     */
    @Modifying
    @Query("UPDATE UserSession us SET us.isActive = false, us.endedAt = :now, us.endReason = :reason WHERE us.user = :user AND us.isActive = true")
    int deactivateAllUserSessions(@Param("user") User user, @Param("now") LocalDateTime now, @Param("reason") String reason);
    
    /**
     * 특정 세션을 비활성화
     */
    @Modifying
    @Query("UPDATE UserSession us SET us.isActive = false, us.endedAt = :now, us.endReason = :reason WHERE us.sessionId = :sessionId")
    int deactivateSessionBySessionId(@Param("sessionId") String sessionId, @Param("now") LocalDateTime now, @Param("reason") String reason);
    
    /**
     * 사용자의 활성 세션 수 조회
     */
    @Query("SELECT COUNT(us) FROM UserSession us WHERE us.user = :user AND us.isActive = true AND us.expiresAt > :now")
    long countActiveSessionsByUser(@Param("user") User user, @Param("now") LocalDateTime now);
    
    /**
     * 특정 IP에서의 활성 세션 조회
     */
    @Query("SELECT us FROM UserSession us WHERE us.clientIp = :clientIp AND us.isActive = true AND us.expiresAt > :now")
    List<UserSession> findActiveSessionsByClientIp(@Param("clientIp") String clientIp, @Param("now") LocalDateTime now);
    
    /**
     * 사용자별 활성 세션 통계
     */
    @Query("SELECT us.user.id, COUNT(us) FROM UserSession us WHERE us.isActive = true AND us.expiresAt > :now GROUP BY us.user.id")
    List<Object[]> getActiveSessionStatistics(@Param("now") LocalDateTime now);
    
    /**
     * 세션 ID로 모든 세션 조회 (활성/비활성 포함)
     */
    @Query("SELECT us FROM UserSession us WHERE us.sessionId = :sessionId")
    List<UserSession> findBySessionId(@Param("sessionId") String sessionId);
    
    /**
     * 세션 ID로 세션 삭제
     */
    @Modifying
    @Query("DELETE FROM UserSession us WHERE us.sessionId = :sessionId")
    void deleteBySessionId(@Param("sessionId") String sessionId);
    
}

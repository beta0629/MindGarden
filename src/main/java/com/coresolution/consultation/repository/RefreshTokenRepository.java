package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Refresh Token Repository
 * Phase 3: Refresh Token 저장소 데이터 접근
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    
    /**
     * 테넌트별 tokenId로 Refresh Token 조회 (테넌트 필터링)
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.tenantId = :tenantId AND rt.tokenId = :tokenId")
    Optional<RefreshToken> findByTenantIdAndTokenId(@Param("tenantId") String tenantId, @Param("tokenId") String tokenId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 토큰 ID 접근 가능!
     */
    @Deprecated
    Optional<RefreshToken> findByTokenId(String tokenId);
    
    /**
     * 테넌트별 userId로 활성 Refresh Token 목록 조회 (테넌트 필터링)
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.tenantId = :tenantId AND rt.userId = :userId AND rt.revoked = false AND rt.expiresAt > :now")
    List<RefreshToken> findActiveTokensByTenantIdAndUserId(@Param("tenantId") String tenantId, @Param("userId") Long userId, @Param("now") LocalDateTime now);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 사용자 토큰 노출!
     */
    @Deprecated
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.userId = :userId AND rt.revoked = false AND rt.expiresAt > :now")
    List<RefreshToken> findActiveTokensByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);
    
    /**
     * userId와 tenantId로 활성 Refresh Token 목록 조회
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.userId = :userId AND rt.tenantId = :tenantId AND rt.revoked = false AND rt.expiresAt > :now")
    List<RefreshToken> findActiveTokensByUserIdAndTenantId(
        @Param("userId") Long userId, 
        @Param("tenantId") String tenantId,
        @Param("now") LocalDateTime now
    );
    
    /**
     * userId로 모든 Refresh Token 무효화
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true, rt.revokedAt = :now, rt.updatedAt = :now WHERE rt.userId = :userId AND rt.revoked = false")
    int revokeAllTokensByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);
    
    /**
     * 만료된 Refresh Token 삭제
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);
    
    /**
     * 무효화된 Refresh Token 삭제 (일정 기간 후)
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.revoked = true AND rt.revokedAt < :beforeDate")
    int deleteRevokedTokensBefore(@Param("beforeDate") LocalDateTime beforeDate);
}


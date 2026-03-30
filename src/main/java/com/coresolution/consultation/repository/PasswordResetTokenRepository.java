package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 비밀번호 재설정 토큰 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    // ==================== tenantId 필터링 메서드 ====================
    
    /**
     * 토큰으로 조회 (tenantId 필터링)
     */
    @Query("SELECT prt FROM PasswordResetToken prt WHERE prt.tenantId = :tenantId AND prt.token = :token")
    Optional<PasswordResetToken> findByTenantIdAndToken(@Param("tenantId") String tenantId, @Param("token") String token);
    
    /**
     * 사용자 ID로 유효한 토큰 조회 (tenantId 필터링)
     */
    @Query("SELECT prt FROM PasswordResetToken prt WHERE prt.tenantId = :tenantId AND prt.userId = :userId AND prt.used = false AND prt.expiresAt > :now ORDER BY prt.createdAt DESC")
    List<PasswordResetToken> findValidTokensByTenantIdAndUserId(@Param("tenantId") String tenantId, @Param("userId") Long userId, @Param("now") LocalDateTime now);
    
    /**
     * 이메일로 유효한 토큰 조회 (tenantId 필터링)
     */
    @Query("SELECT prt FROM PasswordResetToken prt WHERE prt.tenantId = :tenantId AND prt.email = :email AND prt.used = false AND prt.expiresAt > :now ORDER BY prt.createdAt DESC")
    List<PasswordResetToken> findValidTokensByTenantIdAndEmail(@Param("tenantId") String tenantId, @Param("email") String email, @Param("now") LocalDateTime now);
    
    /**
     * 만료된 토큰 삭제 (tenantId 필터링)
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken prt WHERE prt.tenantId = :tenantId AND prt.expiresAt < :now")
    int deleteExpiredTokensByTenantId(@Param("tenantId") String tenantId, @Param("now") LocalDateTime now);
    
    /**
     * 사용자 ID로 모든 토큰 삭제 (tenantId 필터링)
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken prt WHERE prt.tenantId = :tenantId AND prt.userId = :userId")
    int deleteByTenantIdAndUserId(@Param("tenantId") String tenantId, @Param("userId") Long userId);
    
    /**
     * 토큰 사용 처리 (tenantId 필터링)
     */
    @Modifying
    @Query("UPDATE PasswordResetToken prt SET prt.used = true, prt.usedAt = :usedAt WHERE prt.tenantId = :tenantId AND prt.token = :token")
    int markTokenAsUsedByTenantId(@Param("tenantId") String tenantId, @Param("token") String token, @Param("usedAt") LocalDateTime usedAt);
    
    /**
     * 사용자 ID로 모든 토큰을 사용됨으로 표시 (tenantId 필터링)
     */
    @Modifying
    @Query("UPDATE PasswordResetToken prt SET prt.used = true, prt.usedAt = :usedAt WHERE prt.tenantId = :tenantId AND prt.userId = :userId")
    int markAllTokensAsUsedByTenantIdAndUserId(@Param("tenantId") String tenantId, @Param("userId") Long userId, @Param("usedAt") LocalDateTime usedAt);
    
    // ==================== @Deprecated 메서드 (하위 호환성) ====================
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 토큰 접근 가능! findByTenantIdAndToken 사용하세요.
     */
    @Deprecated
    Optional<PasswordResetToken> findByToken(String token);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findValidTokensByTenantIdAndUserId 사용하세요.
     */
    @Deprecated
    @Query("SELECT prt FROM PasswordResetToken prt WHERE prt.userId = :userId AND prt.used = false AND prt.expiresAt > :now ORDER BY prt.createdAt DESC")
    List<PasswordResetToken> findValidTokensByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findValidTokensByTenantIdAndEmail 사용하세요.
     */
    @Deprecated
    @Query("SELECT prt FROM PasswordResetToken prt WHERE prt.email = :email AND prt.used = false AND prt.expiresAt > :now ORDER BY prt.createdAt DESC")
    List<PasswordResetToken> findValidTokensByEmail(@Param("email") String email, @Param("now") LocalDateTime now);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! deleteExpiredTokensByTenantId 사용하세요.
     */
    @Deprecated
    @Modifying
    @Query("DELETE FROM PasswordResetToken prt WHERE prt.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! deleteByTenantIdAndUserId 사용하세요.
     */
    @Deprecated
    @Modifying
    @Query("DELETE FROM PasswordResetToken prt WHERE prt.userId = :userId")
    int deleteByUserId(@Param("userId") Long userId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! markTokenAsUsedByTenantId 사용하세요.
     */
    @Deprecated
    @Modifying
    @Query("UPDATE PasswordResetToken prt SET prt.used = true, prt.usedAt = :usedAt WHERE prt.token = :token")
    int markTokenAsUsed(@Param("token") String token, @Param("usedAt") LocalDateTime usedAt);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! markAllTokensAsUsedByTenantIdAndUserId 사용하세요.
     */
    @Deprecated
    @Modifying
    @Query("UPDATE PasswordResetToken prt SET prt.used = true, prt.usedAt = :usedAt WHERE prt.userId = :userId")
    int markAllTokensAsUsedByUserId(@Param("userId") Long userId, @Param("usedAt") LocalDateTime usedAt);
}

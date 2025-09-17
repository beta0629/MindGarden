package com.mindgarden.consultation.repository;

import com.mindgarden.consultation.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 비밀번호 재설정 토큰 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    /**
     * 토큰으로 비밀번호 재설정 토큰 조회
     */
    Optional<PasswordResetToken> findByToken(String token);
    
    /**
     * 이메일로 사용되지 않은 토큰들 조회 (최신순)
     */
    @Query("SELECT prt FROM PasswordResetToken prt WHERE prt.email = :email AND prt.used = false ORDER BY prt.createdAt DESC")
    List<PasswordResetToken> findUnusedTokensByEmail(@Param("email") String email);
    
    /**
     * 사용자 ID로 사용되지 않은 토큰들 조회 (최신순)
     */
    @Query("SELECT prt FROM PasswordResetToken prt WHERE prt.user.id = :userId AND prt.used = false ORDER BY prt.createdAt DESC")
    List<PasswordResetToken> findUnusedTokensByUserId(@Param("userId") Long userId);
    
    /**
     * 만료된 토큰들 조회
     */
    @Query("SELECT prt FROM PasswordResetToken prt WHERE prt.expiresAt < :now")
    List<PasswordResetToken> findExpiredTokens(@Param("now") LocalDateTime now);
    
    /**
     * 특정 사용자의 모든 토큰을 사용됨으로 표시
     */
    @Modifying
    @Query("UPDATE PasswordResetToken prt SET prt.used = true, prt.usedAt = :usedAt WHERE prt.user.id = :userId AND prt.used = false")
    int markAllTokensAsUsedByUserId(@Param("userId") Long userId, @Param("usedAt") LocalDateTime usedAt);
    
    /**
     * 특정 이메일의 모든 토큰을 사용됨으로 표시
     */
    @Modifying
    @Query("UPDATE PasswordResetToken prt SET prt.used = true, prt.usedAt = :usedAt WHERE prt.email = :email AND prt.used = false")
    int markAllTokensAsUsedByEmail(@Param("email") String email, @Param("usedAt") LocalDateTime usedAt);
    
    /**
     * 만료된 토큰들 삭제
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken prt WHERE prt.expiresAt < :expiredBefore")
    int deleteExpiredTokens(@Param("expiredBefore") LocalDateTime expiredBefore);
}

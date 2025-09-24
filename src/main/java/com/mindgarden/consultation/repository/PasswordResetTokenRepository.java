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
 * @since 2025-01-17
 */
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    /**
     * 토큰으로 조회
     */
    Optional<PasswordResetToken> findByToken(String token);
    
    /**
     * 사용자 ID로 유효한 토큰 조회
     */
    @Query("SELECT prt FROM PasswordResetToken prt WHERE prt.userId = :userId AND prt.used = false AND prt.expiresAt > :now ORDER BY prt.createdAt DESC")
    List<PasswordResetToken> findValidTokensByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);
    
    /**
     * 이메일로 유효한 토큰 조회
     */
    @Query("SELECT prt FROM PasswordResetToken prt WHERE prt.email = :email AND prt.used = false AND prt.expiresAt > :now ORDER BY prt.createdAt DESC")
    List<PasswordResetToken> findValidTokensByEmail(@Param("email") String email, @Param("now") LocalDateTime now);
    
    /**
     * 만료된 토큰 삭제
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken prt WHERE prt.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);
    
    /**
     * 사용자 ID로 모든 토큰 삭제
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken prt WHERE prt.userId = :userId")
    int deleteByUserId(@Param("userId") Long userId);
    
    /**
     * 토큰 사용 처리
     */
    @Modifying
    @Query("UPDATE PasswordResetToken prt SET prt.used = true, prt.usedAt = :usedAt WHERE prt.token = :token")
    int markTokenAsUsed(@Param("token") String token, @Param("usedAt") LocalDateTime usedAt);
}
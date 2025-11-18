package com.mindgarden.consultation.repository;

import com.mindgarden.consultation.entity.UserPasskey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 사용자 Passkey Repository
 * Week 15-16: Passkey 인증 설계 및 준비
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface UserPasskeyRepository extends JpaRepository<UserPasskey, Long> {
    
    /**
     * Credential ID로 Passkey 조회
     * 
     * @param credentialId WebAuthn Credential ID
     * @return Passkey 엔티티
     */
    Optional<UserPasskey> findByCredentialIdAndIsDeletedFalse(String credentialId);
    
    /**
     * 사용자 ID로 활성화된 Passkey 목록 조회
     * 
     * @param userId 사용자 ID
     * @return Passkey 목록
     */
    @Query("SELECT p FROM UserPasskey p WHERE p.user.id = :userId AND p.isActive = true AND p.isDeleted = false ORDER BY p.lastUsedAt DESC NULLS LAST, p.createdAt DESC")
    List<UserPasskey> findActivePasskeysByUserId(@Param("userId") Long userId);
    
    /**
     * 사용자 ID와 Credential ID로 Passkey 조회
     * 
     * @param userId 사용자 ID
     * @param credentialId WebAuthn Credential ID
     * @return Passkey 엔티티
     */
    Optional<UserPasskey> findByUserIdAndCredentialIdAndIsDeletedFalse(Long userId, String credentialId);
    
    /**
     * 사용자 ID로 Passkey 개수 조회
     * 
     * @param userId 사용자 ID
     * @return Passkey 개수
     */
    @Query("SELECT COUNT(p) FROM UserPasskey p WHERE p.user.id = :userId AND p.isDeleted = false")
    long countByUserId(@Param("userId") Long userId);
}


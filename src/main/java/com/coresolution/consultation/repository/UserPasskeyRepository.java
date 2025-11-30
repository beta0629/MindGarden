package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.UserPasskey;
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
    
    // ==================== tenantId 필터링 메서드 ====================
    
    /**
     * Credential ID로 Passkey 조회 (tenantId 필터링)
     * 
     * @param tenantId 테넌트 ID
     * @param credentialId WebAuthn Credential ID
     * @return Passkey 엔티티
     */
    @Query("SELECT p FROM UserPasskey p WHERE p.tenantId = :tenantId AND p.credentialId = :credentialId AND p.isDeleted = false")
    Optional<UserPasskey> findByTenantIdAndCredentialIdAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("credentialId") String credentialId);
    
    /**
     * 사용자 ID로 활성화된 Passkey 목록 조회 (tenantId 필터링)
     * 
     * @param tenantId 테넌트 ID
     * @param userId 사용자 ID
     * @return Passkey 목록
     */
    @Query("SELECT p FROM UserPasskey p WHERE p.tenantId = :tenantId AND p.user.id = :userId AND p.isActive = true AND p.isDeleted = false ORDER BY p.lastUsedAt DESC NULLS LAST, p.createdAt DESC")
    List<UserPasskey> findActivePasskeysByTenantIdAndUserId(@Param("tenantId") String tenantId, @Param("userId") Long userId);
    
    /**
     * 사용자 ID와 Credential ID로 Passkey 조회 (tenantId 필터링)
     * 
     * @param tenantId 테넌트 ID
     * @param userId 사용자 ID
     * @param credentialId WebAuthn Credential ID
     * @return Passkey 엔티티
     */
    @Query("SELECT p FROM UserPasskey p WHERE p.tenantId = :tenantId AND p.user.id = :userId AND p.credentialId = :credentialId AND p.isDeleted = false")
    Optional<UserPasskey> findByTenantIdAndUserIdAndCredentialIdAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("userId") Long userId, @Param("credentialId") String credentialId);
    
    /**
     * 사용자 ID로 Passkey 개수 조회 (tenantId 필터링)
     * 
     * @param tenantId 테넌트 ID
     * @param userId 사용자 ID
     * @return Passkey 개수
     */
    @Query("SELECT COUNT(p) FROM UserPasskey p WHERE p.tenantId = :tenantId AND p.user.id = :userId AND p.isDeleted = false")
    long countByTenantIdAndUserId(@Param("tenantId") String tenantId, @Param("userId") Long userId);
    
    // ==================== @Deprecated 메서드 (하위 호환성) ====================
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 Passkey 접근 가능! findByTenantIdAndCredentialIdAndIsDeletedFalse 사용하세요.
     */
    @Deprecated
    Optional<UserPasskey> findByCredentialIdAndIsDeletedFalse(String credentialId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findActivePasskeysByTenantIdAndUserId 사용하세요.
     */
    @Deprecated
    @Query("SELECT p FROM UserPasskey p WHERE p.user.id = :userId AND p.isActive = true AND p.isDeleted = false ORDER BY p.lastUsedAt DESC NULLS LAST, p.createdAt DESC")
    List<UserPasskey> findActivePasskeysByUserId(@Param("userId") Long userId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndUserIdAndCredentialIdAndIsDeletedFalse 사용하세요.
     */
    @Deprecated
    Optional<UserPasskey> findByUserIdAndCredentialIdAndIsDeletedFalse(Long userId, String credentialId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! countByTenantIdAndUserId 사용하세요.
     */
    @Deprecated
    @Query("SELECT COUNT(p) FROM UserPasskey p WHERE p.user.id = :userId AND p.isDeleted = false")
    long countByUserId(@Param("userId") Long userId);
}

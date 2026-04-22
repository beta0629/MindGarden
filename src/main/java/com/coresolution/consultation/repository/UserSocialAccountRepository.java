package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.UserSocialAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * UserSocialAccount Repository 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface UserSocialAccountRepository extends JpaRepository<UserSocialAccount, Long> {
    
    // ==================== tenantId 필터링 메서드 ====================
    
    /**
     * 테넌트별 모든 소셜 계정 조회 (tenantId 필터링)
     */
    @Query("SELECT usa FROM UserSocialAccount usa WHERE usa.tenantId = :tenantId AND usa.isDeleted = false")
    List<UserSocialAccount> findByTenantId(@Param("tenantId") String tenantId);

    /**
     * 테넌트·PK로 소셜 계정 조회 (소프트 삭제 제외)
     *
     * @param tenantId 테넌트 ID
     * @param id       소셜 계정 PK
     * @return 소셜 계정 Optional
     */
    @Query("SELECT usa FROM UserSocialAccount usa WHERE usa.tenantId = :tenantId AND usa.id = :id AND usa.isDeleted = false")
    Optional<UserSocialAccount> findByTenantIdAndId(@Param("tenantId") String tenantId, @Param("id") Long id);
    
    /**
     * 제공자와 제공자 사용자 ID로 소셜 계정 조회 (tenantId 필터링)
     * 
     * @param tenantId 테넌트 ID
     * @param provider 소셜 제공자 (KAKAO, NAVER, FACEBOOK 등)
     * @param providerUserId 제공자 사용자 ID
     * @return 소셜 계정 정보
     */
    @Query("SELECT usa FROM UserSocialAccount usa WHERE usa.tenantId = :tenantId AND usa.provider = :provider AND usa.providerUserId = :providerUserId AND usa.isDeleted = false")
    Optional<UserSocialAccount> findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse(
        @Param("tenantId") String tenantId, @Param("provider") String provider, @Param("providerUserId") String providerUserId);
    
    /**
     * 사용자 ID로 소셜 계정 목록 조회 (tenantId 필터링)
     * 
     * @param tenantId 테넌트 ID
     * @param userId 사용자 ID
     * @return 소셜 계정 목록
     */
    @Query("SELECT usa FROM UserSocialAccount usa " +
           "WHERE usa.tenantId = :tenantId AND usa.user.id = :userId AND usa.isDeleted = false")
    List<UserSocialAccount> findByTenantIdAndUserIdAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("userId") Long userId);
    
    /**
     * 제공자로 소셜 계정 목록 조회 (tenantId 필터링)
     * 
     * @param tenantId 테넌트 ID
     * @param provider 소셜 제공자
     * @return 소셜 계정 목록
     */
    @Query("SELECT usa FROM UserSocialAccount usa WHERE usa.tenantId = :tenantId AND usa.provider = :provider AND usa.isDeleted = false")
    List<UserSocialAccount> findByTenantIdAndProviderAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("provider") String provider);
    
    /**
     * 사용자 ID와 제공자로 주요 소셜 계정 조회 (tenantId 필터링)
     * 
     * @param tenantId 테넌트 ID
     * @param userId 사용자 ID
     * @param provider 소셜 제공자
     * @return 주요 소셜 계정
     */
    @Query("SELECT usa FROM UserSocialAccount usa " +
           "WHERE usa.tenantId = :tenantId AND usa.user.id = :userId AND usa.provider = :provider AND usa.isPrimary = true AND usa.isDeleted = false")
    Optional<UserSocialAccount> findByTenantIdAndUserIdAndProviderAndIsPrimaryTrueAndIsDeletedFalse(
        @Param("tenantId") String tenantId, @Param("userId") Long userId, @Param("provider") String provider);
    
    /**
     * 이메일로 소셜 계정 조회 (tenantId 필터링)
     * 
     * @param tenantId 테넌트 ID
     * @param email 이메일
     * @return 소셜 계정 목록
     */
    @Query("SELECT usa FROM UserSocialAccount usa " +
           "JOIN usa.user u " +
           "WHERE usa.tenantId = :tenantId AND u.email = :email AND usa.isDeleted = false")
    List<UserSocialAccount> findByTenantIdAndUserEmail(@Param("tenantId") String tenantId, @Param("email") String email);
    
    /**
     * 사용자와 제공자로 소셜 계정 조회 (tenantId 필터링)
     * 
     * @param tenantId 테넌트 ID
     * @param user 사용자
     * @param provider 소셜 제공자
     * @return 소셜 계정
     */
    @Query("SELECT usa FROM UserSocialAccount usa WHERE usa.tenantId = :tenantId AND usa.user = :user AND usa.provider = :provider AND usa.isDeleted = false")
    Optional<UserSocialAccount> findByTenantIdAndUserAndProviderAndIsDeletedFalse(
        @Param("tenantId") String tenantId, @Param("user") com.coresolution.consultation.entity.User user, @Param("provider") String provider);

    /**
     * 테넌트 컬럼이 비어 있거나 세션 tenant와 불일치하는 레거시 행 해제용.
     * 소유자(user PK) + provider + 미삭제만 검증한다.
     */
    @Query("SELECT usa FROM UserSocialAccount usa WHERE usa.user.id = :userId AND usa.provider = :provider AND usa.isDeleted = false")
    Optional<UserSocialAccount> findActiveByUserIdAndProvider(
        @Param("userId") Long userId, @Param("provider") String provider);
    
    /**
     * 사용자로 소셜 계정 목록 조회 (tenantId 필터링)
     * 
     * @param tenantId 테넌트 ID
     * @param user 사용자
     * @return 소셜 계정 목록
     */
    @Query("SELECT usa FROM UserSocialAccount usa WHERE usa.tenantId = :tenantId AND usa.user = :user AND usa.isDeleted = false")
    List<UserSocialAccount> findByTenantIdAndUserAndIsDeletedFalse(
        @Param("tenantId") String tenantId, @Param("user") com.coresolution.consultation.entity.User user);
    
    // ==================== @Deprecated 메서드 (하위 호환성) ====================
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 소셜 계정 접근 가능! findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse 사용하세요.
     */
    @Deprecated
    Optional<UserSocialAccount> findByProviderAndProviderUserIdAndIsDeletedFalse(
        String provider, String providerUserId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndUserIdAndIsDeletedFalse 사용하세요.
     */
    @Deprecated
    @Query("SELECT usa FROM UserSocialAccount usa " +
           "WHERE usa.user.id = :userId AND usa.isDeleted = false")
    List<UserSocialAccount> findByUserIdAndIsDeletedFalse(@Param("userId") Long userId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndProviderAndIsDeletedFalse 사용하세요.
     */
    @Deprecated
    List<UserSocialAccount> findByProviderAndIsDeletedFalse(String provider);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndUserIdAndProviderAndIsPrimaryTrueAndIsDeletedFalse 사용하세요.
     */
    @Deprecated
    @Query("SELECT usa FROM UserSocialAccount usa " +
           "WHERE usa.user.id = :userId AND usa.provider = :provider AND usa.isPrimary = true AND usa.isDeleted = false")
    Optional<UserSocialAccount> findByUserIdAndProviderAndIsPrimaryTrueAndIsDeletedFalse(
        @Param("userId") Long userId, @Param("provider") String provider);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndUserEmail 사용하세요.
     */
    @Deprecated
    @Query("SELECT usa FROM UserSocialAccount usa " +
           "JOIN usa.user u " +
           "WHERE u.email = :email AND usa.isDeleted = false")
    List<UserSocialAccount> findByUserEmail(@Param("email") String email);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndUserAndProviderAndIsDeletedFalse 사용하세요.
     */
    @Deprecated
    Optional<UserSocialAccount> findByUserAndProviderAndIsDeletedFalse(
        com.coresolution.consultation.entity.User user, String provider);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndUserAndIsDeletedFalse 사용하세요.
     */
    @Deprecated
    List<UserSocialAccount> findByUserAndIsDeletedFalse(
        com.coresolution.consultation.entity.User user);
}

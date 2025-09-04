package com.mindgarden.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.UserSocialAccount;
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
    
    /**
     * 제공자와 제공자 사용자 ID로 소셜 계정 조회
     * 
     * @param provider 소셜 제공자 (KAKAO, NAVER, FACEBOOK 등)
     * @param providerUserId 제공자 사용자 ID
     * @param isDeleted 삭제 여부
     * @return 소셜 계정 정보
     */
    Optional<UserSocialAccount> findByProviderAndProviderUserIdAndIsDeletedFalse(
        String provider, String providerUserId);
    
    /**
     * 사용자 ID로 소셜 계정 목록 조회
     * 
     * @param userId 사용자 ID
     * @return 소셜 계정 목록
     */
    @Query("SELECT usa FROM UserSocialAccount usa " +
           "WHERE usa.user.id = :userId AND usa.isDeleted = false")
    List<UserSocialAccount> findByUserIdAndIsDeletedFalse(@Param("userId") Long userId);
    
    /**
     * 제공자로 소셜 계정 목록 조회
     * 
     * @param provider 소셜 제공자
     * @return 소셜 계정 목록
     */
    List<UserSocialAccount> findByProviderAndIsDeletedFalse(String provider);
    
    /**
     * 사용자 ID와 제공자로 주요 소셜 계정 조회
     * 
     * @param userId 사용자 ID
     * @param provider 소셜 제공자
     * @return 주요 소셜 계정
     */
    @Query("SELECT usa FROM UserSocialAccount usa " +
           "WHERE usa.user.id = :userId AND usa.provider = :provider AND usa.isPrimary = true AND usa.isDeleted = false")
    Optional<UserSocialAccount> findByUserIdAndProviderAndIsPrimaryTrueAndIsDeletedFalse(
        @Param("userId") Long userId, @Param("provider") String provider);
    
    /**
     * 이메일로 소셜 계정 조회
     * 
     * @param email 이메일
     * @return 소셜 계정 목록
     */
    @Query("SELECT usa FROM UserSocialAccount usa " +
           "JOIN usa.user u " +
           "WHERE u.email = :email AND usa.isDeleted = false")
    List<UserSocialAccount> findByUserEmail(@Param("email") String email);
    
    /**
     * 사용자와 제공자로 소셜 계정 조회
     * 
     * @param user 사용자
     * @param provider 소셜 제공자
     * @return 소셜 계정
     */
    Optional<UserSocialAccount> findByUserAndProviderAndIsDeletedFalse(
        com.mindgarden.consultation.entity.User user, String provider);
    
    /**
     * 사용자로 소셜 계정 목록 조회
     * 
     * @param user 사용자
     * @return 소셜 계정 목록
     */
    List<UserSocialAccount> findByUserAndIsDeletedFalse(
        com.mindgarden.consultation.entity.User user);
}

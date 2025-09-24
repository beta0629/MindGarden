package com.mindgarden.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.UserPrivacyConsent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 사용자 개인정보 동의 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Repository
public interface UserPrivacyConsentRepository extends JpaRepository<UserPrivacyConsent, Long> {
    
    /**
     * 사용자 ID로 최신 동의 정보 조회
     */
    @Query("SELECT upc FROM UserPrivacyConsent upc WHERE upc.userId = :userId ORDER BY upc.consentDate DESC")
    List<UserPrivacyConsent> findByUserIdOrderByConsentDateDesc(@Param("userId") Long userId);
    
    /**
     * 사용자 ID로 최신 동의 정보 조회 (단일)
     */
    @Query("SELECT upc FROM UserPrivacyConsent upc WHERE upc.userId = :userId ORDER BY upc.consentDate DESC LIMIT 1")
    Optional<UserPrivacyConsent> findLatestByUserId(@Param("userId") Long userId);
    
    /**
     * 사용자 ID로 개인정보 처리방침 동의 여부 조회
     */
    @Query("SELECT upc.privacyConsent FROM UserPrivacyConsent upc WHERE upc.userId = :userId ORDER BY upc.consentDate DESC")
    Optional<Boolean> findLatestPrivacyConsentByUserId(@Param("userId") Long userId);
    
    /**
     * 사용자 ID로 이용약관 동의 여부 조회
     */
    @Query("SELECT upc.termsConsent FROM UserPrivacyConsent upc WHERE upc.userId = :userId ORDER BY upc.consentDate DESC")
    Optional<Boolean> findLatestTermsConsentByUserId(@Param("userId") Long userId);
    
    /**
     * 사용자 ID로 마케팅 동의 여부 조회
     */
    @Query("SELECT upc.marketingConsent FROM UserPrivacyConsent upc WHERE upc.userId = :userId ORDER BY upc.consentDate DESC")
    Optional<Boolean> findLatestMarketingConsentByUserId(@Param("userId") Long userId);
}

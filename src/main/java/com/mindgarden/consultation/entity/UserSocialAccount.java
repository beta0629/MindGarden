package com.mindgarden.consultation.entity;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 사용자 SNS 계정 연동 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "user_social_accounts", indexes = {
    @Index(name = "idx_user_social_accounts_user_id", columnList = "user_id"),
    @Index(name = "idx_user_social_accounts_provider", columnList = "provider"),
    @Index(name = "idx_user_social_accounts_provider_user_id", columnList = "provider_user_id"),
    @Index(name = "idx_user_social_accounts_is_deleted", columnList = "is_deleted")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSocialAccount extends BaseEntity {
    
    // 상수 정의
    public static final String USER_ID = "user_id";
    public static final String PROVIDER = "provider";
    public static final String PROVIDER_USER_ID = "provider_user_id";
    public static final String PROVIDER_USERNAME = "provider_username";
    public static final String PROVIDER_EMAIL = "provider_email";
    public static final String PROVIDER_NAME = "provider_name";
    public static final String PROVIDER_PROFILE_IMAGE = "provider_profile_image";
    public static final String ACCESS_TOKEN = "access_token";
    public static final String REFRESH_TOKEN = "refresh_token";
    public static final String TOKEN_EXPIRES_AT = "token_expires_at";
    public static final String REFRESH_TOKEN_EXPIRES_AT = "refresh_token_expires_at";
    public static final String IS_TOKEN_VALID = "is_token_valid";
    public static final String LAST_TOKEN_REFRESH = "last_token_refresh";
    public static final String TOKEN_REFRESH_COUNT = "token_refresh_count";
    public static final String IS_PRIMARY = "is_primary";
    public static final String IS_VERIFIED = "is_verified";
    public static final String VERIFICATION_DATE = "verification_date";
    public static final String VERIFICATION_METHOD = "verification_method";
    
    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = USER_ID, nullable = false)
    @JsonBackReference
    private User user;
    
    @NotNull(message = "SNS 제공자는 필수입니다.")
    @Size(max = 20, message = "SNS 제공자는 20자 이하여야 합니다.")
    @Column(name = PROVIDER, nullable = false, length = 20)
    private String provider; // KAKAO, NAVER, FACEBOOK, INSTAGRAM
    
    @NotNull(message = "SNS 제공자 사용자 ID는 필수입니다.")
    @Size(max = 100, message = "SNS 제공자 사용자 ID는 100자 이하여야 합니다.")
    @Column(name = PROVIDER_USER_ID, nullable = false, length = 500) // 암호화된 데이터를 위해 길이 확장
    private String providerUserId;
    
    @Size(max = 100, message = "SNS 제공자 사용자명은 100자 이하여야 합니다.")
    @Column(name = PROVIDER_USERNAME, length = 500) // 암호화된 데이터를 위해 길이 확장
    private String providerUsername;
    
    @Size(max = 100, message = "SNS 제공자 이메일은 100자 이하여야 합니다.")
    @Column(name = PROVIDER_EMAIL, length = 100)
    private String providerEmail;
    
    @Size(max = 100, message = "SNS 제공자 이름은 100자 이하여야 합니다.")
    @Column(name = PROVIDER_NAME, length = 100)
    private String providerName;
    
    @Size(max = 500, message = "SNS 제공자 프로필 이미지는 500자 이하여야 합니다.")
    @Column(name = PROVIDER_PROFILE_IMAGE, length = 500)
    private String providerProfileImage;
    
    @Size(max = 500, message = "액세스 토큰은 500자 이하여야 합니다.")
    @Column(name = ACCESS_TOKEN, length = 500)
    private String accessToken;
    
    @Size(max = 500, message = "리프레시 토큰은 500자 이하여야 합니다.")
    @Column(name = REFRESH_TOKEN, length = 500)
    private String refreshToken;
    
    @Column(name = TOKEN_EXPIRES_AT)
    private LocalDateTime tokenExpiresAt;
    
    @Column(name = REFRESH_TOKEN_EXPIRES_AT)
    private LocalDateTime refreshTokenExpiresAt;
    
    @Column(name = IS_TOKEN_VALID)
    private Boolean isTokenValid = true; // 토큰 유효성 여부
    
    @Column(name = LAST_TOKEN_REFRESH)
    private LocalDateTime lastTokenRefresh; // 마지막 토큰 갱신일시
    
    @Column(name = TOKEN_REFRESH_COUNT)
    private Integer tokenRefreshCount = 0; // 토큰 갱신 횟수
    
    @Column(name = IS_PRIMARY)
    private Boolean isPrimary = false; // 주요 연동 계정 여부
    
    @Column(name = IS_VERIFIED)
    private Boolean isVerified = false; // 계정 인증 여부
    
    @Column(name = VERIFICATION_DATE)
    private LocalDateTime verificationDate; // 인증 완료일시
    
    @Size(max = 100, message = "인증 방법은 100자 이하여야 합니다.")
    @Column(name = VERIFICATION_METHOD, length = 100)
    private String verificationMethod; // 인증 방법
    
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt; // 마지막 로그인일시
    
    @Column(name = "login_count")
    private Integer loginCount = 0; // 로그인 횟수
    
    @Column(name = "is_active")
    private Boolean isActive = true; // 연동 계정 활성화 여부
    
    @Size(max = 1000, message = "SNS 제공자 메타데이터는 1000자 이하여야 합니다.")
    @Column(name = "provider_metadata", columnDefinition = "TEXT")
    private String providerMetadata; // SNS 제공자 메타데이터 (JSON)
    
    @Size(max = 500, message = "연동 해제 사유는 500자 이하여야 합니다.")
    @Column(name = "disconnect_reason", length = 500)
    private String disconnectReason; // 연동 해제 사유
    
    @Column(name = "disconnected_at")
    private LocalDateTime disconnectedAt; // 연동 해제일시
    

    
    // 비즈니스 메서드
    /**
     * 토큰 갱신
     */
    public void refreshToken(String newAccessToken, String newRefreshToken, LocalDateTime expiresAt) {
        this.accessToken = newAccessToken;
        this.refreshToken = newRefreshToken;
        this.tokenExpiresAt = expiresAt;
        this.lastTokenRefresh = LocalDateTime.now();
        this.tokenRefreshCount++;
        this.isTokenValid = true;
    }
    
    /**
     * 토큰 만료 처리
     */
    public void expireToken() {
        this.isTokenValid = false;
    }
    
    /**
     * 로그인 처리
     */
    public void login() {
        this.lastLoginAt = LocalDateTime.now();
        this.loginCount++;
    }
    
    /**
     * 계정 인증 완료
     */
    public void verify(String method) {
        this.isVerified = true;
        this.verificationDate = LocalDateTime.now();
        this.verificationMethod = method;
    }
    
    /**
     * 주요 연동 계정 설정
     */
    public void setAsPrimary() {
        this.isPrimary = true;
    }
    
    /**
     * 주요 연동 계정 해제
     */
    public void unsetAsPrimary() {
        this.isPrimary = false;
    }
    
    /**
     * 연동 계정 비활성화
     */
    public void deactivate(String reason) {
        this.isActive = false;
        this.disconnectReason = reason;
        this.disconnectedAt = LocalDateTime.now();
    }
    
    /**
     * 연동 계정 재활성화
     */
    public void reactivate() {
        this.isActive = true;
        this.disconnectReason = null;
        this.disconnectedAt = null;
    }
    
    /**
     * 토큰 유효성 확인
     */
    public boolean isTokenValid() {
        return Boolean.TRUE.equals(isTokenValid) && (tokenExpiresAt == null || LocalDateTime.now().isBefore(tokenExpiresAt));
    }
    
    /**
     * 토큰 갱신 필요 여부 확인
     */
    public boolean needsTokenRefresh() {
        return tokenExpiresAt != null && LocalDateTime.now().isAfter(tokenExpiresAt.minusMinutes(30));
    }
    
    // Getter & Setter
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }
    
    public String getProvider() {
        return provider;
    }
    
    public void setProvider(String provider) {
        this.provider = provider;
    }
    
    public String getProviderUserId() {
        return providerUserId;
    }
    
    public void setProviderUserId(String providerUserId) {
        this.providerUserId = providerUserId;
    }
    
    public String getProviderUsername() {
        return providerUsername;
    }
    
    public void setProviderUsername(String providerUsername) {
        this.providerUsername = providerUsername;
    }
    
    public String getProviderEmail() {
        return providerEmail;
    }
    
    public void setProviderEmail(String providerEmail) {
        this.providerEmail = providerEmail;
    }
    
    public String getProviderName() {
        return providerName;
    }
    
    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }
    
    public String getProviderProfileImage() {
        return providerProfileImage;
    }
    
    public void setProviderProfileImage(String providerProfileImage) {
        this.providerProfileImage = providerProfileImage;
    }
    
    public String getAccessToken() {
        return accessToken;
    }
    
    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }
    
    public String getRefreshToken() {
        return refreshToken;
    }
    
    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
    
    public LocalDateTime getTokenExpiresAt() {
        return tokenExpiresAt;
    }
    
    public void setTokenExpiresAt(LocalDateTime tokenExpiresAt) {
        this.tokenExpiresAt = tokenExpiresAt;
    }
    
    public LocalDateTime getRefreshTokenExpiresAt() {
        return refreshTokenExpiresAt;
    }
    
    public void setRefreshTokenExpiresAt(LocalDateTime refreshTokenExpiresAt) {
        this.refreshTokenExpiresAt = refreshTokenExpiresAt;
    }
    
    public Boolean getIsTokenValid() {
        return isTokenValid;
    }
    
    public void setIsTokenValid(Boolean isTokenValid) {
        this.isTokenValid = isTokenValid;
    }
    
    public LocalDateTime getLastTokenRefresh() {
        return lastTokenRefresh;
    }
    
    public void setLastTokenRefresh(LocalDateTime lastTokenRefresh) {
        this.lastTokenRefresh = lastTokenRefresh;
    }
    
    public Integer getTokenRefreshCount() {
        return tokenRefreshCount;
    }
    
    public void setTokenRefreshCount(Integer tokenRefreshCount) {
        this.tokenRefreshCount = tokenRefreshCount;
    }
    
    public Boolean getIsPrimary() {
        return isPrimary;
    }
    
    public void setIsPrimary(Boolean isPrimary) {
        this.isPrimary = isPrimary;
    }
    
    public Boolean getIsVerified() {
        return isVerified;
    }
    
    public void setIsVerified(Boolean isVerified) {
        this.isVerified = isVerified;
    }
    
    public LocalDateTime getVerificationDate() {
        return verificationDate;
    }
    
    public void setVerificationDate(LocalDateTime verificationDate) {
        this.verificationDate = verificationDate;
    }
    
    public String getVerificationMethod() {
        return verificationMethod;
    }
    
    public void setVerificationMethod(String verificationMethod) {
        this.verificationMethod = verificationMethod;
    }
    
    public LocalDateTime getLastLoginAt() {
        return lastLoginAt;
    }
    
    public void setLastLoginAt(LocalDateTime lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }
    
    public Integer getLoginCount() {
        return loginCount;
    }
    
    public void setLoginCount(Integer loginCount) {
        this.loginCount = loginCount;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public String getProviderMetadata() {
        return providerMetadata;
    }
    
    public void setProviderMetadata(String providerMetadata) {
        this.providerMetadata = providerMetadata;
    }
    
    public String getDisconnectReason() {
        return disconnectReason;
    }
    
    public void setDisconnectReason(String disconnectReason) {
        this.disconnectReason = disconnectReason;
    }
    
    public LocalDateTime getDisconnectedAt() {
        return disconnectedAt;
    }
    
    public void setDisconnectedAt(LocalDateTime disconnectedAt) {
        this.disconnectedAt = disconnectedAt;
    }
    
    // toString
    @Override
    public String toString() {
        return "UserSocialAccount{" +
                "id=" + getId() +
                ", userId=" + (user != null ? user.getId() : null) +
                ", provider='" + provider + '\'' +
                ", providerUserId='" + providerUserId + '\'' +
                ", providerUsername='" + providerUsername + '\'' +
                ", isPrimary=" + isPrimary +
                ", isVerified=" + isVerified +
                ", isActive=" + isActive +
                '}';
    }
}

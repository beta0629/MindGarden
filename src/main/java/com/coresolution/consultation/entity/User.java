package com.coresolution.consultation.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.NotificationChannelPreferenceCode;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.converter.UserRoleConverter;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 사용자 기본 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Table(name = "users", 
    indexes = {
        @Index(name = "idx_users_email", columnList = "email"),
        @Index(name = "idx_users_phone", columnList = "phone"),
        @Index(name = "idx_users_role", columnList = "role"),
        @Index(name = "idx_users_grade", columnList = "grade"),
        @Index(name = "idx_users_is_deleted", columnList = "is_deleted"),
        @Index(name = "idx_users_lifecycle_state", columnList = "tenant_id, lifecycle_state"),
        @Index(name = "idx_users_withdrawal_pending", columnList = "lifecycle_state, withdrawal_requested_at")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "UK_users_email_tenant", columnNames = {"email", "tenant_id"}),
        @UniqueConstraint(name = "UK_users_user_id", columnNames = {"user_id"}) // 표준화 2025-12-08: DB 컬럼명도 user_id로 변경
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User extends BaseEntity {
    
    @NotBlank(message = "사용자 ID는 필수입니다.")
    @Size(min = 2, max = 50, message = "사용자 ID는 2자 이상 50자 이하여야 합니다.")
    @Column(name = "user_id", nullable = false, unique = true, length = 50) // 표준화 2025-12-08: DB 컬럼명도 user_id로 변경
    private String userId; // 표준화 2025-12-08: username -> userId 필드명 변경
    
    @NotBlank(message = "이메일은 필수입니다.")
    // @Email 제거: 암호화된 이메일은 이메일 형식이 아니므로 검증 제거 (암호화 전 검증은 DTO에서 수행)
    @Column(name = "email", nullable = false, length = 500) // 암호화된 데이터를 위해 길이 확장
    private String email;
    
    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 8, max = 100, message = "비밀번호는 8자 이상 100자 이하여야 합니다.")
    @Column(name = "password", nullable = false, length = 100)
    private String password;
    
    @NotBlank(message = "이름은 필수입니다.")
    @Size(min = 1, max = 500, message = "이름은 1자 이상 500자 이하여야 합니다.") // 암호화된 데이터를 위해 길이 확장
    @Column(name = "name", nullable = false, length = 500) // 암호화된 데이터를 위해 길이 확장
    private String name;
    
    @Size(max = 50, message = "닉네임은 50자 이하여야 합니다.")
    @Column(name = "nickname", length = 500) // 암호화된 데이터를 위해 길이 확장
    private String nickname;
    
    @Column(name = "phone", length = 500) // 암호화된 데이터를 위해 길이 확장
    private String phone;
    
    @Column(name = "gender", length = 500) // 암호화된 데이터를 위해 길이 확장
    private String gender;
    
    @Column(name = "birth_date")
    private LocalDate birthDate;
    
    @Column(name = "age_group", length = 20)
    private String ageGroup;
    
    @jakarta.persistence.Convert(converter = UserRoleConverter.class)
    @Column(name = "role", nullable = false, length = 20)
    private UserRole role = UserRole.CLIENT;

    /**
     * 테넌트 공통코드 {@code PROFESSIONAL_PROVIDER_TYPE}의 code_value. null이면 기본 상담사 유형으로 간주.
     */
    @Column(name = "professional_provider_type_code", length = 64)
    private String professionalProviderTypeCode;

    /**
     * 원장(ADMIN)이 상담 일정·전문가 업무 경로를 겸직하는지 여부.
     */
    @Column(name = "counseling_enabled", nullable = false)
    @Builder.Default
    private Boolean counselingEnabled = false;
    
    @Column(name = "grade", length = 30)
    private String grade;
    
    @Column(name = "experience_points")
    private Long experiencePoints = 0L;
    
    @Column(name = "total_consultations")
    private Integer totalConsultations = 0;

    /**
     * 과거 회기수 (외부 상담 이력).
     *
     * <p>어드민이 내담자 등록 시 입력하는 외부 상담 기관에서 진행된 회기 수.
     * 스케줄 상세 모달의 "사용/총" 회기 표시 시 매핑의 {@code usedSessions}/
     * {@code totalSessions} 와 합산되어 상담사가 전체 회기 흐름을 파악할 수 있도록 한다.</p>
     *
     * <p>정책 (Flyway V20260608_001):
     * <ul>
     *   <li>NULL 허용 — 신규 내담자(과거 이력 없음) = 합산 시 0 처리</li>
     *   <li>0 이상 정수만 의미 있음 — DTO {@code @Min(0)} 검증</li>
     *   <li>매핑 차감/복구 로직과 무관 — 표시 전용</li>
     * </ul>
     * </p>
     *
     * @since 2026-06-08
     */
    @Column(name = "past_session_count")
    private Long pastSessionCount;

    @Column(name = "last_grade_update")
    private LocalDateTime lastGradeUpdate;
    
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
    
    /**
     * 운영적 정지 플래그.
     *
     * <p>USER_LIFECYCLE_TERMINATION_POLICY §3.6 (Q1) — {@link #lifecycleState} 가 SSOT 가
     * 되면서 {@code is_active} 는 (a) 비밀번호 5회 실패 잠금, (b) 이메일 미인증, (c) 상담사
     * 자격 심사 대기, (d) 운영자 일시 로그인 차단 등 <strong>종료 의도가 없는 운영적 정지</strong>
     * 한정으로만 의미가 보존된다. 종료/탈퇴/익명화 분기에는 사용 금지 — Phase 5 종료 후 본 컬럼은
     * 별도 마이그레이션으로 제거된다.</p>
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * SSOT 회원 lifecycle 단계 (USER_LIFECYCLE_TERMINATION_POLICY §3.6, Q1).
     *
     * <p>Flyway V20260605_001 로 추가된 {@code lifecycle_state} 컬럼과 매핑된다. 자발/강제/자동
     * 종료의 단일 진실원이며 모든 상태 전이는 {@code UserLifecycleService.transitionTo(...)}
     * 단일 진입점으로 수행되어야 한다.</p>
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "lifecycle_state", nullable = false, length = 30)
    @Builder.Default
    private LifecycleState lifecycleState = LifecycleState.ACTIVE;

    /**
     * 자발 탈퇴 신청(=WITHDRAWAL_PENDING) 진입 시각 (USER_LIFECYCLE_TERMINATION_POLICY Q3).
     *
     * <p>Flyway V20260605_002 로 추가된 {@code withdrawal_requested_at} 컬럼과 매핑된다.
     * 30일 유예 만료 cron 의 기준점. WITHDRAWAL_PENDING 외 상태에서는 항상 {@code null}.</p>
     */
    @Column(name = "withdrawal_requested_at")
    private LocalDateTime withdrawalRequestedAt;

    /**
     * 자발 탈퇴 본인 옵션 JSON (USER_LIFECYCLE_TERMINATION_POLICY v1.1 §0.1 Q12-b).
     *
     * <p>Flyway V20260606_002 로 추가된 {@code withdrawal_options_json} 컬럼과 매핑된다.
     * WITHDRAWAL_PENDING 진입 시점에 {@link com.coresolution.consultation.dto.lifecycle.WithdrawalOptions#toJsonOrNull()}
     * 직렬화 결과를 저장하고, 30일 유예 만료 후 ANONYMIZED 전이 시점에
     * {@link com.coresolution.consultation.dto.lifecycle.WithdrawalOptions#fromJsonOrDefaults(String)}
     * 로 복원하여 community body 등 사용자-선택 PII 처리 분기에 사용된다.
     * 기본값 (모든 옵션 미선택) 은 NULL.</p>
     */
    @Column(name = "withdrawal_options_json", columnDefinition = "TEXT")
    private String withdrawalOptionsJson;

    /**
     * 어드민 강제 종료(=DELETED_BY_ADMIN) 진입 시 강제 종료를 수행한 어드민 users.id.
     *
     * <p>USER_LIFECYCLE_TERMINATION_POLICY §0.1 Q5 — 7일 보존 윈도우 동안 어드민 대시보드에서
     * "되돌리기" 기능을 제공하기 위해, 누가 강제 종료를 수행했는지 조회용 컬럼을 보강한다.
     * audit_logs 에 동일 actor_user_id 가 기록되지만, pending-deletion 목록 조회 시 join 비용을
     * 줄이기 위해 users 테이블에 캐시 컬럼으로 둔다. 자발 탈퇴/자동 cron 진입 행은 NULL.</p>
     *
     * <p>Flyway V20260606_003 로 추가된 {@code deleted_by_admin_id} 컬럼과 매핑된다.</p>
     */
    @Column(name = "deleted_by_admin_id")
    private Long deletedByAdminId;

    /**
     * 소셜 계정 여부
     */
    @Column(name = "is_social_account", nullable = false)
    @Builder.Default
    private Boolean isSocialAccount = false;
    
    /**
     * 소셜 계정 제공자 (KAKAO, NAVER 등)
     */
    @Column(name = "social_provider", length = 20)
    private String socialProvider;
    
    /**
     * 소셜 계정 ID
     */
    @Column(name = "social_provider_user_id", length = 100)
    private String socialProviderUserId;

    /**
     * Sign in with Apple (SIWA) subject identifier — Apple identityToken {@code sub} 의 영구 식별자.
     *
     * <p>Apple App Store 4.8 (T1) 대응. {@link #socialProvider}/{@link #socialProviderUserId} 는
     * 다중 소셜 제공자 공통 컬럼이지만, Apple sub 는 UNIQUE 조회 성능과 멱등 가입 보장을
     * 위해 별도 컬럼으로 보강한다. Flyway {@code V20260607_009} 가 NULLABLE UNIQUE 로 추가.</p>
     *
     * @since 2026-06-07
     */
    @Column(name = "apple_sub", length = 64, unique = true)
    private String appleSub;

    /**
     * 소셜 계정 연동 시간
     */
    @Column(name = "social_linked_at")
    private LocalDateTime socialLinkedAt;
    
    @Column(name = "is_email_verified", nullable = false)
    @Builder.Default
    private Boolean isEmailVerified = false;
    
    @Column(name = "email_verification_token", length = 100)
    private String emailVerificationToken;
    
    @Column(name = "email_verification_expires_at")
    private LocalDateTime emailVerificationExpiresAt;
    
    @Column(name = "password_reset_token", length = 100)
    private String passwordResetToken;
    
    @Column(name = "password_reset_expires_at")
    private LocalDateTime passwordResetExpiresAt;
    
    /**
     * 비밀번호 변경 여부 (임시 비밀번호인 경우 false, 비밀번호 변경 후 true)
     */
    @Column(name = "is_password_changed", nullable = false)
    @Builder.Default
    private Boolean isPasswordChanged = true; // 기본값은 true (기존 사용자는 이미 비밀번호 변경 완료)
    
    /**
     * 프로필 이미지 URL — base64 dataURI 금지, 절대/상대 URL 만 저장.
     * 컬럼 폭 500 자 제한 (V20260609_002 Flyway 마이그레이션으로 longtext → varchar(500) 축소).
     * 운영 DB 사전 검증: CHAR_LENGTH > 500 인 row 0건 (2026-06-09 운영 스캔).
     */
    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;
    
    @Column(name = "memo", columnDefinition = "TEXT")
    private String memo;
    
    /** 주민번호 암호화값 (앞 6자리+뒤 1자리만 저장, 상담일지·API에는 노출하지 않음) */
    @Column(name = "rrn_encrypted", length = 500)
    private String rrnEncrypted;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "address_detail", length = 500)
    private String addressDetail;
    
    @Column(name = "postal_code", length = 20)
    private String postalCode;
    
    @Column(name = "age")
    private Integer age;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "specialization", columnDefinition = "TEXT")
    private String specialization;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = jakarta.persistence.FetchType.LAZY)
    @JsonManagedReference
    private List<UserSocialAccount> userSocialAccounts;
    
    /**
     * @Deprecated - 🚨 레거시 호환: 브랜치 개념 제거됨 (2025-12-07)
     * 브랜치 개념은 테넌트 기반으로 대체되었습니다.
     * PR-A(2026-06-13): branches 테이블 ARCHIVE 후 @ManyToOne LAZY proxy 가
     * 빈 결과/배치 실패를 유발해 직접 Long 컬럼 매핑으로 전환.
     * 레거시 데이터 호환을 위해 컬럼만 유지 (NULL 허용)
     * 새로운 코드에서는 사용하지 마세요. tenantId만 사용하세요.
     */
    @Deprecated
    @Column(name = "branch_id")
    private Long branchId;
    
    /**
     * 🚨 레거시 호환: 브랜치 코드 기반 필터링 사용 금지
     * 레거시 데이터 호환을 위해 필드 유지 (NULL 허용)
     * 새로운 코드에서는 사용하지 마세요. tenantId만 사용하세요.
     * 
     * 제거 예정: 2026-01-01
     */
    @Deprecated
    @Column(name = "branch_code", length = 20)
    private String branchCode;
    
    /**
     * 상담사 전문분야 (상담사만 사용)
     */
    @Column(name = "specialty", length = 100)
    private String specialty;
    
    // === 사용자 설정 관련 필드들 ===
    
    /**
     * 이메일 알림 설정
     */
    @Column(name = "email_notification")
    @Builder.Default
    private Boolean emailNotification = true;
    
    /**
     * SMS 알림 설정
     */
    @Column(name = "sms_notification")
    @Builder.Default
    private Boolean smsNotification = false;
    
    /**
     * 푸시 알림 설정
     */
    @Column(name = "push_notification")
    @Builder.Default
    private Boolean pushNotification = true;
    
    /**
     * 카카오 알림톡 설정
     */
    @Column(name = "kakao_alimtalk_notification")
    @Builder.Default
    private Boolean kakaoAlimTalkNotification = true;
    
    /**
     * 알림 설정 (JSON 형태로 저장)
     */
    @Column(name = "notification_preferences", columnDefinition = "TEXT")
    private String notificationPreferences;

    /**
     * 알림 수신 채널 선호(Phase1). 레거시 {@link #notificationPreferences}·소셜 플래그와 병행 시
     * 발송 라우팅 우선순위는 {@code NotificationServiceImpl} 주석을 따른다.
     */
    @Column(name = "notification_channel_preference", nullable = false, length = 32)
    @Builder.Default
    private String notificationChannelPreference = NotificationChannelPreferenceCode.TENANT_DEFAULT.name();
    
    /**
     * 테마 설정 (client, consultant, admin)
     */
    @Column(name = "theme_preference", length = 50)
    @Builder.Default
    private String themePreference = null; // 역할별 기본값은 서비스에서 설정
    
    /**
     * 커스텀 테마 색상 (JSON 형태로 저장)
     */
    @Column(name = "custom_theme_colors", columnDefinition = "TEXT")
    private String customThemeColors;
    
    /**
     * 프로필 공개 설정 (public, private, friends)
     */
    @Column(name = "profile_visibility", length = 20)
    @Builder.Default
    private String profileVisibility = "private";
    
    /**
     * 데이터 공유 동의 여부
     */
    @Column(name = "data_sharing")
    @Builder.Default
    private Boolean dataSharing = false;
    
    /**
     * 자동 알림 설정
     */
    @Column(name = "auto_reminder")
    @Builder.Default
    private Boolean autoReminder = true;
    
    /**
     * 선호 상담 시간 (분)
     */
    @Column(name = "preferred_session_duration")
    @Builder.Default
    private Integer preferredSessionDuration = 50;
    
    // 비즈니스 메서드
    /**
     * 경험치 추가
     */
    public void addExperiencePoints(Long points) {
        if (points != null && points > 0) {
            this.experiencePoints += points;
            this.lastGradeUpdate = LocalDateTime.now();
        }
    }
    
    /**
     * 상담 횟수 증가
     */
    public void incrementConsultations() {
        this.totalConsultations++;
    }
    
    /**
     * 마지막 로그인 시간 업데이트
     */
    public void updateLastLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }
    
    /**
     * 이메일 인증 완료
     */
    public void verifyEmail() {
        this.isEmailVerified = true;
        this.emailVerificationToken = null;
        this.emailVerificationExpiresAt = null;
    }
    
    /**
     * 비밀번호 변경
     */
    public void changePassword(String newPassword) {
        this.password = newPassword;
        this.passwordResetToken = null;
        this.passwordResetExpiresAt = null;
        this.isPasswordChanged = true; // 비밀번호 변경 완료
    }
    
    /**
     * 사용자 활성화/비활성화 (운영적 정지 한정).
     *
     * <p>USER_LIFECYCLE_TERMINATION_POLICY §3.6 (Q1) — 본 setter 는 비밀번호 잠금/이메일
     * 미인증 등 <strong>종료 의도가 없는 운영적 정지</strong> 에만 사용. 종료/탈퇴/익명화
     * 분기는 {@code UserLifecycleService.transitionTo(...)} 를 사용하라.</p>
     */
    public void setActive(Boolean active) {
        this.isActive = active;
    }

    /**
     * SSOT lifecycle 단계 setter.
     *
     * <p>비즈니스 코드는 직접 호출하지 말고 {@code UserLifecycleService.transitionTo(...)}
     * 단일 진입점을 사용한다 (전이 가드·audit·destruction 로그 동시 처리). 본 setter 는
     * Lombok 호환·Phase 1 매핑·테스트 용으로만 노출된다.</p>
     */
    public void setLifecycleState(LifecycleState lifecycleState) {
        this.lifecycleState = lifecycleState;
    }

    public LifecycleState getLifecycleState() {
        return lifecycleState;
    }

    /** WITHDRAWAL_PENDING 진입 시각 (Q3 30일 유예 기준점). */
    public LocalDateTime getWithdrawalRequestedAt() {
        return withdrawalRequestedAt;
    }

    public void setWithdrawalRequestedAt(LocalDateTime withdrawalRequestedAt) {
        this.withdrawalRequestedAt = withdrawalRequestedAt;
    }
    
    // Getter & Setter
    // 표준화 2025-12-08: username -> userId 메서드명 변경
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    // 하위 호환성: 레거시 코드를 위한 메서드 (deprecated)
    @Deprecated
    public String getUsername() {
        return userId;
    }
    
    @Deprecated
    public void setUsername(String username) {
        this.userId = username;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getNickname() {
        return nickname;
    }
    
    public void setNickname(String nickname) {
        this.nickname = nickname;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public String getGender() {
        return gender;
    }
    
    public void setGender(String gender) {
        this.gender = gender;
    }
    
    public LocalDate getBirthDate() {
        return birthDate;
    }
    
    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }
    
    public String getAgeGroup() {
        return ageGroup;
    }
    
    public void setAgeGroup(String ageGroup) {
        this.ageGroup = ageGroup;
    }
    
    public UserRole getRole() {
        return role;
    }
    
    public void setRole(UserRole role) {
        this.role = role;
    }

    /**
     * 스케줄·전문가 목록 등에서 상담사 계열로 취급할지 여부.
     *
     * @return 전문가 역할이거나 ADMIN+상담 겸직이면 true
     */
    public boolean resolvesAsProfessionalProvider() {
        if (role != null && role.isProfessionalProvider()) {
            return true;
        }
        return UserRole.ADMIN.equals(role) && Boolean.TRUE.equals(counselingEnabled);
    }
    
    public String getGrade() {
        return grade;
    }
    
    public void setGrade(String grade) {
        this.grade = grade;
    }
    
    public Long getExperiencePoints() {
        return experiencePoints;
    }
    
    public void setExperiencePoints(Long experiencePoints) {
        this.experiencePoints = experiencePoints;
    }
    
    public Integer getTotalConsultations() {
        return totalConsultations;
    }
    
    public void setTotalConsultations(Integer totalConsultations) {
        this.totalConsultations = totalConsultations;
    }
    
    public LocalDateTime getLastGradeUpdate() {
        return lastGradeUpdate;
    }
    
    public void setLastGradeUpdate(LocalDateTime lastGradeUpdate) {
        this.lastGradeUpdate = lastGradeUpdate;
    }
    
    public LocalDateTime getLastLoginAt() {
        return lastLoginAt;
    }
    
    public void setLastLoginAt(LocalDateTime lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public Boolean getIsEmailVerified() {
        return isEmailVerified;
    }
    
    public void setIsEmailVerified(Boolean isEmailVerified) {
        this.isEmailVerified = isEmailVerified;
    }
    
    public String getEmailVerificationToken() {
        return emailVerificationToken;
    }
    
    public void setEmailVerificationToken(String emailVerificationToken) {
        this.emailVerificationToken = emailVerificationToken;
    }
    
    public LocalDateTime getEmailVerificationExpiresAt() {
        return emailVerificationExpiresAt;
    }
    
    public void setEmailVerificationExpiresAt(LocalDateTime emailVerificationExpiresAt) {
        this.emailVerificationExpiresAt = emailVerificationExpiresAt;
    }
    
    public String getPasswordResetToken() {
        return passwordResetToken;
    }
    
    public void setPasswordResetToken(String passwordResetToken) {
        this.passwordResetToken = passwordResetToken;
    }
    
    public LocalDateTime getPasswordResetExpiresAt() {
        return passwordResetExpiresAt;
    }
    
    public void setPasswordResetExpiresAt(LocalDateTime passwordResetExpiresAt) {
        this.passwordResetExpiresAt = passwordResetExpiresAt;
    }
    
    public String getProfileImageUrl() {
        return profileImageUrl;
    }
    
    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }
    
    public String getMemo() {
        return memo;
    }

    public void setMemo(String memo) {
        this.memo = memo;
    }

    public String getRrnEncrypted() {
        return rrnEncrypted;
    }

    public void setRrnEncrypted(String rrnEncrypted) {
        this.rrnEncrypted = rrnEncrypted;
    }

    public String getAddress() {
        return address;
    }
    
    public void setAddress(String address) {
        this.address = address;
    }
    
    public String getAddressDetail() {
        return addressDetail;
    }
    
    public void setAddressDetail(String addressDetail) {
        this.addressDetail = addressDetail;
    }
    
    public String getPostalCode() {
        return postalCode;
    }
    
    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }
    
    public Integer getAge() {
        return age;
    }
    
    public void setAge(Integer age) {
        this.age = age;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    // toString
    @Override
    public String toString() {
        return "User{" +
                "id=" + getId() +
                ", email='" + email + '\'' +
                ", name='" + name + '\'' +
                ", nickname='" + nickname + '\'' +
                ", phone='" + phone + '\'' +
                ", gender=" + gender +
                ", role='" + role + '\'' +
                ", grade='" + grade + '\'' +
                ", isActive=" + isActive +
                ", lifecycleState=" + lifecycleState +
                ", isEmailVerified=" + isEmailVerified +
                '}';
    }
}

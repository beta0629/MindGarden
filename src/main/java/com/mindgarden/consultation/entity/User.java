package com.mindgarden.consultation.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.converter.UserRoleConverter;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
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
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email"),
    @Index(name = "idx_users_phone", columnList = "phone"),
    @Index(name = "idx_users_role", columnList = "role"),
    @Index(name = "idx_users_grade", columnList = "grade"),
    @Index(name = "idx_users_is_deleted", columnList = "is_deleted")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User extends BaseEntity {
    
    @NotBlank(message = "사용자명은 필수입니다.")
    @Size(min = 2, max = 50, message = "사용자명은 2자 이상 50자 이하여야 합니다.")
    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;
    
    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;
    
    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 8, max = 100, message = "비밀번호는 8자 이상 100자 이하여야 합니다.")
    @Column(name = "password", nullable = false, length = 100)
    private String password;
    
    @NotBlank(message = "이름은 필수입니다.")
    @Size(min = 1, max = 50, message = "이름은 1자 이상 50자 이하여야 합니다.")
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
    
    @Column(name = "grade", length = 30)
    private String grade;
    
    @Column(name = "experience_points")
    private Long experiencePoints = 0L;
    
    @Column(name = "total_consultations")
    private Integer totalConsultations = 0;
    
    @Column(name = "last_grade_update")
    private LocalDateTime lastGradeUpdate;
    
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
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
    
    @Column(name = "profile_image_url", columnDefinition = "TEXT")
    private String profileImageUrl;
    
    @Column(name = "memo", columnDefinition = "TEXT")
    private String memo;
    
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
     * 소속 지점
     */
    @jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @jakarta.persistence.JoinColumn(name = "branch_id")
    private Branch branch;
    
    /**
     * 지점 코드 (등록 시 사용, 실제 지점 정보는 branch 필드에 저장)
     */
    @Column(name = "branch_code", length = 20)
    private String branchCode;
    
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
    }
    
    /**
     * 사용자 활성화/비활성화
     */
    public void setActive(Boolean active) {
        this.isActive = active;
    }
    
    // Getter & Setter
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
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
                ", isEmailVerified=" + isEmailVerified +
                '}';
    }
}

package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 사용자 관리 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface UserRepository extends BaseRepository<User, Long> {
    
    /**
     * 테넌트별 사용자명으로 사용자 조회 (테넌트 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.username = :username AND u.isDeleted = false")
    Optional<User> findByTenantIdAndUsername(@Param("tenantId") String tenantId, @Param("username") String username);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.username = ?1 AND u.isDeleted = false")
    Optional<User> findByUsername(String username);
    
    /**
     * 테넌트별 사용자명과 활성 상태로 사용자 조회 (테넌트 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.username = :username AND u.isActive = :isActive AND u.isDeleted = false")
    Optional<User> findByTenantIdAndUsernameAndIsActive(@Param("tenantId") String tenantId, @Param("username") String username, @Param("isActive") Boolean isActive);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.username = ?1 AND u.isActive = ?2 AND u.isDeleted = false")
    Optional<User> findByUsernameAndIsActive(String username, Boolean isActive);
    
    /**
     * 테넌트별 사용자명으로 사용자 존재 여부 확인 (테넌트 필터링)
     */
    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.tenantId = :tenantId AND u.username = :username AND u.isDeleted = false")
    boolean existsByTenantIdAndUsername(@Param("tenantId") String tenantId, @Param("username") String username);
    
    boolean existsByTenantIdAndEmail(@Param("tenantId") String tenantId, @Param("email") String email);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 사용자명 중복 검사!
     */
    @Deprecated
    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.username = ?1 AND u.isDeleted = false")
    boolean existsByUsername(String username);
    
    /**
     * 테넌트별 만료된 사용자 데이터 조회 (테넌트 필터링)
     */
    @Query("SELECT u.id, u.name FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = true AND u.updatedAt < :cutoffDate")
    List<Object[]> findExpiredUsersForDestructionByTenantId(@Param("tenantId") String tenantId, @Param("cutoffDate") LocalDateTime cutoffDate);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 만료된 사용자 데이터 노출!
     */
    @Deprecated
    @Query("SELECT u.id, u.name FROM User u WHERE u.isDeleted = true AND u.updatedAt < ?1")
    List<Object[]> findExpiredUsersForDestruction(LocalDateTime cutoffDate);
    
    /**
     * 테넌트별 이메일로 사용자 조회 (테넌트 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.email = :email AND u.isDeleted = false")
    Optional<User> findByTenantIdAndEmail(@Param("tenantId") String tenantId, @Param("email") String email);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 이메일 정보 노출!
     * 주의: 멀티 테넌트 사용자의 경우 첫 번째 결과만 반환
     * 모든 테넌트의 사용자를 조회하려면 findAllByEmail 사용
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.email = ?1 AND u.isDeleted = false")
    Optional<User> findByEmail(String email);
    
    /**
     * 이메일로 모든 테넌트의 사용자 조회 (멀티 테넌트 사용자 확인용)
     * 한 계정에 멀티 테넌트 구조 지원
     */
    @Query("SELECT u FROM User u WHERE u.email = ?1 AND u.isDeleted = false")
    List<User> findAllByEmail(String email);
    
    /**
     * 이메일과 테넌트 ID로 사용자 조회
     * 특정 테넌트의 사용자만 조회
     */
    @Query("SELECT u FROM User u WHERE u.email = ?1 AND u.tenantId = ?2 AND u.isDeleted = false")
    Optional<User> findByEmailAndTenantId(String email, String tenantId);
    
    /**
     * 이메일로 사용자 존재 여부 확인 (활성 상태만)
     */
    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.email = ?1 AND u.isDeleted = false")
    boolean existsByEmail(String email);
    
    /**
     * 이메일로 사용자 존재 여부 확인 (전체)
     */
    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.email = ?1")
    boolean existsByEmailAll(String email);
    
    /**
     * 닉네임으로 사용자 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.nickname = ?1 AND u.isDeleted = false")
    Optional<User> findByNickname(String nickname);
    
    /**
     * 닉네임으로 사용자 존재 여부 확인 (활성 상태만)
     */
    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.nickname = ?1 AND u.isDeleted = false")
    boolean existsByNickname(String nickname);
    
    /**
     * 전화번호로 사용자 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.phone = ?1 AND u.isDeleted = false")
    Optional<User> findByPhone(String phone);
    
    /**
     * 전화번호로 사용자 존재 여부 확인 (활성 상태만)
     */
    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.phone = ?1 AND u.isDeleted = false")
    boolean existsByPhone(String phone);
    
    /**
     * 테넌트별 모든 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = false")
    List<User> findByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 역할별 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.role = :role AND u.isDeleted = false")
    List<User> findByRole(@Param("tenantId") String tenantId, @Param("role") UserRole role);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.role = ?1 AND u.isDeleted = false")
    List<User> findByRoleDeprecated(UserRole role);
    
    /**
     * 역할별 활성 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.role = :role AND u.isActive = true AND u.isDeleted = false")
    List<User> findByRoleAndIsActiveTrue(@Param("tenantId") String tenantId, @Param("role") UserRole role);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.role = ?1 AND u.isActive = true AND u.isDeleted = false")
    List<User> findByRoleAndIsActiveTrueDeprecated(UserRole role);
    
    /**
     * 역할별 사용자 페이징 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.role = :role AND u.isDeleted = false")
    Page<User> findByRole(@Param("tenantId") String tenantId, @Param("role") UserRole role, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.role = ?1 AND u.isDeleted = false")
    Page<User> findByRoleDeprecated(UserRole role, Pageable pageable);
    
    /**
     * 역할별 사용자 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.role = :role AND u.isDeleted = false")
    long countByRole(@Param("tenantId") String tenantId, @Param("role") UserRole role);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = ?1 AND u.isDeleted = false")
    long countByRoleDeprecated(UserRole role);
    
    /**
     * 등급별 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.grade = :grade AND u.isDeleted = false")
    List<User> findByGrade(@Param("tenantId") String tenantId, @Param("grade") String grade);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.grade = ?1 AND u.isDeleted = false")
    List<User> findByGradeDeprecated(String grade);
    
    /**
     * 사용자 ID로 프로필 사진 정보 조인 조회 (tenantId 필터링)
     */
    @Query("SELECT u.id, u.name, u.email, u.role, u.profileImageUrl, " +
           "usa.provider, usa.providerProfileImage " +
           "FROM User u " +
           "LEFT JOIN u.userSocialAccounts usa " +
           "WHERE u.tenantId = :tenantId AND u.id = :userId AND u.isDeleted = false AND (usa IS NULL OR usa.isDeleted = false)")
    List<Object[]> findProfileImageInfoByUserId(@Param("tenantId") String tenantId, @Param("userId") Long userId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u.id, u.name, u.email, u.role, u.profileImageUrl, " +
           "usa.provider, usa.providerProfileImage " +
           "FROM User u " +
           "LEFT JOIN u.userSocialAccounts usa " +
           "WHERE u.id = ?1 AND u.isDeleted = false AND (usa IS NULL OR usa.isDeleted = false)")
    List<Object[]> findProfileImageInfoByUserIdDeprecated(Long userId);

    /**
     * 마이페이지 정보 조회 (tenantId 필터링)
     */
    @Query("SELECT u.id, u.username, u.email, u.name, u.nickname, u.phone, u.gender, " +
           "u.profileImageUrl, u.role, u.grade, u.experiencePoints, u.totalConsultations, " +
           "u.lastLoginAt, u.isActive, u.isEmailVerified, u.createdAt, u.updatedAt, " +
           "usa.provider, usa.providerProfileImage, usa.providerUsername " +
           "FROM User u " +
           "LEFT JOIN u.userSocialAccounts usa " +
           "WHERE u.tenantId = :tenantId AND u.id = :userId AND u.isDeleted = false AND (usa IS NULL OR usa.isDeleted = false)")
    List<Object[]> findMyPageInfoByUserId(@Param("tenantId") String tenantId, @Param("userId") Long userId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u.id, u.username, u.email, u.name, u.nickname, u.phone, u.gender, " +
           "u.profileImageUrl, u.role, u.grade, u.experiencePoints, u.totalConsultations, " +
           "u.lastLoginAt, u.isActive, u.isEmailVerified, u.createdAt, u.updatedAt, " +
           "usa.provider, usa.providerProfileImage, usa.providerUsername " +
           "FROM User u " +
           "LEFT JOIN u.userSocialAccounts usa " +
           "WHERE u.id = ?1 AND u.isDeleted = false AND (usa IS NULL OR usa.isDeleted = false)")
    List<Object[]> findMyPageInfoByUserIdDeprecated(Long userId);
    
    /**
     * 등급별 사용자 페이징 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.grade = :grade AND u.isDeleted = false")
    Page<User> findByGrade(@Param("tenantId") String tenantId, @Param("grade") String grade, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.grade = ?1 AND u.isDeleted = false")
    Page<User> findByGradeDeprecated(String grade, Pageable pageable);
    
    /**
     * 등급별 사용자 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.grade = :grade AND u.isDeleted = false")
    long countByGrade(@Param("tenantId") String tenantId, @Param("grade") String grade);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT COUNT(u) FROM User u WHERE u.grade = ?1 AND u.isDeleted = false")
    long countByGradeDeprecated(String grade);
    
    /**
     * 상태별 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.isActive = :isActive AND u.isDeleted = false")
    List<User> findByIsActive(@Param("tenantId") String tenantId, @Param("isActive") Boolean isActive);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.isActive = ?1 AND u.isDeleted = false")
    List<User> findByIsActiveDeprecated(Boolean isActive);
    
    /**
     * 상태별 사용자 페이징 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.isActive = :isActive AND u.isDeleted = false")
    Page<User> findByIsActive(@Param("tenantId") String tenantId, @Param("isActive") Boolean isActive, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.isActive = ?1 AND u.isDeleted = false")
    Page<User> findByIsActiveDeprecated(Boolean isActive, Pageable pageable);
    
    /**
     * 상태별 사용자 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.isActive = :isActive AND u.isDeleted = false")
    long countByIsActive(@Param("tenantId") String tenantId, @Param("isActive") Boolean isActive);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = ?1 AND u.isDeleted = false")
    long countByIsActiveDeprecated(Boolean isActive);
    
    /**
     * 역할별 사용자 조회 (활성 상태 옵션) (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.role = :role AND (:isActive IS NULL OR u.isActive = :isActive) AND u.isDeleted = false")
    List<User> findByRoleAndIsActive(@Param("tenantId") String tenantId, @Param("role") UserRole role, @Param("isActive") Boolean isActive);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.role = ?1 AND (?2 IS NULL OR u.isActive = ?2) AND u.isDeleted = false")
    List<User> findByRoleAndIsActiveDeprecated(UserRole role, Boolean isActive);
    
    /**
     * 역할 + 지점별 사용자 조회 (tenantId 필터링)
     */
    /**
     * 역할과 활성 상태로 사용자 조회 (테넌트 필터링)
     * 
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #findByTenantIdAndRoleAndIsActive(String, UserRole, Boolean)}를 사용하세요.
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.role = :role AND u.branchCode = :branchCode AND (:isActive IS NULL OR u.isActive = :isActive) AND u.isDeleted = false")
    List<User> findByRoleAndBranchCodeAndIsActive(@Param("tenantId") String tenantId, @Param("role") UserRole role, @Param("branchCode") String branchCode, @Param("isActive") Boolean isActive);
    
    /**
     * 역할과 활성 상태로 사용자 조회 (테넌트 필터링, 브랜치 개념 제거)
     * 
     * @param tenantId 테넌트 UUID
     * @param role 사용자 역할
     * @param isActive 활성 상태 (null이면 전체)
     * @return 사용자 목록
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.role = :role AND (:isActive IS NULL OR u.isActive = :isActive) AND u.isDeleted = false")
    List<User> findByTenantIdAndRoleAndIsActive(@Param("tenantId") String tenantId, @Param("role") UserRole role, @Param("isActive") Boolean isActive);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.role = ?1 AND u.branchCode = ?2 AND (?3 IS NULL OR u.isActive = ?3) AND u.isDeleted = false")
    List<User> findByRoleAndBranchCodeAndIsActiveDeprecated(UserRole role, String branchCode, Boolean isActive);
    

    
    /**
     * 이메일 인증 상태별 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.isEmailVerified = :isEmailVerified AND u.isDeleted = false")
    List<User> findByIsEmailVerified(@Param("tenantId") String tenantId, @Param("isEmailVerified") Boolean isEmailVerified);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.isEmailVerified = ?1 AND u.isDeleted = false")
    List<User> findByIsEmailVerifiedDeprecated(Boolean isEmailVerified);
    
    /**
     * 이메일 인증 상태별 사용자 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.isEmailVerified = :isEmailVerified AND u.isDeleted = false")
    long countByIsEmailVerified(@Param("tenantId") String tenantId, @Param("isEmailVerified") Boolean isEmailVerified);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT COUNT(u) FROM User u WHERE u.isEmailVerified = ?1 AND u.isDeleted = false")
    long countByIsEmailVerifiedDeprecated(Boolean isEmailVerified);
    
    /**
     * 성별 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.gender = :gender AND u.isDeleted = false")
    List<User> findByGender(@Param("tenantId") String tenantId, @Param("gender") String gender);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.gender = ?1 AND u.isDeleted = false")
    List<User> findByGenderDeprecated(String gender);
    
    /**
     * 성별 사용자 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.gender = :gender AND u.isDeleted = false")
    long countByGender(@Param("tenantId") String tenantId, @Param("gender") String gender);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT COUNT(u) FROM User u WHERE u.gender = ?1 AND u.isDeleted = false")
    long countByGenderDeprecated(String gender);
    
    /**
     * 연령대별 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.ageGroup = :ageGroup AND u.isDeleted = false")
    List<User> findByAgeGroup(@Param("tenantId") String tenantId, @Param("ageGroup") String ageGroup);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.ageGroup = ?1 AND u.isDeleted = false")
    List<User> findByAgeGroupDeprecated(String ageGroup);
    
    /**
     * 연령대별 사용자 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.ageGroup = :ageGroup AND u.isDeleted = false")
    long countByAgeGroup(@Param("tenantId") String tenantId, @Param("ageGroup") String ageGroup);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT COUNT(u) FROM User u WHERE u.ageGroup = ?1 AND u.isDeleted = false")
    long countByAgeGroupDeprecated(String ageGroup);
    
    /**
     * 특정 기간에 가입한 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.createdAt BETWEEN :startDate AND :endDate AND u.isDeleted = false")
    List<User> findByCreatedAtBetween(@Param("tenantId") String tenantId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.createdAt BETWEEN ?1 AND ?2 AND u.isDeleted = false")
    List<User> findByCreatedAtBetweenDeprecated(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 기간에 가입한 사용자 페이징 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.createdAt BETWEEN :startDate AND :endDate AND u.isDeleted = false")
    Page<User> findByCreatedAtBetween(@Param("tenantId") String tenantId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.createdAt BETWEEN ?1 AND ?2 AND u.isDeleted = false")
    Page<User> findByCreatedAtBetweenDeprecated(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    
    /**
     * 특정 기간에 로그인한 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.lastLoginAt BETWEEN :startDate AND :endDate AND u.isDeleted = false")
    List<User> findByLastLoginAtBetween(@Param("tenantId") String tenantId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.lastLoginAt BETWEEN ?1 AND ?2 AND u.isDeleted = false")
    List<User> findByLastLoginAtBetweenDeprecated(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 최근 로그인한 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = false ORDER BY u.lastLoginAt DESC")
    List<User> findRecentLoginUsers(@Param("tenantId") String tenantId, org.springframework.data.domain.Pageable pageable);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.isDeleted = false ORDER BY u.lastLoginAt DESC")
    List<User> findRecentLoginUsersDeprecated(int limit);
    
    /**
     * 오랫동안 로그인하지 않은 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.lastLoginAt < :cutoffDate AND u.isDeleted = false")
    List<User> findInactiveUsers(@Param("tenantId") String tenantId, @Param("cutoffDate") LocalDateTime cutoffDate);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.lastLoginAt < ?1 AND u.isDeleted = false")
    List<User> findInactiveUsersDeprecated(LocalDateTime cutoffDate);
    
    /**
     * 경험치 기준 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.experiencePoints >= :minExperiencePoints AND u.isDeleted = false ORDER BY u.experiencePoints DESC")
    List<User> findByExperiencePointsGreaterThanEqual(@Param("tenantId") String tenantId, @Param("minExperiencePoints") Long minExperiencePoints);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.experiencePoints >= ?1 AND u.isDeleted = false ORDER BY u.experiencePoints DESC")
    List<User> findByExperiencePointsGreaterThanEqualDeprecated(Long minExperiencePoints);
    
    /**
     * 경험치 기준 사용자 페이징 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.experiencePoints >= :minExperiencePoints AND u.isDeleted = false ORDER BY u.experiencePoints DESC")
    Page<User> findByExperiencePointsGreaterThanEqual(@Param("tenantId") String tenantId, @Param("minExperiencePoints") Long minExperiencePoints, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.experiencePoints >= ?1 AND u.isDeleted = false ORDER BY u.experiencePoints DESC")
    Page<User> findByExperiencePointsGreaterThanEqualDeprecated(Long minExperiencePoints, Pageable pageable);
    
    /**
     * 상담 횟수 기준 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.totalConsultations >= :minConsultations AND u.isDeleted = false ORDER BY u.totalConsultations DESC")
    List<User> findByTotalConsultationsGreaterThanEqual(@Param("tenantId") String tenantId, @Param("minConsultations") Integer minConsultations);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.totalConsultations >= ?1 AND u.isDeleted = false ORDER BY u.totalConsultations DESC")
    List<User> findByTotalConsultationsGreaterThanEqualDeprecated(Integer minConsultations);
    
    /**
     * 상담 횟수 기준 사용자 페이징 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.totalConsultations >= :minConsultations AND u.isDeleted = false ORDER BY u.totalConsultations DESC")
    Page<User> findByTotalConsultationsGreaterThanEqual(@Param("tenantId") String tenantId, @Param("minConsultations") Integer minConsultations, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.totalConsultations >= ?1 AND u.isDeleted = false ORDER BY u.totalConsultations DESC")
    Page<User> findByTotalConsultationsGreaterThanEqualDeprecated(Integer minConsultations, Pageable pageable);
    
    /**
     * 이름으로 사용자 검색 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.name LIKE %:name% AND u.isDeleted = false")
    List<User> findByNameContaining(@Param("tenantId") String tenantId, @Param("name") String name);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.name LIKE %?1% AND u.isDeleted = false")
    List<User> findByNameContainingDeprecated(String name);
    
    /**
     * 이름으로 사용자 검색 페이징 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.name LIKE %:name% AND u.isDeleted = false")
    Page<User> findByNameContaining(@Param("tenantId") String tenantId, @Param("name") String name, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.name LIKE %?1% AND u.isDeleted = false")
    Page<User> findByNameContainingDeprecated(String name, Pageable pageable);
    
    /**
     * 닉네임으로 사용자 검색 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.nickname LIKE %:nickname% AND u.isDeleted = false")
    List<User> findByNicknameContaining(@Param("tenantId") String tenantId, @Param("nickname") String nickname);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.nickname LIKE %?1% AND u.isDeleted = false")
    List<User> findByNicknameContainingDeprecated(String nickname);
    
    /**
     * 닉네임으로 사용자 검색 페이징 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.nickname LIKE %:nickname% AND u.isDeleted = false")
    Page<User> findByNicknameContaining(@Param("tenantId") String tenantId, @Param("nickname") String nickname, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.nickname LIKE %?1% AND u.isDeleted = false")
    Page<User> findByNicknameContainingDeprecated(String nickname, Pageable pageable);
    
    /**
     * 이메일로 사용자 검색 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.email LIKE %:email% AND u.isDeleted = false")
    List<User> findByEmailContaining(@Param("tenantId") String tenantId, @Param("email") String email);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.email LIKE %?1% AND u.isDeleted = false")
    List<User> findByEmailContainingDeprecated(String email);
    
    /**
     * 이메일로 사용자 검색 페이징 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.email LIKE %:email% AND u.isDeleted = false")
    Page<User> findByEmailContaining(@Param("tenantId") String tenantId, @Param("email") String email, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.email LIKE %?1% AND u.isDeleted = false")
    Page<User> findByEmailContainingDeprecated(String email, Pageable pageable);
    
    /**
     * 전화번호로 사용자 검색 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.phone LIKE %:phone% AND u.isDeleted = false")
    List<User> findByPhoneContaining(@Param("tenantId") String tenantId, @Param("phone") String phone);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.phone LIKE %?1% AND u.isDeleted = false")
    List<User> findByPhoneContainingDeprecated(String phone);
    
    /**
     * 전화번호로 사용자 검색 페이징 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.phone LIKE %:phone% AND u.isDeleted = false")
    Page<User> findByPhoneContaining(@Param("tenantId") String tenantId, @Param("phone") String phone, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.phone LIKE %?1% AND u.isDeleted = false")
    Page<User> findByPhoneContainingDeprecated(String phone, Pageable pageable);
    
    /**
     * 복합 조건으로 사용자 검색 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND " +
           "(:name IS NULL OR u.name LIKE %:name%) AND " +
           "(:email IS NULL OR u.email LIKE %:email%) AND " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:grade IS NULL OR u.grade = :grade) AND " +
           "(:isActive IS NULL OR u.isActive = :isActive) AND " +
           "(:gender IS NULL OR u.gender = :gender) AND " +
           "(:ageGroup IS NULL OR u.ageGroup = :ageGroup) AND " +
           "u.isDeleted = false")
    Page<User> findByComplexCriteria(@Param("tenantId") String tenantId,
                                   @Param("name") String name,
                                   @Param("email") String email,
                                   @Param("role") UserRole role,
                                   @Param("grade") String grade,
                                   @Param("isActive") Boolean isActive,
                                   @Param("gender") String gender,
                                   @Param("ageGroup") String ageGroup,
                                   Pageable pageable);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE " +
           "(:name IS NULL OR u.name LIKE %:name%) AND " +
           "(:email IS NULL OR u.email LIKE %:email%) AND " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:grade IS NULL OR u.grade = :grade) AND " +
           "(:isActive IS NULL OR u.isActive = :isActive) AND " +
           "(:gender IS NULL OR u.gender = :gender) AND " +
           "(:ageGroup IS NULL OR u.ageGroup = :ageGroup) AND " +
           "u.isDeleted = false")
    Page<User> findByComplexCriteriaDeprecated(@Param("name") String name,
                                   @Param("email") String email,
                                   @Param("role") UserRole role,
                                   @Param("grade") String grade,
                                   @Param("isActive") Boolean isActive,
                                   @Param("gender") String gender,
                                   @Param("ageGroup") String ageGroup,
                                   Pageable pageable);
    
    /**
     * 사용자 통계 정보 조회 (tenantId 필터링)
     */
    @Query("SELECT " +
           "COUNT(u) as totalUsers, " +
           "COUNT(CASE WHEN u.role = 'CLIENT' THEN 1 END) as clientCount, " +
           "COUNT(CASE WHEN u.role = 'CONSULTANT' THEN 1 END) as consultantCount, " +
           "COUNT(CASE WHEN u.role = 'ADMIN' THEN 1 END) as adminCount, " +
           "COUNT(CASE WHEN u.isActive = true THEN 1 END) as activeCount, " +
           "COUNT(CASE WHEN u.isEmailVerified = true THEN 1 END) as verifiedCount, " +
           "AVG(u.experiencePoints) as avgExperiencePoints, " +
           "AVG(u.totalConsultations) as avgConsultations " +
           "FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = false")
    Object[] getUserStatistics(@Param("tenantId") String tenantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT " +
           "COUNT(u) as totalUsers, " +
           "COUNT(CASE WHEN u.role = 'CLIENT' THEN 1 END) as clientCount, " +
           "COUNT(CASE WHEN u.role = 'CONSULTANT' THEN 1 END) as consultantCount, " +
           "COUNT(CASE WHEN u.role = 'ADMIN' THEN 1 END) as adminCount, " +
           "COUNT(CASE WHEN u.isActive = true THEN 1 END) as activeCount, " +
           "COUNT(CASE WHEN u.isEmailVerified = true THEN 1 END) as verifiedCount, " +
           "AVG(u.experiencePoints) as avgExperiencePoints, " +
           "AVG(u.totalConsultations) as avgConsultations " +
           "FROM User u WHERE u.isDeleted = false")
    Object[] getUserStatisticsDeprecated();
    
    /**
     * 테넌트별 사용자 통계 정보 조회 (브랜치 개념 제거)
     * 
     * @param tenantId 테넌트 UUID
     * @return 사용자 통계 정보 배열
     */
    @Query("SELECT " +
           "COUNT(u) as totalUsers, " +
           "COUNT(CASE WHEN u.role = 'CLIENT' THEN 1 END) as clientCount, " +
           "COUNT(CASE WHEN u.role = 'CONSULTANT' THEN 1 END) as consultantCount, " +
           "COUNT(CASE WHEN u.role = 'ADMIN' THEN 1 END) as adminCount, " +
           "COUNT(CASE WHEN u.isActive = true THEN 1 END) as activeCount, " +
           "COUNT(CASE WHEN u.isEmailVerified = true THEN 1 END) as verifiedCount, " +
           "AVG(u.experiencePoints) as avgExperiencePoints, " +
           "AVG(u.totalConsultations) as avgConsultations " +
           "FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = false")
    Object[] getUserStatisticsByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 지점코드별 사용자 통계 정보 조회 (tenantId 필터링)
     * 
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #getUserStatisticsByTenantId(String)}를 사용하세요.
     */
    @Deprecated
    @Query("SELECT " +
           "COUNT(u) as totalUsers, " +
           "COUNT(CASE WHEN u.role = 'CLIENT' THEN 1 END) as clientCount, " +
           "COUNT(CASE WHEN u.role = 'CONSULTANT' THEN 1 END) as consultantCount, " +
           "COUNT(CASE WHEN u.role = 'ADMIN' THEN 1 END) as adminCount, " +
           "COUNT(CASE WHEN u.isActive = true THEN 1 END) as activeCount, " +
           "COUNT(CASE WHEN u.isEmailVerified = true THEN 1 END) as verifiedCount, " +
           "AVG(u.experiencePoints) as avgExperiencePoints, " +
           "AVG(u.totalConsultations) as avgConsultations " +
           "FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = false AND u.branchCode = :branchCode")
    Object[] getUserStatisticsByBranchCode(@Param("tenantId") String tenantId, @Param("branchCode") String branchCode);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT " +
           "COUNT(u) as totalUsers, " +
           "COUNT(CASE WHEN u.role = 'CLIENT' THEN 1 END) as clientCount, " +
           "COUNT(CASE WHEN u.role = 'CONSULTANT' THEN 1 END) as consultantCount, " +
           "COUNT(CASE WHEN u.role = 'ADMIN' THEN 1 END) as adminCount, " +
           "COUNT(CASE WHEN u.isActive = true THEN 1 END) as activeCount, " +
           "COUNT(CASE WHEN u.isEmailVerified = true THEN 1 END) as verifiedCount, " +
           "AVG(u.experiencePoints) as avgExperiencePoints, " +
           "AVG(u.totalConsultations) as avgConsultations " +
           "FROM User u WHERE u.isDeleted = false AND u.branchCode = :branchCode")
    Object[] getUserStatisticsByBranchCodeDeprecated(@Param("branchCode") String branchCode);
    
    /**
     * 역할별 사용자 통계 조회 (tenantId 필터링)
     */
    @Query("SELECT u.role, COUNT(u) as count, AVG(u.experiencePoints) as avgExperience " +
           "FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = false GROUP BY u.role")
    List<Object[]> getUserStatisticsByRole(@Param("tenantId") String tenantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u.role, COUNT(u) as count, AVG(u.experiencePoints) as avgExperience " +
           "FROM User u WHERE u.isDeleted = false GROUP BY u.role")
    List<Object[]> getUserStatisticsByRoleDeprecated();
    
    /**
     * 등급별 사용자 통계 조회 (tenantId 필터링)
     */
    @Query("SELECT u.grade, COUNT(u) as count, AVG(u.experiencePoints) as avgExperience " +
           "FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = false GROUP BY u.grade")
    List<Object[]> getUserStatisticsByGrade(@Param("tenantId") String tenantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u.grade, COUNT(u) as count, AVG(u.experiencePoints) as avgExperience " +
           "FROM User u WHERE u.isDeleted = false GROUP BY u.grade")
    List<Object[]> getUserStatisticsByGradeDeprecated();
    
    /**
     * 성별 사용자 통계 조회 (tenantId 필터링)
     */
    @Query("SELECT u.gender, COUNT(u) as count FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = false GROUP BY u.gender")
    List<Object[]> getUserStatisticsByGender(@Param("tenantId") String tenantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u.gender, COUNT(u) as count FROM User u WHERE u.isDeleted = false GROUP BY u.gender")
    List<Object[]> getUserStatisticsByGenderDeprecated();
    
    /**
     * 연령대별 사용자 통계 조회 (tenantId 필터링)
     */
    @Query("SELECT u.ageGroup, COUNT(u) as count FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = false GROUP BY u.ageGroup")
    List<Object[]> getUserStatisticsByAgeGroup(@Param("tenantId") String tenantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u.ageGroup, COUNT(u) as count FROM User u WHERE u.isDeleted = false GROUP BY u.ageGroup")
    List<Object[]> getUserStatisticsByAgeGroupDeprecated();
    
    // === Branch 관련 메서드 ===
    
    /**
     * 지점과 역할로 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.branch = :branch AND u.role = :role AND u.isDeleted = false ORDER BY u.username")
    List<User> findByBranchAndRoleAndIsDeletedFalseOrderByUsername(@Param("tenantId") String tenantId, @Param("branch") com.coresolution.consultation.entity.Branch branch, @Param("role") UserRole role);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.branch = ?1 AND u.role = ?2 AND u.isDeleted = false ORDER BY u.username")
    List<User> findByBranchAndRoleAndIsDeletedFalseOrderByUsernameDeprecated(com.coresolution.consultation.entity.Branch branch, UserRole role);
    
    /**
     * 지점으로 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.branch = :branch AND u.isDeleted = false ORDER BY u.username")
    List<User> findByBranchAndIsDeletedFalseOrderByUsername(@Param("tenantId") String tenantId, @Param("branch") com.coresolution.consultation.entity.Branch branch);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.branch = ?1 AND u.isDeleted = false ORDER BY u.username")
    List<User> findByBranchAndIsDeletedFalseOrderByUsernameDeprecated(com.coresolution.consultation.entity.Branch branch);
    
    /**
     * 테넌트별 사용자 수 조회 (브랜치 개념 제거)
     * 
     * @param tenantId 테넌트 UUID
     * @return 사용자 수
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = false")
    long countUsersByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 지점별 사용자 수 조회 (tenantId 필터링)
     * 
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #countUsersByTenantId(String)}를 사용하세요.
     */
    @Deprecated
    @Query("SELECT u.branch.id, u.branch.branchName, COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = false GROUP BY u.branch.id, u.branch.branchName ORDER BY u.branch.branchName")
    List<Object[]> countUsersByBranch(@Param("tenantId") String tenantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u.branch.id, u.branch.branchName, COUNT(u) FROM User u WHERE u.isDeleted = false GROUP BY u.branch.id, u.branch.branchName ORDER BY u.branch.branchName")
    List<Object[]> countUsersByBranchDeprecated();
    
    /**
     * 테넌트별 모든 사용자 조회 (브랜치 개념 제거)
     * 
     * @param tenantId 테넌트 UUID
     * @return 사용자 목록
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = false ORDER BY u.username")
    List<User> findAllUsersByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 지점이 없는 사용자들 조회 (tenantId 필터링)
     * 
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #findAllUsersByTenantId(String)}를 사용하세요.
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.branch IS NULL AND u.isDeleted = false ORDER BY u.username")
    List<User> findUsersWithoutBranch(@Param("tenantId") String tenantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.branch IS NULL AND u.isDeleted = false ORDER BY u.username")
    List<User> findUsersWithoutBranchDeprecated();
    
    /**
     * 테넌트별 역할별 사용자 수 조회 (브랜치 개념 제거)
     * 
     * @param tenantId 테넌트 UUID
     * @return 역할별 사용자 수 목록 [role, count]
     */
    @Query("SELECT u.role, COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = false GROUP BY u.role ORDER BY u.role")
    List<Object[]> countUsersByRole(@Param("tenantId") String tenantId);
    
    /**
     * 지점별 역할별 사용자 수 조회 (tenantId 필터링)
     * 
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #countUsersByRole(String)}를 사용하세요.
     */
    @Deprecated
    @Query("SELECT u.branch.id, u.branch.branchName, u.role, COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = false GROUP BY u.branch.id, u.branch.branchName, u.role ORDER BY u.branch.branchName, u.role")
    List<Object[]> countUsersByBranchAndRole(@Param("tenantId") String tenantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u.branch.id, u.branch.branchName, u.role, COUNT(u) FROM User u WHERE u.isDeleted = false GROUP BY u.branch.id, u.branch.branchName, u.role ORDER BY u.branch.branchName, u.role")
    List<Object[]> countUsersByBranchAndRoleDeprecated();
    
    /**
     * 지점 코드별 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.branchCode = :branchCode AND u.isDeleted = false ORDER BY u.username")
    List<User> findByBranchCode(@Param("tenantId") String tenantId, @Param("branchCode") String branchCode);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.branchCode = ?1 AND u.isDeleted = false ORDER BY u.username")
    List<User> findByBranchCodeDeprecated(String branchCode);
    
    /**
     * 지점 코드와 역할로 사용자 조회 (tenantId 필터링)
     * 
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #findByTenantIdAndRole(String, UserRole)}를 사용하세요.
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.branchCode = :branchCode AND u.role = :role AND u.isDeleted = false ORDER BY u.username")
    List<User> findByBranchCodeAndRoleAndIsDeletedFalseOrderByUsername(@Param("tenantId") String tenantId, @Param("branchCode") String branchCode, @Param("role") UserRole role);
    
    /**
     * 테넌트 ID와 역할로 사용자 조회 (브랜치 개념 제거)
     * 
     * @param tenantId 테넌트 UUID
     * @param role 사용자 역할
     * @return 사용자 목록
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.role = :role AND u.isDeleted = false ORDER BY u.username")
    List<User> findByTenantIdAndRole(@Param("tenantId") String tenantId, @Param("role") UserRole role);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.branchCode = ?1 AND u.role = ?2 AND u.isDeleted = false ORDER BY u.username")
    List<User> findByBranchCodeAndRoleAndIsDeletedFalseOrderByUsernameDeprecated(String branchCode, UserRole role);
    
    /**
     * 여러 역할로 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.role IN :roles AND u.isDeleted = false ORDER BY u.username")
    List<User> findByRoleIn(@Param("tenantId") String tenantId, @Param("roles") List<String> roles);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.role IN :roles AND u.isDeleted = false ORDER BY u.username")
    List<User> findByRoleInDeprecated(@Param("roles") List<String> roles);
    
    /**
     * 역할별 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.role = :role AND u.isDeleted = false ORDER BY u.username")
    List<User> findByRoleAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("role") String role);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.role = ?1 AND u.isDeleted = false ORDER BY u.username")
    List<User> findByRoleAndIsDeletedFalseDeprecated(String role);
    
    /**
     * 여러 역할로 사용자 조회 (tenantId 필터링)
     */
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.role IN :roles AND u.isDeleted = false ORDER BY u.username")
    List<User> findByRoleInAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("roles") List<String> roles);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.role IN :roles AND u.isDeleted = false ORDER BY u.username")
    List<User> findByRoleInAndIsDeletedFalseDeprecated(@Param("roles") List<String> roles);
    
    // === 통계용 메서드 ===
    
    /**
     * 활성 사용자 수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.isActive = true AND u.isDeleted = false")
    long countByIsActiveTrueAndIsDeletedFalse(@Param("tenantId") String tenantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = true AND u.isDeleted = false")
    long countByIsActiveTrueAndIsDeletedFalseDeprecated();
    
    /**
     * 역할별 사용자 수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.role = :role AND u.isDeleted = false")
    long countByRoleAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("role") UserRole role);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = ?1 AND u.isDeleted = false")
    long countByRoleAndIsDeletedFalseDeprecated(UserRole role);
    
    /**
     * 역할별 활성 사용자 수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.role = :role AND u.isActive = true AND u.isDeleted = false")
    long countByRoleAndIsActiveTrueAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("role") UserRole role);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = ?1 AND u.isActive = true AND u.isDeleted = false")
    long countByRoleAndIsActiveTrueAndIsDeletedFalseDeprecated(UserRole role);
    
    /**
     * 지점별 사용자 수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.branch.id = :branchId AND u.isDeleted = false")
    long countByBranchIdAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT COUNT(u) FROM User u WHERE u.branch.id = ?1 AND u.isDeleted = false")
    long countByBranchIdAndIsDeletedFalseDeprecated(Long branchId);
    
    /**
     * 지점별 활성 사용자 수 조회 (tenantId 필터링)
     */
    /**
     * 지점 ID별 활성 사용자 수 조회 (테넌트 필터링)
     * 
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 테넌트별 활성 사용자 수를 조회하는 메서드를 사용하세요.
     */
    @Deprecated
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.branch.id = :branchId AND u.isActive = true AND u.isDeleted = false")
    long countByBranchIdAndIsActiveTrueAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT COUNT(u) FROM User u WHERE u.branch.id = ?1 AND u.isActive = true AND u.isDeleted = false")
    long countByBranchIdAndIsActiveTrueAndIsDeletedFalseDeprecated(Long branchId);
    
    /**
     * 지점별 역할별 사용자 수 조회 (tenantId 필터링)
     */
    /**
     * 지점 ID별 역할별 사용자 수 조회 (테넌트 필터링)
     * 
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 테넌트별 역할별 사용자 수를 조회하는 메서드를 사용하세요.
     */
    @Deprecated
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.branch.id = :branchId AND u.role = :role AND u.isDeleted = false")
    long countByBranchIdAndRoleAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("branchId") Long branchId, @Param("role") UserRole role);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT COUNT(u) FROM User u WHERE u.branch.id = ?1 AND u.role = ?2 AND u.isDeleted = false")
    long countByBranchIdAndRoleAndIsDeletedFalseDeprecated(Long branchId, UserRole role);
    
    // === 통계 대시보드용 메서드 ===
    
    /**
     * 역할별 사용자 수 조회 (tenantId 필터링) (문자열 역할명)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.role = :role AND u.isDeleted = false")
    long countByRole(@Param("tenantId") String tenantId, @Param("role") String role);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없이 사용자 정보 노출!
     */
    @Deprecated
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = ?1 AND u.isDeleted = false")
    long countByRoleDeprecated(String role);
    
    /**
     * 특정 날짜 이후 생성된 역할별 사용자 수 조회 (tenantId 포함)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.role = :role AND u.createdAt > :dateTime AND u.isDeleted = false")
    long countByTenantIdAndCreatedAtAfterAndRole(@Param("tenantId") String tenantId, @Param("dateTime") LocalDateTime dateTime, @Param("role") UserRole role);
    
    /**
     * 특정 날짜 이전 생성된 역할별 사용자 수 조회 (tenantId 포함)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.role = :role AND u.createdAt < :dateTime AND u.isDeleted = false")
    long countByTenantIdAndCreatedAtBeforeAndRole(@Param("tenantId") String tenantId, @Param("dateTime") LocalDateTime dateTime, @Param("role") UserRole role);
    
    /**
     * 특정 기간에 생성된 역할별 사용자 수 조회 (tenantId 포함)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.role = :role AND u.createdAt BETWEEN :startDate AND :endDate AND u.isDeleted = false")
    long countByTenantIdAndCreatedAtBetweenAndRole(@Param("tenantId") String tenantId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate, @Param("role") UserRole role);
    
    /**
     * 특정 날짜 이후 생성된 역할별 사용자 수 조회
     * @deprecated tenantId 필터링이 없습니다. countByTenantIdAndCreatedAtAfterAndRole 사용하세요.
     */
    @Deprecated
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = ?1 AND u.createdAt > ?2 AND u.isDeleted = false")
    long countByRoleAndCreatedAtAfter(UserRole role, LocalDateTime dateTime);
    
    /**
     * 특정 날짜 이전 생성된 역할별 사용자 수 조회
     * @deprecated tenantId 필터링이 없습니다. countByTenantIdAndCreatedAtBeforeAndRole 사용하세요.
     */
    @Deprecated
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = ?1 AND u.createdAt < ?2 AND u.isDeleted = false")
    long countByRoleAndCreatedAtBefore(UserRole role, LocalDateTime dateTime);
    
    /**
     * 특정 기간에 생성된 역할별 사용자 수 조회
     * @deprecated tenantId 필터링이 없습니다. countByTenantIdAndCreatedAtBetweenAndRole 사용하세요.
     */
    @Deprecated
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = ?1 AND u.createdAt BETWEEN ?2 AND ?3 AND u.isDeleted = false")
    long countByRoleAndCreatedAtBetween(UserRole role, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 최근 내담자 조회 (이름, 생성일시)
     */
    @Query("SELECT u.name, u.createdAt FROM User u WHERE u.role = 'CLIENT' AND u.isDeleted = false ORDER BY u.createdAt DESC")
    List<Object[]> findRecentClients(int limit);
    
    // === BaseRepository 메서드 오버라이드 ===
    // User 엔티티는 Branch와 @ManyToOne 관계이므로 branchId 필드가 없음
    // findAllByTenantIdAndBranchId 메서드를 오버라이드하여 User의 경우 branch.id를 사용하도록 함
    
    /**
     * 테넌트 ID와 지점 ID로 활성 사용자 조회
     * User 엔티티는 Branch와 @ManyToOne 관계이므로 branch.id를 사용
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (User의 경우 branch.id)
     * @return 활성 사용자 목록
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #findAllByTenantId(String)}를 사용하세요.
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.branch.id = :branchId AND u.isDeleted = false")
    List<User> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * 테넌트 ID와 지점 ID로 활성 사용자 조회 (페이징)
     * User 엔티티는 Branch와 @ManyToOne 관계이므로 branch.id를 사용
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (User의 경우 branch.id)
     * @param pageable 페이징 정보
     * @return 활성 사용자 페이지
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #findAllByTenantId(String, Pageable)}를 사용하세요.
     */
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.branch.id = :branchId AND u.isDeleted = false")
    Page<User> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId, Pageable pageable);
}

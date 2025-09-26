package com.mindgarden.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.entity.User;
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
     * 사용자명으로 사용자 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.username = ?1 AND u.isDeleted = false")
    Optional<User> findByUsername(String username);
    
    /**
     * 사용자명과 활성 상태로 사용자 조회 (삭제되지 않은 상태)
     */
    @Query("SELECT u FROM User u WHERE u.username = ?1 AND u.isActive = ?2 AND u.isDeleted = false")
    Optional<User> findByUsernameAndIsActive(String username, Boolean isActive);
    
    /**
     * 사용자명으로 사용자 존재 여부 확인 (활성 상태만)
     */
    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.username = ?1 AND u.isDeleted = false")
    boolean existsByUsername(String username);
    
    /**
     * 만료된 사용자 데이터 조회 (파기용)
     */
    @Query("SELECT u.id, u.name FROM User u WHERE u.isDeleted = true AND u.updatedAt < ?1")
    List<Object[]> findExpiredUsersForDestruction(LocalDateTime cutoffDate);
    
    /**
     * 이메일로 사용자 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.email = ?1 AND u.isDeleted = false")
    Optional<User> findByEmail(String email);
    
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
     * 역할별 사용자 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.role = ?1 AND u.isDeleted = false")
    List<User> findByRole(UserRole role);
    
    /**
     * 역할별 활성 사용자 조회
     */
    @Query("SELECT u FROM User u WHERE u.role = ?1 AND u.isActive = true AND u.isDeleted = false")
    List<User> findByRoleAndIsActiveTrue(UserRole role);
    
    /**
     * 역할별 활성 사용자 조회 (지점코드 포함)
     */
    @Query("SELECT u FROM User u WHERE u.role = ?1 AND u.isActive = true AND u.branchCode = ?2 AND u.isDeleted = false")
    List<User> findByRoleAndIsActiveTrueAndBranchCode(UserRole role, String branchCode);
    
    /**
     * 역할별 사용자 페이징 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.role = ?1 AND u.isDeleted = false")
    Page<User> findByRole(UserRole role, Pageable pageable);
    
    /**
     * 역할별 사용자 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = ?1 AND u.isDeleted = false")
    long countByRole(UserRole role);
    
    /**
     * 등급별 사용자 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.grade = ?1 AND u.isDeleted = false")
    List<User> findByGrade(String grade);
    
    /**
     * 사용자 ID로 프로필 사진 정보 조인 조회 (1. 사용자 프로필 2. SNS 이미지)
     */
    @Query("SELECT u.id, u.name, u.email, u.role, u.profileImageUrl, " +
           "usa.provider, usa.providerProfileImage " +
           "FROM User u " +
           "LEFT JOIN u.userSocialAccounts usa " +
           "WHERE u.id = ?1 AND u.isDeleted = false AND (usa IS NULL OR usa.isDeleted = false)")
    List<Object[]> findProfileImageInfoByUserId(Long userId);

    /**
     * 마이페이지 정보 조회 (사용자 + 소셜 계정 조인)
     */
    @Query("SELECT u.id, u.username, u.email, u.name, u.nickname, u.phone, u.gender, " +
           "u.profileImageUrl, u.role, u.grade, u.experiencePoints, u.totalConsultations, " +
           "u.lastLoginAt, u.isActive, u.isEmailVerified, u.createdAt, u.updatedAt, " +
           "usa.provider, usa.providerProfileImage, usa.providerUsername " +
           "FROM User u " +
           "LEFT JOIN u.userSocialAccounts usa " +
           "WHERE u.id = ?1 AND u.isDeleted = false AND (usa IS NULL OR usa.isDeleted = false)")
    List<Object[]> findMyPageInfoByUserId(Long userId);
    
    /**
     * 등급별 사용자 페이징 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.grade = ?1 AND u.isDeleted = false")
    Page<User> findByGrade(String grade, Pageable pageable);
    
    /**
     * 등급별 사용자 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.grade = ?1 AND u.isDeleted = false")
    long countByGrade(String grade);
    
    /**
     * 상태별 사용자 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.isActive = ?1 AND u.isDeleted = false")
    List<User> findByIsActive(Boolean isActive);
    
    /**
     * 상태별 사용자 페이징 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.isActive = ?1 AND u.isDeleted = false")
    Page<User> findByIsActive(Boolean isActive, Pageable pageable);
    
    /**
     * 상태별 사용자 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = ?1 AND u.isDeleted = false")
    long countByIsActive(Boolean isActive);
    
    /**
     * 역할별 사용자 조회 (활성 상태 옵션)
     */
    @Query("SELECT u FROM User u WHERE u.role = ?1 AND (?2 IS NULL OR u.isActive = ?2) AND u.isDeleted = false")
    List<User> findByRoleAndIsActive(UserRole role, Boolean isActive);
    
    /**
     * 지점별 사용자 조회 (활성 상태 옵션)
     */
    @Query("SELECT u FROM User u WHERE u.branchCode = ?1 AND (?2 IS NULL OR u.isActive = ?2) AND u.isDeleted = false")
    List<User> findByBranchCodeAndIsActive(String branchCode, Boolean isActive);
    
    /**
     * 역할 + 지점별 사용자 조회 (활성 상태 옵션)
     */
    @Query("SELECT u FROM User u WHERE u.role = ?1 AND u.branchCode = ?2 AND (?3 IS NULL OR u.isActive = ?3) AND u.isDeleted = false")
    List<User> findByRoleAndBranchCodeAndIsActive(UserRole role, String branchCode, Boolean isActive);
    

    
    /**
     * 이메일 인증 상태별 사용자 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.isEmailVerified = ?1 AND u.isDeleted = false")
    List<User> findByIsEmailVerified(Boolean isEmailVerified);
    
    /**
     * 이메일 인증 상태별 사용자 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.isEmailVerified = ?1 AND u.isDeleted = false")
    long countByIsEmailVerified(Boolean isEmailVerified);
    
    /**
     * 성별 사용자 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.gender = ?1 AND u.isDeleted = false")
    List<User> findByGender(String gender);
    
    /**
     * 성별 사용자 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.gender = ?1 AND u.isDeleted = false")
    long countByGender(String gender);
    
    /**
     * 연령대별 사용자 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.ageGroup = ?1 AND u.isDeleted = false")
    List<User> findByAgeGroup(String ageGroup);
    
    /**
     * 연령대별 사용자 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.ageGroup = ?1 AND u.isDeleted = false")
    long countByAgeGroup(String ageGroup);
    
    /**
     * 특정 기간에 가입한 사용자 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.createdAt BETWEEN ?1 AND ?2 AND u.isDeleted = false")
    List<User> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 기간에 가입한 사용자 페이징 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.createdAt BETWEEN ?1 AND ?2 AND u.isDeleted = false")
    Page<User> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    
    /**
     * 특정 기간에 로그인한 사용자 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.lastLoginAt BETWEEN ?1 AND ?2 AND u.isDeleted = false")
    List<User> findByLastLoginAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 최근 로그인한 사용자 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.isDeleted = false ORDER BY u.lastLoginAt DESC")
    List<User> findRecentLoginUsers(int limit);
    
    /**
     * 오랫동안 로그인하지 않은 사용자 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.lastLoginAt < ?1 AND u.isDeleted = false")
    List<User> findInactiveUsers(LocalDateTime cutoffDate);
    
    /**
     * 경험치 기준 사용자 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.experiencePoints >= ?1 AND u.isDeleted = false ORDER BY u.experiencePoints DESC")
    List<User> findByExperiencePointsGreaterThanEqual(Long minExperiencePoints);
    
    /**
     * 경험치 기준 사용자 페이징 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.experiencePoints >= ?1 AND u.isDeleted = false ORDER BY u.experiencePoints DESC")
    Page<User> findByExperiencePointsGreaterThanEqual(Long minExperiencePoints, Pageable pageable);
    
    /**
     * 상담 횟수 기준 사용자 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.totalConsultations >= ?1 AND u.isDeleted = false ORDER BY u.totalConsultations DESC")
    List<User> findByTotalConsultationsGreaterThanEqual(Integer minConsultations);
    
    /**
     * 상담 횟수 기준 사용자 페이징 조회 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE u.totalConsultations >= ?1 AND u.isDeleted = false ORDER BY u.totalConsultations DESC")
    Page<User> findByTotalConsultationsGreaterThanEqual(Integer minConsultations, Pageable pageable);
    
    /**
     * 이름으로 사용자 검색 (활성 상태만, 부분 일치)
     */
    @Query("SELECT u FROM User u WHERE u.name LIKE %?1% AND u.isDeleted = false")
    List<User> findByNameContaining(String name);
    
    /**
     * 이름으로 사용자 검색 페이징 (활성 상태만, 부분 일치)
     */
    @Query("SELECT u FROM User u WHERE u.name LIKE %?1% AND u.isDeleted = false")
    Page<User> findByNameContaining(String name, Pageable pageable);
    
    /**
     * 닉네임으로 사용자 검색 (활성 상태만, 부분 일치)
     */
    @Query("SELECT u FROM User u WHERE u.nickname LIKE %?1% AND u.isDeleted = false")
    List<User> findByNicknameContaining(String nickname);
    
    /**
     * 닉네임으로 사용자 검색 페이징 (활성 상태만, 부분 일치)
     */
    @Query("SELECT u FROM User u WHERE u.nickname LIKE %?1% AND u.isDeleted = false")
    Page<User> findByNicknameContaining(String nickname, Pageable pageable);
    
    /**
     * 이메일로 사용자 검색 (활성 상태만, 부분 일치)
     */
    @Query("SELECT u FROM User u WHERE u.email LIKE %?1% AND u.isDeleted = false")
    List<User> findByEmailContaining(String email);
    
    /**
     * 이메일로 사용자 검색 페이징 (활성 상태만, 부분 일치)
     */
    @Query("SELECT u FROM User u WHERE u.email LIKE %?1% AND u.isDeleted = false")
    Page<User> findByEmailContaining(String email, Pageable pageable);
    
    /**
     * 전화번호로 사용자 검색 (활성 상태만, 부분 일치)
     */
    @Query("SELECT u FROM User u WHERE u.phone LIKE %?1% AND u.isDeleted = false")
    List<User> findByPhoneContaining(String phone);
    
    /**
     * 전화번호로 사용자 검색 페이징 (활성 상태만, 부분 일치)
     */
    @Query("SELECT u FROM User u WHERE u.phone LIKE %?1% AND u.isDeleted = false")
    Page<User> findByPhoneContaining(String phone, Pageable pageable);
    
    /**
     * 복합 조건으로 사용자 검색 (활성 상태만)
     */
    @Query("SELECT u FROM User u WHERE " +
           "(:name IS NULL OR u.name LIKE %:name%) AND " +
           "(:email IS NULL OR u.email LIKE %:email%) AND " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:grade IS NULL OR u.grade = :grade) AND " +
           "(:isActive IS NULL OR u.isActive = :isActive) AND " +
           "(:gender IS NULL OR u.gender = :gender) AND " +
           "(:ageGroup IS NULL OR u.ageGroup = :ageGroup) AND " +
           "u.isDeleted = false")
    Page<User> findByComplexCriteria(@Param("name") String name,
                                   @Param("email") String email,
                                   @Param("role") UserRole role,
                                   @Param("grade") String grade,
                                   @Param("isActive") Boolean isActive,
                                   @Param("gender") String gender,
                                   @Param("ageGroup") String ageGroup,
                                   Pageable pageable);
    
    /**
     * 사용자 통계 정보 조회
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
           "FROM User u WHERE u.isDeleted = false")
    Object[] getUserStatistics();
    
    /**
     * 지점코드별 사용자 통계 정보 조회
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
           "FROM User u WHERE u.isDeleted = false AND u.branchCode = :branchCode")
    Object[] getUserStatisticsByBranchCode(@Param("branchCode") String branchCode);
    
    /**
     * 역할별 사용자 통계 조회
     */
    @Query("SELECT u.role, COUNT(u) as count, AVG(u.experiencePoints) as avgExperience " +
           "FROM User u WHERE u.isDeleted = false GROUP BY u.role")
    List<Object[]> getUserStatisticsByRole();
    
    /**
     * 등급별 사용자 통계 조회
     */
    @Query("SELECT u.grade, COUNT(u) as count, AVG(u.experiencePoints) as avgExperience " +
           "FROM User u WHERE u.isDeleted = false GROUP BY u.grade")
    List<Object[]> getUserStatisticsByGrade();
    
    /**
     * 성별 사용자 통계 조회
     */
    @Query("SELECT u.gender, COUNT(u) as count FROM User u WHERE u.isDeleted = false GROUP BY u.gender")
    List<Object[]> getUserStatisticsByGender();
    
    /**
     * 연령대별 사용자 통계 조회
     */
    @Query("SELECT u.ageGroup, COUNT(u) as count FROM User u WHERE u.isDeleted = false GROUP BY u.ageGroup")
    List<Object[]> getUserStatisticsByAgeGroup();
    
    // === Branch 관련 메서드 ===
    
    /**
     * 지점과 역할로 사용자 조회
     */
    @Query("SELECT u FROM User u WHERE u.branch = ?1 AND u.role = ?2 AND u.isDeleted = false ORDER BY u.username")
    List<User> findByBranchAndRoleAndIsDeletedFalseOrderByUsername(com.mindgarden.consultation.entity.Branch branch, String role);
    
    /**
     * 지점으로 사용자 조회
     */
    @Query("SELECT u FROM User u WHERE u.branch = ?1 AND u.isDeleted = false ORDER BY u.username")
    List<User> findByBranchAndIsDeletedFalseOrderByUsername(com.mindgarden.consultation.entity.Branch branch);
    
    /**
     * 지점별 사용자 수 조회
     */
    @Query("SELECT u.branch.id, u.branch.branchName, COUNT(u) FROM User u WHERE u.isDeleted = false GROUP BY u.branch.id, u.branch.branchName ORDER BY u.branch.branchName")
    List<Object[]> countUsersByBranch();
    
    /**
     * 지점이 없는 사용자들 조회
     */
    @Query("SELECT u FROM User u WHERE u.branch IS NULL AND u.isDeleted = false ORDER BY u.username")
    List<User> findUsersWithoutBranch();
    
    /**
     * 지점별 역할별 사용자 수 조회
     */
    @Query("SELECT u.branch.id, u.branch.branchName, u.role, COUNT(u) FROM User u WHERE u.isDeleted = false GROUP BY u.branch.id, u.branch.branchName, u.role ORDER BY u.branch.branchName, u.role")
    List<Object[]> countUsersByBranchAndRole();
    
    /**
     * 지점 코드별 사용자 조회 (활성 사용자만)
     */
    @Query("SELECT u FROM User u WHERE u.branchCode = ?1 AND u.isDeleted = false ORDER BY u.username")
    List<User> findByBranchCode(String branchCode);
    
    /**
     * 여러 역할로 사용자 조회
     */
    @Query("SELECT u FROM User u WHERE u.role IN :roles AND u.isDeleted = false ORDER BY u.username")
    List<User> findByRoleIn(@Param("roles") List<String> roles);
    
    /**
     * 역할별 사용자 조회 (삭제되지 않은 사용자만)
     */
    @Query("SELECT u FROM User u WHERE u.role = ?1 AND u.isDeleted = false ORDER BY u.username")
    List<User> findByRoleAndIsDeletedFalse(String role);
    
    /**
     * 여러 역할로 사용자 조회 (삭제되지 않은 사용자만)
     */
    @Query("SELECT u FROM User u WHERE u.role IN :roles AND u.isDeleted = false ORDER BY u.username")
    List<User> findByRoleInAndIsDeletedFalse(@Param("roles") List<String> roles);
    
    // === 통계용 메서드 ===
    
    /**
     * 활성 사용자 수 조회
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = true AND u.isDeleted = false")
    long countByIsActiveTrueAndIsDeletedFalse();
    
    /**
     * 역할별 사용자 수 조회
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = ?1 AND u.isDeleted = false")
    long countByRoleAndIsDeletedFalse(UserRole role);
    
    /**
     * 역할별 활성 사용자 수 조회
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = ?1 AND u.isActive = true AND u.isDeleted = false")
    long countByRoleAndIsActiveTrueAndIsDeletedFalse(UserRole role);
    
    /**
     * 지점별 사용자 수 조회
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.branch.id = ?1 AND u.isDeleted = false")
    long countByBranchIdAndIsDeletedFalse(Long branchId);
    
    /**
     * 지점별 활성 사용자 수 조회
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.branch.id = ?1 AND u.isActive = true AND u.isDeleted = false")
    long countByBranchIdAndIsActiveTrueAndIsDeletedFalse(Long branchId);
    
    /**
     * 지점별 역할별 사용자 수 조회
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.branch.id = ?1 AND u.role = ?2 AND u.isDeleted = false")
    long countByBranchIdAndRoleAndIsDeletedFalse(Long branchId, UserRole role);
}

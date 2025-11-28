package com.mindgarden.consultation.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 사용자 관리 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface UserService extends BaseService<User, Long> {
    
    // ==================== 기본 조회 메서드 ====================
    
    /**
     * 이메일로 사용자 조회
     */
    Optional<User> findByEmail(String email);
    
    /**
     * 전화번호로 사용자 조회
     */
    Optional<User> findByPhone(String phone);
    
    /**
     * 닉네임으로 사용자 조회
     */
    Optional<User> findByNickname(String nickname);
    
    /**
     * 역할별 사용자 조회
     */
    List<User> findByRole(String role);
    
    /**
     * 역할별 사용자 페이징 조회
     */
    Page<User> findByRole(String role, Pageable pageable);
    
    /**
     * 역할별 사용자 개수 조회
     */
    long countByRole(String role);
    
    /**
     * 등급별 사용자 조회
     */
    List<User> findByGrade(String grade);
    
    /**
     * 등급별 사용자 페이징 조회
     */
    Page<User> findByGrade(String grade, Pageable pageable);
    
    /**
     * 등급별 사용자 개수 조회
     */
    long countByGrade(String grade);
    
    /**
     * 활성 상태별 사용자 조회
     */
    List<User> findByIsActive(Boolean isActive);
    
    /**
     * 활성 상태별 사용자 페이징 조회
     */
    Page<User> findByIsActive(Boolean isActive, Pageable pageable);
    
    /**
     * 활성 상태별 사용자 개수 조회
     */
    long countByIsActive(Boolean isActive);
    
    /**
     * 성별 사용자 조회
     */
    List<User> findByGender(String gender);
    
    /**
     * 성별 사용자 개수 조회
     */
    long countByGender(String gender);
    
    /**
     * 연령대별 사용자 조회
     */
    List<User> findByAgeGroup(String ageGroup);
    
    /**
     * 연령대별 사용자 개수 조회
     */
    long countByAgeGroup(String ageGroup);
    
    // ==================== 기간별 조회 메서드 ====================
    
    /**
     * 특정 기간에 가입한 사용자 조회
     */
    List<User> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 기간에 가입한 사용자 페이징 조회
     */
    Page<User> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    
    /**
     * 특정 기간에 로그인한 사용자 조회
     */
    List<User> findByLastLoginAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    // ==================== 검색 메서드 ====================
    
    /**
     * 이름으로 사용자 검색
     */
    List<User> findByNameContaining(String name);
    
    /**
     * 이름으로 사용자 검색 페이징
     */
    Page<User> findByNameContaining(String name, Pageable pageable);
    
    /**
     * 닉네임으로 사용자 검색
     */
    List<User> findByNicknameContaining(String nickname);
    
    /**
     * 닉네임으로 사용자 검색 페이징
     */
    Page<User> findByNicknameContaining(String nickname, Pageable pageable);
    
    /**
     * 이메일로 사용자 검색
     */
    List<User> findByEmailContaining(String email);
    
    /**
     * 이메일로 사용자 검색 페이징
     */
    Page<User> findByEmailContaining(String email, Pageable pageable);
    
    /**
     * 전화번호로 사용자 검색
     */
    List<User> findByPhoneContaining(String phone);
    
    /**
     * 전화번호로 사용자 검색 페이징
     */
    Page<User> findByPhoneContaining(String phone, Pageable pageable);
    
    /**
     * 복합 조건으로 사용자 검색
     */
    Page<User> findByComplexCriteria(String name, String email, String role, String grade, 
                                   Boolean isActive, String gender, String ageGroup, Pageable pageable);
    
    // ==================== 통계 메서드 ====================
    
    /**
     * 사용자 통계 정보 조회
     */
    Object[] getUserStatistics();
    
    /**
     * 역할별 사용자 통계 조회
     */
    List<Object[]> getUserStatisticsByRole();
    
    /**
     * 등급별 사용자 통계 조회
     */
    List<Object[]> getUserStatisticsByGrade();
    
    /**
     * 성별 사용자 통계 조회
     */
    List<Object[]> getUserStatisticsByGender();
    
    /**
     * 연령대별 사용자 통계 조회
     */
    List<Object[]> getUserStatisticsByAgeGroup();
    
    // ==================== 비즈니스 메서드 ====================
    
    /**
     * 사용자 등록
     */
    User registerUser(User user);
    
    /**
     * 사용자 프로필 수정
     */
    User updateUserProfile(Long id, User updateData);
    
    /**
     * 사용자 비밀번호 변경
     */
    void changePassword(Long userId, String oldPassword, String newPassword);
    
    /**
     * 사용자 비밀번호 재설정
     */
    void resetPassword(String email);
    
    /**
     * 사용자 계정 활성화/비활성화
     */
    void setUserActive(Long id, boolean isActive);
    
    /**
     * 사용자 역할 변경
     */
    void changeUserRole(Long id, String newRole);
    
    /**
     * 사용자 등급 변경
     */
    void changeUserGrade(Long id, String newGrade);
    
    /**
     * 사용자 경험치 추가
     */
    void addExperiencePoints(Long id, Long points);
    
    /**
     * 사용자 상담 횟수 증가
     */
    void incrementConsultations(Long id);
    
    /**
     * 사용자 마지막 로그인 시간 업데이트
     */
    void updateLastLogin(Long id);
    
    /**
     * 사용자 이메일 인증
     */
    void verifyEmail(Long id);
    
    /**
     * 사용자 계정 삭제
     */
    void deleteUserAccount(Long id);
    
    /**
     * 사용자 계정 복구
     */
    void restoreUserAccount(Long id);
    
    // ==================== 중복 검사 메서드 ====================
    
    /**
     * 특정 필드 중복 검사 (ID 제외)
     */
    boolean isDuplicateExcludingId(Long excludeId, String fieldName, String fieldValue);
    
    // ==================== 특수 조회 메서드 ====================
    
    /**
     * 최근 로그인한 사용자 조회
     */
    List<User> findRecentLoginUsers(int limit);
    
    /**
     * 오랫동안 로그인하지 않은 사용자 조회
     */
    List<User> findInactiveUsers(LocalDateTime cutoffDate);
    
    /**
     * 경험치 기준 사용자 조회
     */
    List<User> findByExperiencePointsGreaterThanEqual(Long minPoints);
    
    /**
     * 경험치 기준 사용자 페이징 조회
     */
    Page<User> findByExperiencePointsGreaterThanEqual(Long minPoints, Pageable pageable);
    
    /**
     * 상담 횟수 기준 사용자 조회
     */
    List<User> findByTotalConsultationsGreaterThanEqual(Integer minCount);
    
    /**
     * 상담 횟수 기준 사용자 페이징 조회
     */
    Page<User> findByTotalConsultationsGreaterThanEqual(Integer minCount, Pageable pageable);
    
    // ==================== 인증/보안 메서드 ====================
    
    /**
     * 사용자 인증
     */
    boolean authenticateUser(String email, String password);
    
    /**
     * 비밀번호 변경
     */
    void changePassword(Long userId, String newPassword);
    
    /**
     * 마지막 로그인 시간 업데이트
     */
    void updateLastLoginTime(Long userId);
}

package com.coresolution.consultation.controller;

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.consultation.dto.ProfileImageInfo;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 사용자 관리 Controller
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/users") // 표준화 2025-12-05: 레거시 경로 제거
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class UserController extends BaseApiController {
    
    private final UserService userService;
    private final DynamicPermissionService dynamicPermissionService;
    
    // ==================== 기본 CRUD 메서드 ====================
    
    // ==================== 사용자별 조회 메서드 ====================
    
    /**
     * 이메일로 사용자 조회
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<ApiResponse<User>> getByEmail(@PathVariable String email) {
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        return success(user);
    }
    
    /**
     * 닉네임으로 사용자 조회
     */
    @GetMapping("/nickname/{nickname}")
    public ResponseEntity<ApiResponse<User>> getByNickname(@PathVariable String nickname) {
        User user = userService.findByNickname(nickname)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        return success(user);
    }
    
    /**
     * 전화번호로 사용자 조회
     */
    @GetMapping("/phone/{phone}")
    public ResponseEntity<ApiResponse<User>> getByPhone(@PathVariable String phone) {
        User user = userService.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        return success(user);
    }
    
    /**
     * 역할별 사용자 조회
     */
    @GetMapping("/role/{role}")
    public ResponseEntity<ApiResponse<List<User>>> getByRole(@PathVariable String role, HttpSession session) {
        // 표준화 원칙: SessionUtils 사용
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("인증이 필요합니다.");
        }
        
        // 동적 권한 체크
        if (!dynamicPermissionService.hasPermission(currentUser, "USER_MANAGE")) {
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }
        
        // 현재 로그인한 사용자의 지점코드 확인
        String currentBranchCode = currentUser.getBranchCode();
        log.info("🔍 현재 사용자 지점코드: {}", currentBranchCode);
        
        List<User> allUsers = userService.findByRole(role);
        
        // 지점코드로 필터링
        List<User> users = allUsers.stream()
            .filter(user -> {
                if (currentBranchCode == null || currentBranchCode.trim().isEmpty()) {
                    return true; // 지점코드가 없으면 모든 사용자 조회
                }
                return currentBranchCode.equals(user.getBranchCode());
            })
            .collect(java.util.stream.Collectors.toList());
        
        log.info("🔍 역할별 사용자 조회 완료 - 전체: {}, 필터링 후: {}", allUsers.size(), users.size());
        return success(users);
    }
    
    /**
     * 역할별 사용자 페이징 조회
     */
    @GetMapping("/role/{role}/page")
    public ResponseEntity<ApiResponse<Page<User>>> getByRolePaged(@PathVariable String role, Pageable pageable) {
        Page<User> users = userService.findByRole(role, pageable);
        return success(users);
    }
    
    /**
     * 역할별 사용자 개수 조회
     */
    @GetMapping("/role/{role}/count")
    public ResponseEntity<ApiResponse<Long>> getCountByRole(@PathVariable String role) {
        long count = userService.countByRole(role);
        return success(count);
    }
    
    /**
     * 등급별 사용자 조회
     */
    @GetMapping("/grade/{grade}")
    public ResponseEntity<ApiResponse<List<User>>> getByGrade(@PathVariable String grade) {
        List<User> users = userService.findByGrade(grade);
        return success(users);
    }
    
    /**
     * 등급별 사용자 페이징 조회
     */
    @GetMapping("/grade/{grade}/page")
    public ResponseEntity<ApiResponse<Page<User>>> getByGradePaged(@PathVariable String grade, Pageable pageable) {
        Page<User> users = userService.findByGrade(grade, pageable);
        return success(users);
    }
    
    /**
     * 등급별 사용자 개수 조회
     */
    @GetMapping("/grade/{grade}/count")
    public ResponseEntity<ApiResponse<Long>> getCountByGrade(@PathVariable String grade) {
        long count = userService.countByGrade(grade);
        return success(count);
    }
    
    /**
     * 상태별 사용자 조회
     */
    @GetMapping("/status/{isActive}")
    public ResponseEntity<ApiResponse<List<User>>> getByStatus(@PathVariable Boolean isActive) {
        List<User> users = userService.findByIsActive(isActive);
        return success(users);
    }
    
    /**
     * 상태별 사용자 페이징 조회
     */
    @GetMapping("/status/{isActive}/page")
    public ResponseEntity<ApiResponse<Page<User>>> getByStatusPaged(@PathVariable Boolean isActive, Pageable pageable) {
        Page<User> users = userService.findByIsActive(isActive, pageable);
        return success(users);
    }
    
    /**
     * 상태별 사용자 개수 조회
     */
    @GetMapping("/status/{isActive}/count")
    public ResponseEntity<ApiResponse<Long>> getCountByStatus(@PathVariable Boolean isActive) {
        long count = userService.countByIsActive(isActive);
        return success(count);
    }
    
    /**
     * 성별 사용자 조회
     */
    @GetMapping("/gender/{gender}")
    public ResponseEntity<ApiResponse<List<User>>> getByGender(@PathVariable String gender) {
        List<User> users = userService.findByGender(gender);
        return success(users);
    }
    
    /**
     * 성별 사용자 개수 조회
     */
    @GetMapping("/gender/{gender}/count")
    public ResponseEntity<ApiResponse<Long>> getCountByGender(@PathVariable String gender) {
        long count = userService.countByGender(gender);
        return success(count);
    }
    
    /**
     * 연령대별 사용자 조회
     */
    @GetMapping("/age-group/{ageGroup}")
    public ResponseEntity<ApiResponse<List<User>>> getByAgeGroup(@PathVariable String ageGroup) {
        List<User> users = userService.findByAgeGroup(ageGroup);
        return success(users);
    }
    
    /**
     * 연령대별 사용자 개수 조회
     */
    @GetMapping("/age-group/{ageGroup}/count")
    public ResponseEntity<ApiResponse<Long>> getCountByAgeGroup(@PathVariable String ageGroup) {
        long count = userService.countByAgeGroup(ageGroup);
        return success(count);
    }
    
    // ==================== 기간별 조회 메서드 ====================
    
    /**
     * 특정 기간에 가입한 사용자 조회
     */
    @GetMapping("/created-between")
    public ResponseEntity<ApiResponse<List<User>>> getByCreatedAtBetween(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<User> users = userService.findByCreatedAtBetween(startDate, endDate);
        return success(users);
    }
    
    /**
     * 특정 기간에 가입한 사용자 페이징 조회
     */
    @GetMapping("/created-between/page")
    public ResponseEntity<ApiResponse<Page<User>>> getByCreatedAtBetweenPaged(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate,
            Pageable pageable) {
        Page<User> users = userService.findByCreatedAtBetween(startDate, endDate, pageable);
        return success(users);
    }
    
    /**
     * 특정 기간에 로그인한 사용자 조회
     */
    @GetMapping("/last-login-between")
    public ResponseEntity<ApiResponse<List<User>>> getByLastLoginAtBetween(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<User> users = userService.findByLastLoginAtBetween(startDate, endDate);
        return success(users);
    }
    
    // ==================== 검색 메서드 ====================
    
    /**
     * 이름으로 사용자 검색
     */
    @GetMapping("/search/name")
    public ResponseEntity<ApiResponse<List<User>>> searchByName(@RequestParam String name) {
        List<User> users = userService.findByNameContaining(name);
        return success(users);
    }
    
    /**
     * 이름으로 사용자 검색 페이징
     */
    @GetMapping("/search/name/page")
    public ResponseEntity<ApiResponse<Page<User>>> searchByNamePaged(@RequestParam String name, Pageable pageable) {
        Page<User> users = userService.findByNameContaining(name, pageable);
        return success(users);
    }
    
    /**
     * 닉네임으로 사용자 검색
     */
    @GetMapping("/search/nickname")
    public ResponseEntity<ApiResponse<List<User>>> searchByNickname(@RequestParam String nickname) {
        List<User> users = userService.findByNicknameContaining(nickname);
        return success(users);
    }
    
    /**
     * 닉네임으로 사용자 검색 페이징
     */
    @GetMapping("/search/nickname/page")
    public ResponseEntity<ApiResponse<Page<User>>> searchByNicknamePaged(@RequestParam String nickname, Pageable pageable) {
        Page<User> users = userService.findByNicknameContaining(nickname, pageable);
        return success(users);
    }
    
    /**
     * 이메일로 사용자 검색
     */
    @GetMapping("/search/email")
    public ResponseEntity<ApiResponse<List<User>>> searchByEmail(@RequestParam String email) {
        List<User> users = userService.findByEmailContaining(email);
        return success(users);
    }
    
    /**
     * 이메일로 사용자 검색 페이징
     */
    @GetMapping("/search/email/page")
    public ResponseEntity<ApiResponse<Page<User>>> searchByEmailPaged(@RequestParam String email, Pageable pageable) {
        Page<User> users = userService.findByEmailContaining(email, pageable);
        return success(users);
    }
    
    /**
     * 전화번호로 사용자 검색
     */
    @GetMapping("/search/phone")
    public ResponseEntity<ApiResponse<List<User>>> searchByPhone(@RequestParam String phone) {
        List<User> users = userService.findByPhoneContaining(phone);
        return success(users);
    }
    
    /**
     * 전화번호로 사용자 검색 페이징
     */
    @GetMapping("/search/phone/page")
    public ResponseEntity<ApiResponse<Page<User>>> searchByPhonePaged(@RequestParam String phone, Pageable pageable) {
        Page<User> users = userService.findByPhoneContaining(phone, pageable);
        return success(users);
    }
    
    /**
     * 복합 조건으로 사용자 검색
     */
    @GetMapping("/search/complex")
    public ResponseEntity<ApiResponse<Page<User>>> searchByComplexCriteria(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String ageGroup,
            Pageable pageable,
            HttpSession session) {
        
        // 현재 로그인한 사용자의 지점코드 확인
        User currentUser = (User) session.getAttribute("user");
        String currentBranchCode = currentUser != null ? currentUser.getBranchCode() : null;
        log.info("🔍 현재 사용자 지점코드: {}", currentBranchCode);
        
        Page<User> allUsers = userService.findByComplexCriteria(name, email, role, grade, isActive, gender, ageGroup, pageable);
        
        // 지점코드로 필터링
        List<User> filteredUsers = allUsers.getContent().stream()
            .filter(user -> {
                if (currentBranchCode == null || currentBranchCode.trim().isEmpty()) {
                    return true; // 지점코드가 없으면 모든 사용자 조회
                }
                return currentBranchCode.equals(user.getBranchCode());
            })
            .collect(java.util.stream.Collectors.toList());
        
        // 필터링된 결과로 새로운 Page 객체 생성
        Page<User> users = new org.springframework.data.domain.PageImpl<>(
            filteredUsers, 
            pageable, 
            filteredUsers.size()
        );
        
        log.info("🔍 복합 조건 사용자 검색 완료 - 전체: {}, 필터링 후: {}", allUsers.getTotalElements(), filteredUsers.size());
        return success(users);
    }
    
    // ==================== 통계 메서드 ====================
    
    /**
     * 사용자 통계 정보 조회
     */
    @GetMapping("/statistics/overall")
    public ResponseEntity<ApiResponse<Object[]>> getOverallStatistics(HttpSession session) {
        // 현재 로그인한 사용자의 지점코드 확인
        User currentUser = (User) session.getAttribute("user");
        String currentBranchCode = currentUser != null ? currentUser.getBranchCode() : null;
        log.info("🔍 현재 사용자 지점코드: {}", currentBranchCode);
        
        Object[] statistics = userService.getUserStatisticsByBranchCode(currentBranchCode);
        return success(statistics);
    }
    
    /**
     * 역할별 사용자 통계 조회
     */
    @GetMapping("/statistics/by-role")
    public ResponseEntity<ApiResponse<List<Object[]>>> getStatisticsByRole() {
        List<Object[]> statistics = userService.getUserStatisticsByRole();
        return success(statistics);
    }
    
    /**
     * 등급별 사용자 통계 조회
     */
    @GetMapping("/statistics/by-grade")
    public ResponseEntity<ApiResponse<List<Object[]>>> getStatisticsByGrade() {
        List<Object[]> statistics = userService.getUserStatisticsByGrade();
        return success(statistics);
    }
    
    /**
     * 성별 사용자 통계 조회
     */
    @GetMapping("/statistics/by-gender")
    public ResponseEntity<ApiResponse<List<Object[]>>> getStatisticsByGender() {
        List<Object[]> statistics = userService.getUserStatisticsByGender();
        return success(statistics);
    }
    
    /**
     * 연령대별 사용자 통계 조회
     */
    @GetMapping("/statistics/by-age-group")
    public ResponseEntity<ApiResponse<List<Object[]>>> getStatisticsByAgeGroup() {
        List<Object[]> statistics = userService.getUserStatisticsByAgeGroup();
        return success(statistics);
    }
    
    // ==================== 비즈니스 메서드 ====================
    
    /**
     * 사용자 등록
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> registerUser(@RequestBody User user, HttpSession session) {
        // 동적 권한 체크
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("인증이 필요합니다.");
        }
        
        if (!dynamicPermissionService.hasPermission(currentUser, "USER_MANAGE")) {
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }
        
        // 세션에서 현재 사용자의 지점 정보 가져오기 (관리자가 등록하는 경우)
        if (currentUser != null && currentUser.getBranch() != null) {
            // 관리자가 지점에 소속되어 있으면 자동으로 지점코드 설정
            if (user.getBranchCode() == null || user.getBranchCode().trim().isEmpty()) {
                user.setBranchCode(currentUser.getBranch().getBranchCode());
                log.info("🔧 세션에서 지점코드 자동 설정: branchCode={}", user.getBranchCode());
            }
        }
        
        User registeredUser = userService.registerUser(user);
        return created("사용자가 등록되었습니다.", registeredUser);
    }
    
    /**
     * 사용자 프로필 수정
     */
    @PutMapping("/{id}/profile")
    public ResponseEntity<ApiResponse<User>> updateProfile(@PathVariable Long id, @RequestBody User updateData) {
        User updatedUser = userService.updateUserProfile(id, updateData);
        return updated("프로필이 수정되었습니다.", updatedUser);
    }
    
    /**
     * 사용자 비밀번호 변경
     */
    @PutMapping("/{id}/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @PathVariable Long id,
            @RequestParam String oldPassword,
            @RequestParam String newPassword) {
        userService.changePassword(id, oldPassword, newPassword);
        return success("비밀번호가 변경되었습니다.");
    }
    
    /**
     * 사용자 비밀번호 재설정
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestParam String email) {
        userService.resetPassword(email);
        return success("비밀번호 재설정 이메일이 발송되었습니다.");
    }
    
    /**
     * 사용자 계정 활성화/비활성화
     */
    @PutMapping("/{id}/active")
    public ResponseEntity<ApiResponse<Void>> setActive(@PathVariable Long id, @RequestParam boolean isActive, HttpSession session) {
        // 동적 권한 체크
        User currentUser = (User) session.getAttribute("user");
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("인증이 필요합니다.");
        }
        
        if (!dynamicPermissionService.hasPermission(currentUser, "USER_MANAGE")) {
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }
        
        userService.setUserActive(id, isActive);
        return success(isActive ? "계정이 활성화되었습니다." : "계정이 비활성화되었습니다.");
    }
    
    /**
     * 사용자 역할 변경
     */
    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<Void>> changeRole(@PathVariable Long id, @RequestParam String newRole) {
        userService.changeUserRole(id, newRole);
        return success("역할이 변경되었습니다.");
    }
    
    /**
     * 사용자 등급 변경
     */
    @PutMapping("/{id}/grade")
    public ResponseEntity<ApiResponse<Void>> changeGrade(@PathVariable Long id, @RequestParam String newGrade) {
        userService.changeUserGrade(id, newGrade);
        return success("등급이 변경되었습니다.");
    }
    
    /**
     * 사용자 경험치 추가
     */
    @PutMapping("/{id}/experience")
    public ResponseEntity<ApiResponse<Void>> addExperience(@PathVariable Long id, @RequestParam Long points) {
        userService.addExperiencePoints(id, points);
        return success("경험치가 추가되었습니다.");
    }
    
    /**
     * 사용자 상담 횟수 증가
     */
    @PutMapping("/{id}/consultations/increment")
    public ResponseEntity<ApiResponse<Void>> incrementConsultations(@PathVariable Long id) {
        userService.incrementConsultations(id);
        return success("상담 횟수가 증가되었습니다.");
    }
    
    /**
     * 사용자 마지막 로그인 시간 업데이트
     */
    @PutMapping("/{id}/last-login")
    public ResponseEntity<ApiResponse<Void>> updateLastLogin(@PathVariable Long id) {
        userService.updateLastLogin(id);
        return success("마지막 로그인 시간이 업데이트되었습니다.");
    }
    
    /**
     * 사용자 이메일 인증
     */
    @PutMapping("/{id}/verify-email")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@PathVariable Long id) {
        userService.verifyEmail(id);
        return success("이메일이 인증되었습니다.");
    }
    
    /**
     * 사용자 계정 삭제
     */
    @DeleteMapping("/{id}/account")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(@PathVariable Long id) {
        userService.deleteUserAccount(id);
        return deleted("계정이 삭제되었습니다.");
    }
    
    /**
     * 사용자 계정 복구
     */
    @PostMapping("/{id}/restore-account")
    public ResponseEntity<ApiResponse<Void>> restoreAccount(@PathVariable Long id) {
        userService.restoreUserAccount(id);
        return success("계정이 복구되었습니다.");
    }
    
    // ==================== 중복 검사 메서드 ====================
    
    /**
     * 이메일 중복 검사
     */
    @GetMapping("/duplicate-check/email")
    public ResponseEntity<ApiResponse<Boolean>> checkEmailDuplicate(
            @RequestParam String email,
            @RequestParam(required = false) Long excludeId) {
        boolean isDuplicate = userService.isDuplicateExcludingId(excludeId, "email", email);
        return success(isDuplicate);
    }
    
    /**
     * 닉네임 중복 검사
     */
    @GetMapping("/duplicate-check/nickname")
    public ResponseEntity<ApiResponse<Boolean>> checkNicknameDuplicate(
            @RequestParam String nickname,
            @RequestParam(required = false) Long excludeId) {
        boolean isDuplicate = userService.isDuplicateExcludingId(excludeId, "nickname", nickname);
        return success(isDuplicate);
    }
    
    /**
     * 전화번호 중복 검사
     */
    @GetMapping("/duplicate-check/phone")
    public ResponseEntity<ApiResponse<Boolean>> checkPhoneDuplicate(
            @RequestParam String phone,
            @RequestParam(required = false) Long excludeId) {
        boolean isDuplicate = userService.isDuplicateExcludingId(excludeId, "phone", phone);
        return success(isDuplicate);
    }
    
    // ==================== 특수 조회 메서드 ====================
    
    /**
     * 최근 로그인한 사용자 조회
     */
    @GetMapping("/recent-login")
    public ResponseEntity<ApiResponse<List<User>>> getRecentLoginUsers(@RequestParam(defaultValue = "10") int limit) {
        List<User> users = userService.findRecentLoginUsers(limit);
        return success(users);
    }
    
    /**
     * 오랫동안 로그인하지 않은 사용자 조회
     */
    @GetMapping("/inactive")
    public ResponseEntity<ApiResponse<List<User>>> getInactiveUsers(@RequestParam LocalDateTime cutoffDate) {
        List<User> users = userService.findInactiveUsers(cutoffDate);
        return success(users);
    }
    
    /**
     * 경험치 기준 사용자 조회
     */
    @GetMapping("/experience/{minPoints}")
    public ResponseEntity<ApiResponse<List<User>>> getByExperiencePoints(@PathVariable Long minPoints) {
        List<User> users = userService.findByExperiencePointsGreaterThanEqual(minPoints);
        return success(users);
    }
    
    /**
     * 경험치 기준 사용자 페이징 조회
     */
    @GetMapping("/experience/{minPoints}/page")
    public ResponseEntity<ApiResponse<Page<User>>> getByExperiencePointsPaged(@PathVariable Long minPoints, Pageable pageable) {
        Page<User> users = userService.findByExperiencePointsGreaterThanEqual(minPoints, pageable);
        return success(users);
    }
    
    /**
     * 상담 횟수 기준 사용자 조회
     */
    @GetMapping("/consultations/{minCount}")
    public ResponseEntity<ApiResponse<List<User>>> getByConsultationCount(@PathVariable Integer minCount) {
        List<User> users = userService.findByTotalConsultationsGreaterThanEqual(minCount);
        return success(users);
    }
    
    /**
     * 상담 횟수 기준 사용자 페이징 조회
     */
    @GetMapping("/consultations/{minCount}/page")
    public ResponseEntity<ApiResponse<Page<User>>> getByConsultationCountPaged(@PathVariable Integer minCount, Pageable pageable) {
        Page<User> users = userService.findByTotalConsultationsGreaterThanEqual(minCount, pageable);
        return success(users);
    }

    @GetMapping("/{userId}/profile-image")
    public ResponseEntity<ApiResponse<ProfileImageInfo>> getProfileImage(@PathVariable Long userId) {
        log.info("🖼️ 사용자 프로필 이미지 조회: {}", userId);
        ProfileImageInfo profileImageInfo = userService.getProfileImageInfo(userId);
        return success(profileImageInfo);
    }
}

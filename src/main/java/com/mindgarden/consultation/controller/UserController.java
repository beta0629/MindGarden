package com.mindgarden.consultation.controller;

import java.time.LocalDateTime;
import java.util.List;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
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

/**
 * 사용자 관리 Controller
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController implements BaseController<User, Long> {
    
    @Autowired
    private UserService userService;
    
    @Override
    public UserService getService() {
        return userService;
    }
    
    // ==================== 기본 CRUD 메서드 (BaseController에서 상속) ====================
    
    // ==================== 사용자별 조회 메서드 ====================
    
    /**
     * 이메일로 사용자 조회
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<User> getByEmail(@PathVariable String email) {
        return userService.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 닉네임으로 사용자 조회
     */
    @GetMapping("/nickname/{nickname}")
    public ResponseEntity<User> getByNickname(@PathVariable String nickname) {
        return userService.findByNickname(nickname)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 전화번호로 사용자 조회
     */
    @GetMapping("/phone/{phone}")
    public ResponseEntity<User> getByPhone(@PathVariable String phone) {
        return userService.findByPhone(phone)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 역할별 사용자 조회
     */
    @GetMapping("/role/{role}")
    public ResponseEntity<List<User>> getByRole(@PathVariable String role) {
        List<User> users = userService.findByRole(role);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 역할별 사용자 페이징 조회
     */
    @GetMapping("/role/{role}/page")
    public ResponseEntity<Page<User>> getByRolePaged(@PathVariable String role, Pageable pageable) {
        Page<User> users = userService.findByRole(role, pageable);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 역할별 사용자 개수 조회
     */
    @GetMapping("/role/{role}/count")
    public ResponseEntity<Long> getCountByRole(@PathVariable String role) {
        long count = userService.countByRole(role);
        return ResponseEntity.ok(count);
    }
    
    /**
     * 등급별 사용자 조회
     */
    @GetMapping("/grade/{grade}")
    public ResponseEntity<List<User>> getByGrade(@PathVariable String grade) {
        List<User> users = userService.findByGrade(grade);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 등급별 사용자 페이징 조회
     */
    @GetMapping("/grade/{grade}/page")
    public ResponseEntity<Page<User>> getByGradePaged(@PathVariable String grade, Pageable pageable) {
        Page<User> users = userService.findByGrade(grade, pageable);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 등급별 사용자 개수 조회
     */
    @GetMapping("/grade/{grade}/count")
    public ResponseEntity<Long> getCountByGrade(@PathVariable String grade) {
        long count = userService.countByGrade(grade);
        return ResponseEntity.ok(count);
    }
    
    /**
     * 상태별 사용자 조회
     */
    @GetMapping("/status/{isActive}")
    public ResponseEntity<List<User>> getByStatus(@PathVariable Boolean isActive) {
        List<User> users = userService.findByIsActive(isActive);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 상태별 사용자 페이징 조회
     */
    @GetMapping("/status/{isActive}/page")
    public ResponseEntity<Page<User>> getByStatusPaged(@PathVariable Boolean isActive, Pageable pageable) {
        Page<User> users = userService.findByIsActive(isActive, pageable);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 상태별 사용자 개수 조회
     */
    @GetMapping("/status/{isActive}/count")
    public ResponseEntity<Long> getCountByStatus(@PathVariable Boolean isActive) {
        long count = userService.countByIsActive(isActive);
        return ResponseEntity.ok(count);
    }
    
    /**
     * 성별 사용자 조회
     */
    @GetMapping("/gender/{gender}")
    public ResponseEntity<List<User>> getByGender(@PathVariable String gender) {
        List<User> users = userService.findByGender(gender);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 성별 사용자 개수 조회
     */
    @GetMapping("/gender/{gender}/count")
    public ResponseEntity<Long> getCountByGender(@PathVariable String gender) {
        long count = userService.countByGender(gender);
        return ResponseEntity.ok(count);
    }
    
    /**
     * 연령대별 사용자 조회
     */
    @GetMapping("/age-group/{ageGroup}")
    public ResponseEntity<List<User>> getByAgeGroup(@PathVariable String ageGroup) {
        List<User> users = userService.findByAgeGroup(ageGroup);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 연령대별 사용자 개수 조회
     */
    @GetMapping("/age-group/{ageGroup}/count")
    public ResponseEntity<Long> getCountByAgeGroup(@PathVariable String ageGroup) {
        long count = userService.countByAgeGroup(ageGroup);
        return ResponseEntity.ok(count);
    }
    
    // ==================== 기간별 조회 메서드 ====================
    
    /**
     * 특정 기간에 가입한 사용자 조회
     */
    @GetMapping("/created-between")
    public ResponseEntity<List<User>> getByCreatedAtBetween(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<User> users = userService.findByCreatedAtBetween(startDate, endDate);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 특정 기간에 가입한 사용자 페이징 조회
     */
    @GetMapping("/created-between/page")
    public ResponseEntity<Page<User>> getByCreatedAtBetweenPaged(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate,
            Pageable pageable) {
        Page<User> users = userService.findByCreatedAtBetween(startDate, endDate, pageable);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 특정 기간에 로그인한 사용자 조회
     */
    @GetMapping("/last-login-between")
    public ResponseEntity<List<User>> getByLastLoginAtBetween(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<User> users = userService.findByLastLoginAtBetween(startDate, endDate);
        return ResponseEntity.ok(users);
    }
    
    // ==================== 검색 메서드 ====================
    
    /**
     * 이름으로 사용자 검색
     */
    @GetMapping("/search/name")
    public ResponseEntity<List<User>> searchByName(@RequestParam String name) {
        List<User> users = userService.findByNameContaining(name);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 이름으로 사용자 검색 페이징
     */
    @GetMapping("/search/name/page")
    public ResponseEntity<Page<User>> searchByNamePaged(@RequestParam String name, Pageable pageable) {
        Page<User> users = userService.findByNameContaining(name, pageable);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 닉네임으로 사용자 검색
     */
    @GetMapping("/search/nickname")
    public ResponseEntity<List<User>> searchByNickname(@RequestParam String nickname) {
        List<User> users = userService.findByNicknameContaining(nickname);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 닉네임으로 사용자 검색 페이징
     */
    @GetMapping("/search/nickname/page")
    public ResponseEntity<Page<User>> searchByNicknamePaged(@RequestParam String nickname, Pageable pageable) {
        Page<User> users = userService.findByNicknameContaining(nickname, pageable);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 이메일로 사용자 검색
     */
    @GetMapping("/search/email")
    public ResponseEntity<List<User>> searchByEmail(@RequestParam String email) {
        List<User> users = userService.findByEmailContaining(email);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 이메일로 사용자 검색 페이징
     */
    @GetMapping("/search/email/page")
    public ResponseEntity<Page<User>> searchByEmailPaged(@RequestParam String email, Pageable pageable) {
        Page<User> users = userService.findByEmailContaining(email, pageable);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 전화번호로 사용자 검색
     */
    @GetMapping("/search/phone")
    public ResponseEntity<List<User>> searchByPhone(@RequestParam String phone) {
        List<User> users = userService.findByPhoneContaining(phone);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 전화번호로 사용자 검색 페이징
     */
    @GetMapping("/search/phone/page")
    public ResponseEntity<Page<User>> searchByPhonePaged(@RequestParam String phone, Pageable pageable) {
        Page<User> users = userService.findByPhoneContaining(phone, pageable);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 복합 조건으로 사용자 검색
     */
    @GetMapping("/search/complex")
    public ResponseEntity<Page<User>> searchByComplexCriteria(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String ageGroup,
            Pageable pageable) {
        
        Page<User> users = userService.findByComplexCriteria(name, email, role, grade, isActive, gender, ageGroup, pageable);
        return ResponseEntity.ok(users);
    }
    
    // ==================== 통계 메서드 ====================
    
    /**
     * 사용자 통계 정보 조회
     */
    @GetMapping("/statistics/overall")
    public ResponseEntity<Object[]> getOverallStatistics() {
        Object[] statistics = userService.getUserStatistics();
        return ResponseEntity.ok(statistics);
    }
    
    /**
     * 역할별 사용자 통계 조회
     */
    @GetMapping("/statistics/by-role")
    public ResponseEntity<List<Object[]>> getStatisticsByRole() {
        List<Object[]> statistics = userService.getUserStatisticsByRole();
        return ResponseEntity.ok(statistics);
    }
    
    /**
     * 등급별 사용자 통계 조회
     */
    @GetMapping("/statistics/by-grade")
    public ResponseEntity<List<Object[]>> getStatisticsByGrade() {
        List<Object[]> statistics = userService.getUserStatisticsByGrade();
        return ResponseEntity.ok(statistics);
    }
    
    /**
     * 성별 사용자 통계 조회
     */
    @GetMapping("/statistics/by-gender")
    public ResponseEntity<List<Object[]>> getStatisticsByGender() {
        List<Object[]> statistics = userService.getUserStatisticsByGender();
        return ResponseEntity.ok(statistics);
    }
    
    /**
     * 연령대별 사용자 통계 조회
     */
    @GetMapping("/statistics/by-age-group")
    public ResponseEntity<List<Object[]>> getStatisticsByAgeGroup() {
        List<Object[]> statistics = userService.getUserStatisticsByAgeGroup();
        return ResponseEntity.ok(statistics);
    }
    
    // ==================== 비즈니스 메서드 ====================
    
    /**
     * 사용자 등록
     */
    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody User user) {
        User registeredUser = userService.registerUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(registeredUser);
    }
    
    /**
     * 사용자 프로필 수정
     */
    @PutMapping("/{id}/profile")
    public ResponseEntity<User> updateProfile(@PathVariable Long id, @RequestBody User updateData) {
        User updatedUser = userService.updateUserProfile(id, updateData);
        return ResponseEntity.ok(updatedUser);
    }
    
    /**
     * 사용자 비밀번호 변경
     */
    @PutMapping("/{id}/password")
    public ResponseEntity<Void> changePassword(
            @PathVariable Long id,
            @RequestParam String oldPassword,
            @RequestParam String newPassword) {
        userService.changePassword(id, oldPassword, newPassword);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 사용자 비밀번호 재설정
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestParam String email) {
        userService.resetPassword(email);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 사용자 계정 활성화/비활성화
     */
    @PutMapping("/{id}/active")
    public ResponseEntity<Void> setActive(@PathVariable Long id, @RequestParam boolean isActive) {
        userService.setUserActive(id, isActive);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 사용자 역할 변경
     */
    @PutMapping("/{id}/role")
    public ResponseEntity<Void> changeRole(@PathVariable Long id, @RequestParam String newRole) {
        userService.changeUserRole(id, newRole);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 사용자 등급 변경
     */
    @PutMapping("/{id}/grade")
    public ResponseEntity<Void> changeGrade(@PathVariable Long id, @RequestParam String newGrade) {
        userService.changeUserGrade(id, newGrade);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 사용자 경험치 추가
     */
    @PutMapping("/{id}/experience")
    public ResponseEntity<Void> addExperience(@PathVariable Long id, @RequestParam Long points) {
        userService.addExperiencePoints(id, points);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 사용자 상담 횟수 증가
     */
    @PutMapping("/{id}/consultations/increment")
    public ResponseEntity<Void> incrementConsultations(@PathVariable Long id) {
        userService.incrementConsultations(id);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 사용자 마지막 로그인 시간 업데이트
     */
    @PutMapping("/{id}/last-login")
    public ResponseEntity<Void> updateLastLogin(@PathVariable Long id) {
        userService.updateLastLogin(id);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 사용자 이메일 인증
     */
    @PutMapping("/{id}/verify-email")
    public ResponseEntity<Void> verifyEmail(@PathVariable Long id) {
        userService.verifyEmail(id);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 사용자 계정 삭제
     */
    @DeleteMapping("/{id}/account")
    public ResponseEntity<Void> deleteAccount(@PathVariable Long id) {
        userService.deleteUserAccount(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 사용자 계정 복구
     */
    @PostMapping("/{id}/restore-account")
    public ResponseEntity<Void> restoreAccount(@PathVariable Long id) {
        userService.restoreUserAccount(id);
        return ResponseEntity.ok().build();
    }
    
    // ==================== 중복 검사 메서드 ====================
    
    /**
     * 이메일 중복 검사
     */
    @GetMapping("/duplicate-check/email")
    public ResponseEntity<Boolean> checkEmailDuplicate(
            @RequestParam String email,
            @RequestParam(required = false) Long excludeId) {
        boolean isDuplicate = userService.isDuplicateExcludingId(excludeId, "email", email);
        return ResponseEntity.ok(isDuplicate);
    }
    
    /**
     * 닉네임 중복 검사
     */
    @GetMapping("/duplicate-check/nickname")
    public ResponseEntity<Boolean> checkNicknameDuplicate(
            @RequestParam String nickname,
            @RequestParam(required = false) Long excludeId) {
        boolean isDuplicate = userService.isDuplicateExcludingId(excludeId, "nickname", nickname);
        return ResponseEntity.ok(isDuplicate);
    }
    
    /**
     * 전화번호 중복 검사
     */
    @GetMapping("/duplicate-check/phone")
    public ResponseEntity<Boolean> checkPhoneDuplicate(
            @RequestParam String phone,
            @RequestParam(required = false) Long excludeId) {
        boolean isDuplicate = userService.isDuplicateExcludingId(excludeId, "phone", phone);
        return ResponseEntity.ok(isDuplicate);
    }
    
    // ==================== 특수 조회 메서드 ====================
    
    /**
     * 최근 로그인한 사용자 조회
     */
    @GetMapping("/recent-login")
    public ResponseEntity<List<User>> getRecentLoginUsers(@RequestParam(defaultValue = "10") int limit) {
        List<User> users = userService.findRecentLoginUsers(limit);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 오랫동안 로그인하지 않은 사용자 조회
     */
    @GetMapping("/inactive")
    public ResponseEntity<List<User>> getInactiveUsers(@RequestParam LocalDateTime cutoffDate) {
        List<User> users = userService.findInactiveUsers(cutoffDate);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 경험치 기준 사용자 조회
     */
    @GetMapping("/experience/{minPoints}")
    public ResponseEntity<List<User>> getByExperiencePoints(@PathVariable Long minPoints) {
        List<User> users = userService.findByExperiencePointsGreaterThanEqual(minPoints);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 경험치 기준 사용자 페이징 조회
     */
    @GetMapping("/experience/{minPoints}/page")
    public ResponseEntity<Page<User>> getByExperiencePointsPaged(@PathVariable Long minPoints, Pageable pageable) {
        Page<User> users = userService.findByExperiencePointsGreaterThanEqual(minPoints, pageable);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 상담 횟수 기준 사용자 조회
     */
    @GetMapping("/consultations/{minCount}")
    public ResponseEntity<List<User>> getByConsultationCount(@PathVariable Integer minCount) {
        List<User> users = userService.findByTotalConsultationsGreaterThanEqual(minCount);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 상담 횟수 기준 사용자 페이징 조회
     */
    @GetMapping("/consultations/{minCount}/page")
    public ResponseEntity<Page<User>> getByConsultationCountPaged(@PathVariable Integer minCount, Pageable pageable) {
        Page<User> users = userService.findByTotalConsultationsGreaterThanEqual(minCount, pageable);
        return ResponseEntity.ok(users);
    }
}

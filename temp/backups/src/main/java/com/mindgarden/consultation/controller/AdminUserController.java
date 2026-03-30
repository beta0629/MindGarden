package com.mindgarden.consultation.controller;

import java.util.List;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.UserProfileResponse;
import com.mindgarden.consultation.service.UserProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 관리자용 유저 관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    
    private final UserProfileService userProfileService;
    
    /**
     * 상담사 신청자 목록 조회 (역할이 CLIENT인 사용자 중 상담사 자격 요건 충족자)
     */
    @GetMapping("/consultant-applicants")
    public ResponseEntity<List<UserProfileResponse>> getConsultantApplicants() {
        try {
            // TODO: 상담사 신청자 목록 조회 로직 구현
            // 현재는 간단하게 응답만 반환
            log.info("상담사 신청자 목록 조회 요청");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("상담사 신청자 목록 조회 중 오류 발생: error={}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 상담사 승인 (CLIENT → CONSULTANT)
     */
    @PutMapping("/{userId}/approve-consultant")
    public ResponseEntity<Boolean> approveConsultant(@PathVariable Long userId) {
        try {
            log.info("상담사 승인 요청: userId={}", userId);
            
            // 상담사 자격 요건 확인
            boolean eligible = userProfileService.checkConsultantEligibility(userId);
            if (!eligible) {
                return ResponseEntity.badRequest().body(false);
            }
            
            // 역할을 CONSULTANT로 변경
            boolean success = userProfileService.changeUserRole(userId, UserRole.CONSULTANT);
            if (success) {
                log.info("상담사 승인 완료: userId={}", userId);
                return ResponseEntity.ok(true);
            } else {
                return ResponseEntity.badRequest().body(false);
            }
        } catch (Exception e) {
            log.error("상담사 승인 중 오류 발생: userId={}, error={}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(false);
        }
    }
    
    /**
     * 관리자 승인 (CONSULTANT → ADMIN)
     */
    @PutMapping("/{userId}/approve-admin")
    public ResponseEntity<Boolean> approveAdmin(@PathVariable Long userId) {
        try {
            log.info("관리자 승인 요청: userId={}", userId);
            
            // 관리자 자격 요건 확인 (UserProfileService에 메서드 추가 필요)
            // boolean eligible = userProfileService.checkAdminEligibility(userId);
            // if (!eligible) {
            //     return ResponseEntity.badRequest().body(false);
            // }
            
            // 역할을 ADMIN으로 변경
            boolean success = userProfileService.changeUserRole(userId, UserRole.ADMIN);
            if (success) {
                log.info("관리자 승인 완료: userId={}", userId);
                return ResponseEntity.ok(true);
            } else {
                return ResponseEntity.badRequest().body(false);
            }
        } catch (Exception e) {
            log.error("관리자 승인 중 오류 발생: userId={}, error={}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(false);
        }
    }
    
    /**
     * 유저 역할 변경 (관리자 전용)
     */
    @PutMapping("/{userId}/role")
    public ResponseEntity<Boolean> changeUserRole(
            @PathVariable Long userId,
            @RequestParam String newRole) {
        try {
            log.info("관리자 권한으로 유저 역할 변경: userId={}, newRole={}", userId, newRole);
            
            // 유효한 역할인지 확인
            if (!isValidRole(newRole)) {
                return ResponseEntity.badRequest().body(false);
            }
            
            boolean success = userProfileService.changeUserRole(userId, newRole);
            if (success) {
                log.info("유저 역할 변경 완료: userId={}, newRole={}", userId, newRole);
                return ResponseEntity.ok(true);
            } else {
                return ResponseEntity.badRequest().body(false);
            }
        } catch (Exception e) {
            log.error("유저 역할 변경 중 오류 발생: userId={}, newRole={}, error={}", 
                    userId, newRole, e.getMessage(), e);
            return ResponseEntity.badRequest().body(false);
        }
    }
    
    /**
     * 유효한 역할인지 확인
     */
    private boolean isValidRole(String role) {
        return UserRole.CLIENT.equals(role) || 
               UserRole.CONSULTANT.equals(role) || 
               UserRole.ADMIN.equals(role) || 
               UserRole.SUPER_ADMIN.equals(role);
    }
}

package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.dto.UserProfileResponse;
import com.mindgarden.consultation.dto.UserProfileUpdateRequest;
import com.mindgarden.consultation.service.UserProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 유저 프로필 관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/user/profile")
@RequiredArgsConstructor
public class UserProfileController {
    
    private final UserProfileService userProfileService;
    
    /**
     * 유저 프로필 조회
     */
    @GetMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> getUserProfile(@PathVariable Long userId) {
        try {
            UserProfileResponse response = userProfileService.getUserProfile(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("유저 프로필 조회 중 오류 발생: userId={}, error={}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 유저 프로필 추가 정보 등록/수정
     */
    @PutMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> updateUserProfile(
            @PathVariable Long userId,
            @RequestBody UserProfileUpdateRequest request) {
        try {
            log.info("유저 프로필 업데이트 요청: userId={}", userId);
            UserProfileResponse response = userProfileService.updateUserProfile(userId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("유저 프로필 업데이트 중 오류 발생: userId={}, error={}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 유저 역할 변경
     */
    @PutMapping("/{userId}/role")
    public ResponseEntity<Boolean> changeUserRole(
            @PathVariable Long userId,
            @RequestParam String newRole) {
        try {
            log.info("유저 역할 변경 요청: userId={}, newRole={}", userId, newRole);
            boolean success = userProfileService.changeUserRole(userId, newRole);
            if (success) {
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
     * 프로필 완성도 조회
     */
    @GetMapping("/{userId}/completion")
    public ResponseEntity<Integer> getProfileCompletionRate(@PathVariable Long userId) {
        try {
            int completionRate = userProfileService.getProfileCompletionRate(userId);
            return ResponseEntity.ok(completionRate);
        } catch (Exception e) {
            log.error("프로필 완성도 조회 중 오류 발생: userId={}, error={}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 상담사 자격 요건 확인
     */
    @GetMapping("/{userId}/consultant-eligibility")
    public ResponseEntity<Boolean> checkConsultantEligibility(@PathVariable Long userId) {
        try {
            boolean eligible = userProfileService.checkConsultantEligibility(userId);
            return ResponseEntity.ok(eligible);
        } catch (Exception e) {
            log.error("상담사 자격 요건 확인 중 오류 발생: userId={}, error={}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
}

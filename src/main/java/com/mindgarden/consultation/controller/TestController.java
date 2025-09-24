package com.mindgarden.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import com.mindgarden.consultation.util.BranchAccountCreator;
import com.mindgarden.consultation.entity.UserActivity;
import com.mindgarden.consultation.repository.UserActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDateTime;

/**
 * 테스트용 컨트롤러
 * 작성일: 2025-09-23
 * 설명: 지점별 계정 생성 및 테스트 기능
 */
@RestController
@RequestMapping("/api/test")
public class TestController {

    @Autowired
    private BranchAccountCreator branchAccountCreator;
    
    @Autowired
    private UserActivityRepository userActivityRepository;

    /**
     * 모든 지점의 계정 생성
     */
    @PostMapping("/create-branch-accounts")
    public ResponseEntity<Map<String, Object>> createAllBranchAccounts() {
        try {
            branchAccountCreator.createAllBranchAccounts();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "모든 지점 계정이 성공적으로 생성되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "계정 생성 중 오류가 발생했습니다: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 특정 지점의 계정 생성
     */
    @PostMapping("/create-branch-account/{branchCode}")
    public ResponseEntity<Map<String, Object>> createBranchAccount(@PathVariable String branchCode) {
        try {
            branchAccountCreator.createBranchAccount(branchCode);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "지점 " + branchCode + " 계정이 성공적으로 생성되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "계정 생성 중 오류가 발생했습니다: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 테스트 상태 확인
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getTestStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "테스트 서버가 정상적으로 작동 중입니다.");
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 활동 내역 샘플 데이터 삽입 (로컬 테스트용)
     */
    @PostMapping("/insert-activity-samples")
    public ResponseEntity<Map<String, Object>> insertActivitySamples() {
        try {
            // 기존 샘플 데이터 삭제
            userActivityRepository.deleteAll();
            
            // 샘플 데이터 생성
            LocalDateTime now = LocalDateTime.now();
            
            UserActivity activity1 = UserActivity.builder()
                .userId(24L) // 테스트용 사용자 ID
                .activityType("CONSULTATION")
                .title("김선희 상담사와의 상담 일정 등록")
                .description("2025년 1월 15일 오후 2시 상담 예약이 완료되었습니다.")
                .status("COMPLETED")
                .icon("bi-calendar-check")
                .color("#28a745")
                .relatedId(1L)
                .relatedType("CONSULTATION")
                .createdAt(now.minusDays(1))
                .updatedAt(now.minusDays(1))
                .build();
                
            UserActivity activity2 = UserActivity.builder()
                .userId(24L)
                .activityType("CONSULTATION")
                .title("상담 일정 확정")
                .description("김선희 상담사와의 상담이 확정되었습니다.")
                .status("COMPLETED")
                .icon("bi-check-circle")
                .color("#007bff")
                .relatedId(1L)
                .relatedType("CONSULTATION")
                .createdAt(now.minusDays(1))
                .updatedAt(now.minusDays(1))
                .build();
                
            UserActivity activity3 = UserActivity.builder()
                .userId(24L)
                .activityType("PAYMENT")
                .title("상담 패키지 결제 완료")
                .description("5회 상담 패키지 (150,000원) 결제가 완료되었습니다.")
                .status("COMPLETED")
                .icon("bi-credit-card")
                .color("#6f42c1")
                .relatedId(1L)
                .relatedType("PAYMENT")
                .createdAt(now.minusDays(2))
                .updatedAt(now.minusDays(2))
                .build();
                
            UserActivity activity4 = UserActivity.builder()
                .userId(24L)
                .activityType("SYSTEM")
                .title("상담 리마인더 알림")
                .description("내일 오후 2시 상담 일정이 있습니다.")
                .status("INFO")
                .icon("bi-bell")
                .color("#ffc107")
                .relatedId(1L)
                .relatedType("CONSULTATION")
                .createdAt(now.minusDays(2))
                .updatedAt(now.minusDays(2))
                .build();
                
            UserActivity activity5 = UserActivity.builder()
                .userId(24L)
                .activityType("CONSULTATION")
                .title("상담사 피드백 수신")
                .description("김선희 상담사님으로부터 상담 후 피드백을 받았습니다.")
                .status("COMPLETED")
                .icon("bi-chat-dots")
                .color("#17a2b8")
                .relatedId(1L)
                .relatedType("CONSULTATION")
                .createdAt(now.minusDays(3))
                .updatedAt(now.minusDays(3))
                .build();
            
            // 데이터 저장
            userActivityRepository.save(activity1);
            userActivityRepository.save(activity2);
            userActivityRepository.save(activity3);
            userActivityRepository.save(activity4);
            userActivityRepository.save(activity5);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "활동 내역 샘플 데이터가 성공적으로 삽입되었습니다.");
            response.put("count", 5);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "샘플 데이터 삽입 중 오류가 발생했습니다: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
}

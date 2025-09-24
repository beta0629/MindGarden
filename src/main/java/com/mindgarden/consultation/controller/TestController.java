package com.mindgarden.consultation.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.UserActivity;
import com.mindgarden.consultation.repository.UserActivityRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.util.BranchAccountCreator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    
    @Autowired
    private UserRepository userRepository;
    
    @Value("${spring.profiles.active:prod}")
    private String activeProfile;
    
    @Value("${isDev:false}")
    private boolean isDev;

    /**
     * 모든 지점의 계정 생성
     * ⚠️ 로컬 개발 환경에서만 동작
     */
    @PostMapping("/create-branch-accounts")
    public ResponseEntity<Map<String, Object>> createAllBranchAccounts() {
        // 운영 환경에서 실행 방지
        if (!isDev && !"local".equals(activeProfile)) {
            return ResponseEntity.status(403)
                .body(Map.of("error", "이 API는 로컬 개발 환경에서만 사용할 수 있습니다."));
        }
        
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
     * ⚠️ 로컬 개발 환경에서만 동작
     */
    @PostMapping("/create-branch-account/{branchCode}")
    public ResponseEntity<Map<String, Object>> createBranchAccount(@PathVariable String branchCode) {
        // 운영 환경에서 실행 방지
        if (!isDev && !"local".equals(activeProfile)) {
            return ResponseEntity.status(403)
                .body(Map.of("error", "이 API는 로컬 개발 환경에서만 사용할 수 있습니다."));
        }
        
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
     * ⚠️ 로컬 개발 환경에서만 동작
     */
    @PostMapping("/insert-activity-samples")
    public ResponseEntity<Map<String, Object>> insertActivitySamples() {
        // 운영 환경에서 실행 방지
        if (!isDev && !"local".equals(activeProfile)) {
            return ResponseEntity.status(403)
                .body(Map.of("error", "이 API는 로컬 개발 환경에서만 사용할 수 있습니다."));
        }
        
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
    
    /**
     * 각 지점별 지점수퍼관리자 생성 (로컬 테스트용)
     * ⚠️ 로컬 개발 환경에서만 동작
     */
    @PostMapping("/create-branch-super-admins")
    public ResponseEntity<Map<String, Object>> createBranchSuperAdmins() {
        // 운영 환경에서 실행 방지
        if (!isDev && !"local".equals(activeProfile)) {
            return ResponseEntity.status(403)
                .body(Map.of("error", "이 API는 로컬 개발 환경에서만 사용할 수 있습니다."));
        }
        
        try {
            Map<String, Object> response = new HashMap<>();
            
            // 각 지점별 지점수퍼관리자 생성
            String[][] branchAdmins = {
                {"GANGNAM", "gangnam_admin@mindgarden.com", "강남점 관리자", "010-1111-2222", "서울특별시 강남구 테헤란로 123"},
                {"HONGDAE", "hongdae_admin@mindgarden.com", "홍대점 관리자", "010-2222-3333", "서울특별시 마포구 홍익로 456"},
                {"JAMSIL", "jamsil_admin@mindgarden.com", "잠실점 관리자", "010-3333-4444", "서울특별시 송파구 올림픽로 789"},
                {"SINCHON", "sinchon_admin@mindgarden.com", "신촌점 관리자", "010-4444-5555", "서울특별시 서대문구 신촌로 101"},
                {"inchen_songdo", "songdo_admin@mindgarden.com", "인천송도점 관리자", "010-5555-6666", "인천광역시 연수구 송도과학로 202"}
            };
            
            int createdCount = 0;
            for (String[] admin : branchAdmins) {
                String branchCode = admin[0];
                String email = admin[1];
                String name = admin[2];
                String phone = admin[3];
                String address = admin[4];
                
                // 이미 존재하는지 확인
                if (userRepository.findByEmail(email).isEmpty()) {
                    User branchAdmin = User.builder()
                        .username(email) // username은 email과 동일하게 설정
                        .email(email)
                        .password("$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iKyVhQrF0yP/8KzqKzqKzqKzqKzq") // password: branch123
                        .name(name)
                        .role(UserRole.BRANCH_SUPER_ADMIN)
                        .grade("SUPER_ADMIN")
                        .branchCode(branchCode)
                        .phone(phone)
                        .address(address)
                        .isActive(true)
                        .build();
                    
                    userRepository.save(branchAdmin);
                    createdCount++;
                }
            }
            
            response.put("success", true);
            response.put("message", "지점수퍼관리자 " + createdCount + "명이 생성되었습니다.");
            response.put("count", createdCount);
            response.put("passwords", "모든 계정의 비밀번호는 'branch123'입니다.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "지점수퍼관리자 생성 중 오류가 발생했습니다: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 지점수퍼관리자 목록 조회
     * ⚠️ 로컬 개발 환경에서만 동작
     */
    @GetMapping("/branch-super-admins")
    public ResponseEntity<Map<String, Object>> getBranchSuperAdmins() {
        // 운영 환경에서 실행 방지
        if (!isDev && !"local".equals(activeProfile)) {
            return ResponseEntity.status(403)
                .body(Map.of("error", "이 API는 로컬 개발 환경에서만 사용할 수 있습니다."));
        }
        
        try {
            Map<String, Object> response = new HashMap<>();
            
            var branchAdmins = userRepository.findByRole(UserRole.BRANCH_SUPER_ADMIN);
            
            response.put("success", true);
            response.put("data", branchAdmins);
            response.put("count", branchAdmins.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "지점수퍼관리자 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
}

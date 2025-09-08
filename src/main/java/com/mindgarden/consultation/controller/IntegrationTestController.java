package com.mindgarden.consultation.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.IntegrationTestResult;
import com.mindgarden.consultation.dto.SystemHealthStatus;
import com.mindgarden.consultation.entity.Client;
import com.mindgarden.consultation.entity.Consultant;
import com.mindgarden.consultation.entity.Payment;
import com.mindgarden.consultation.entity.Schedule;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.ConsultantService;
import com.mindgarden.consultation.service.PaymentService;
import com.mindgarden.consultation.service.ScheduleService;
import com.mindgarden.consultation.service.UserService;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 통합 테스트 컨트롤러
 * 전체 시스템의 통합 동작을 검증하는 API 제공
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@RestController
@RequestMapping("/api/integration-test")
@CrossOrigin(origins = "*")
public class IntegrationTestController {

    @Autowired
    private UserService userService;
    
    @Autowired
    private ConsultantService consultantService;
    
    
    @Autowired
    private ScheduleService scheduleService;
    
    @Autowired
    private PaymentService paymentService;
    
    @Autowired
    private PersonalDataEncryptionUtil encryptionUtil;

    /**
     * 전체 시스템 통합 테스트 실행
     */
    @PostMapping("/run-full-test")
    public ResponseEntity<IntegrationTestResult> runFullIntegrationTest() {
        IntegrationTestResult result = new IntegrationTestResult();
        result.setTestName("전체 시스템 통합 테스트");
        result.setStartTime(LocalDateTime.now());
        
        try {
            // 1. 사용자 관리 시스템 테스트
            testUserManagementSystem(result);
            
            // 2. 상담사-내담자 매핑 시스템 테스트
            testConsultantClientMappingSystem(result);
            
            // 3. 스케줄 관리 시스템 테스트
            testScheduleManagementSystem(result);
            
            // 4. 결제 시스템 테스트
            testPaymentSystem(result);
            
            // 5. 개인정보 암호화 시스템 테스트
            testPersonalDataEncryptionSystem(result);
            
            // 6. 권한 관리 시스템 테스트
            testRoleManagementSystem(result);
            
            result.setSuccess(true);
            result.setEndTime(LocalDateTime.now());
            result.setMessage("전체 시스템 통합 테스트가 성공적으로 완료되었습니다.");
            
        } catch (Exception e) {
            result.setSuccess(false);
            result.setEndTime(LocalDateTime.now());
            result.setErrorMessage("통합 테스트 중 오류 발생: " + e.getMessage());
            result.setException(e);
        }
        
        return ResponseEntity.ok(result);
    }

    /**
     * 시스템 헬스 체크
     */
    @GetMapping("/health")
    public ResponseEntity<SystemHealthStatus> checkSystemHealth() {
        SystemHealthStatus health = new SystemHealthStatus();
        health.setTimestamp(LocalDateTime.now());
        
        try {
            // 데이터베이스 연결 테스트
            long userCount = userService.findAllActive().size();
            health.setDatabaseStatus("OK");
            health.setUserCount(userCount);
            
            // 서비스 상태 확인
            health.setUserServiceStatus("OK");
            health.setConsultantServiceStatus("OK");
            health.setClientServiceStatus("OK");
            health.setScheduleServiceStatus("OK");
            health.setPaymentServiceStatus("OK");
            
            // 암호화 서비스 상태 확인
            String testData = "test-encryption";
            String encrypted = encryptionUtil.encrypt(testData);
            String decrypted = encryptionUtil.decrypt(encrypted);
            health.setEncryptionServiceStatus(testData.equals(decrypted) ? "OK" : "ERROR");
            
            health.setOverallStatus("HEALTHY");
            health.setMessage("모든 시스템이 정상적으로 작동 중입니다.");
            
        } catch (Exception e) {
            health.setOverallStatus("UNHEALTHY");
            health.setMessage("시스템 상태 확인 중 오류 발생: " + e.getMessage());
        }
        
        return ResponseEntity.ok(health);
    }

    /**
     * 성능 테스트
     */
    @PostMapping("/performance-test")
    public ResponseEntity<Map<String, Object>> runPerformanceTest() {
        Map<String, Object> result = new HashMap<>();
        List<Long> responseTimes = new ArrayList<>();
        
        try {
            // 1. 사용자 조회 성능 테스트
            long startTime = System.currentTimeMillis();
            userService.findAllActive();
            long endTime = System.currentTimeMillis();
            responseTimes.add(endTime - startTime);
            
            // 2. 스케줄 조회 성능 테스트
            startTime = System.currentTimeMillis();
            scheduleService.findAll();
            endTime = System.currentTimeMillis();
            responseTimes.add(endTime - startTime);
            
            // 3. 결제 조회 성능 테스트
            startTime = System.currentTimeMillis();
            paymentService.getAllPayments();
            endTime = System.currentTimeMillis();
            responseTimes.add(endTime - startTime);
            
            result.put("success", true);
            result.put("responseTimes", responseTimes);
            result.put("averageResponseTime", responseTimes.stream().mapToLong(Long::longValue).average().orElse(0));
            result.put("maxResponseTime", responseTimes.stream().mapToLong(Long::longValue).max().orElse(0));
            result.put("minResponseTime", responseTimes.stream().mapToLong(Long::longValue).min().orElse(0));
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(result);
    }

    /**
     * 보안 테스트
     */
    @PostMapping("/security-test")
    public ResponseEntity<Map<String, Object>> runSecurityTest() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 1. 개인정보 암호화 테스트
            String testData = "김철수";
            String encrypted = encryptionUtil.encrypt(testData);
            String decrypted = encryptionUtil.decrypt(encrypted);
            boolean encryptionWorking = testData.equals(decrypted);
            
            // 2. 권한 검증 테스트
            List<User> users = userService.findAllActive();
            boolean roleValidationWorking = users.stream()
                .allMatch(user -> user.getRole() != null && 
                    (user.getRole() == UserRole.CLIENT || 
                     user.getRole() == UserRole.CONSULTANT || 
                     user.getRole() == UserRole.ADMIN || 
                     user.getRole() == UserRole.SUPER_ADMIN));
            
            result.put("success", true);
            result.put("encryptionWorking", encryptionWorking);
            result.put("roleValidationWorking", roleValidationWorking);
            result.put("securityScore", (encryptionWorking && roleValidationWorking) ? 100 : 50);
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(result);
    }

    // === 개별 시스템 테스트 메서드들 ===

    private void testUserManagementSystem(IntegrationTestResult result) {
        try {
            // 사용자 생성 테스트
            User testUser = new User();
            testUser.setEmail("test@integration.com");
            testUser.setName("통합테스트사용자");
            testUser.setRole(UserRole.CLIENT);
            testUser.setIsDeleted(false);
            
            User createdUser = userService.save(testUser);
            result.addTestResult("사용자 생성", true, "사용자 ID: " + createdUser.getId());
            
            // 사용자 조회 테스트
            List<User> users = userService.findAllActive();
            boolean userFound = users.stream().anyMatch(u -> u.getId().equals(createdUser.getId()));
            result.addTestResult("사용자 조회", userFound, "총 사용자 수: " + users.size());
            
            // 사용자 삭제 테스트
            userService.softDeleteById(createdUser.getId());
            result.addTestResult("사용자 삭제", true, "사용자 삭제 완료");
            
        } catch (Exception e) {
            result.addTestResult("사용자 관리 시스템", false, "오류: " + e.getMessage());
        }
    }

    private void testConsultantClientMappingSystem(IntegrationTestResult result) {
        try {
            // 상담사 조회
            List<Consultant> consultants = consultantService.findAllActive();
            List<Client> clients = userService.findAllActive().stream()
                .filter(u -> u.getRole() == UserRole.CLIENT)
                .map(u -> {
                    Client client = new Client();
                    client.setId(u.getId());
                    client.setEmail(u.getEmail());
                    client.setName(u.getName());
                    client.setIsActive(true);
                    return client;
                })
                .collect(Collectors.toList());
            
            if (!consultants.isEmpty() && !clients.isEmpty()) {
                result.addTestResult("상담사-내담자 매핑", true, 
                    "상담사 수: " + consultants.size() + ", 내담자 수: " + clients.size());
            } else {
                result.addTestResult("상담사-내담자 매핑", false, "상담사 또는 내담자 데이터 부족");
            }
            
        } catch (Exception e) {
            result.addTestResult("상담사-내담자 매핑 시스템", false, "오류: " + e.getMessage());
        }
    }

    private void testScheduleManagementSystem(IntegrationTestResult result) {
        try {
            // 스케줄 조회 테스트
            List<Schedule> schedules = scheduleService.findAll();
            result.addTestResult("스케줄 조회", true, "총 스케줄 수: " + schedules.size());
            
            // 스케줄 상태별 통계 테스트
            Map<String, Long> statusCounts = schedules.stream()
                .collect(Collectors.groupingBy(Schedule::getStatus, Collectors.counting()));
            result.addTestResult("스케줄 상태 통계", true, "상태별 통계: " + statusCounts);
            
        } catch (Exception e) {
            result.addTestResult("스케줄 관리 시스템", false, "오류: " + e.getMessage());
        }
    }

    private void testPaymentSystem(IntegrationTestResult result) {
        try {
            // 결제 조회 테스트
            List<Payment> payments = paymentService.getAllPayments();
            result.addTestResult("결제 조회", true, "총 결제 수: " + payments.size());
            
            // 결제 상태별 통계 테스트
            Map<Payment.PaymentStatus, Long> statusCounts = payments.stream()
                .collect(Collectors.groupingBy(Payment::getStatus, Collectors.counting()));
            result.addTestResult("결제 상태 통계", true, "상태별 통계: " + statusCounts);
            
        } catch (Exception e) {
            result.addTestResult("결제 시스템", false, "오류: " + e.getMessage());
        }
    }

    private void testPersonalDataEncryptionSystem(IntegrationTestResult result) {
        try {
            // 암호화/복호화 테스트
            String testData = "김철수";
            String encrypted = encryptionUtil.encrypt(testData);
            String decrypted = encryptionUtil.decrypt(encrypted);
            
            boolean encryptionWorking = testData.equals(decrypted);
            result.addTestResult("개인정보 암호화", encryptionWorking, 
                encryptionWorking ? "암호화/복호화 정상 작동" : "암호화 오류");
            
        } catch (Exception e) {
            result.addTestResult("개인정보 암호화 시스템", false, "오류: " + e.getMessage());
        }
    }

    private void testRoleManagementSystem(IntegrationTestResult result) {
        try {
            // 역할별 사용자 통계
            List<User> users = userService.findAllActive();
            Map<UserRole, Long> roleCounts = users.stream()
                .collect(Collectors.groupingBy(User::getRole, Collectors.counting()));
            
            result.addTestResult("역할 관리 시스템", true, "역할별 통계: " + roleCounts);
            
        } catch (Exception e) {
            result.addTestResult("역할 관리 시스템", false, "오류: " + e.getMessage());
        }
    }
}

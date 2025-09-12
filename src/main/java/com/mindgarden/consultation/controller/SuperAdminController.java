package com.mindgarden.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.SuperAdminCreateRequest;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.SuperAdminService;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 수퍼어드민 전용 컨트롤러
 * - 수퍼어드민 계정 생성
 * - 수퍼어드민 권한 관리
 * - 시스템 관리 기능
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */
@Slf4j
@RestController
@RequestMapping("/api/super-admin")
@RequiredArgsConstructor
public class SuperAdminController {
    
    private final SuperAdminService superAdminService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PersonalDataEncryptionUtil encryptionUtil;
    
    /**
     * 수퍼어드민 계정 생성
     * 
     * @param request 수퍼어드민 생성 요청
     * @param session HTTP 세션
     * @return 생성 결과
     */
    @PostMapping("/create")
    public ResponseEntity<?> createSuperAdmin(
            @Valid @RequestBody SuperAdminCreateRequest request,
            HttpSession session) {
        
        try {
            // 현재 사용자가 수퍼어드민인지 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || (!currentUser.getRole().equals(UserRole.HQ_MASTER.getValue()) && !currentUser.getRole().equals(UserRole.HQ_MASTER.getValue()))) {
                log.warn("수퍼어드민 계정 생성 권한 없음: {}", currentUser != null ? currentUser.getEmail() : "null");
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "수퍼어드민 권한이 필요합니다."));
            }
            
            // 이메일 중복 확인
            if (userRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "이미 존재하는 이메일입니다."));
            }
            
            // 사용자명 중복 확인
            if (userRepository.existsByUsername(request.getUsername())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "이미 존재하는 사용자명입니다."));
            }
            
            // 수퍼어드민 계정 생성 (현재 사용자의 지점코드 전달)
            User superAdmin = superAdminService.createSuperAdmin(request, currentUser);
            
            log.info("수퍼어드민 계정 생성 완료: {}", superAdmin.getEmail());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "수퍼어드민 계정이 성공적으로 생성되었습니다.");
            response.put("data", Map.of(
                "id", superAdmin.getId(),
                "email", superAdmin.getEmail(),
                "username", superAdmin.getUsername(),
                "role", superAdmin.getRole(),
                "createdAt", superAdmin.getCreatedAt()
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("수퍼어드민 계정 생성 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "계정 생성 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 수퍼어드민 권한 확인
     * 
     * @param session HTTP 세션
     * @return 권한 확인 결과
     */
    @GetMapping("/check-permission")
    public ResponseEntity<?> checkSuperAdminPermission(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
            }
            
            boolean isSuperAdmin = currentUser.getRole().equals(UserRole.HQ_MASTER.getValue()) || currentUser.getRole().equals(UserRole.HQ_MASTER.getValue());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("isSuperAdmin", isSuperAdmin);
            response.put("role", currentUser.getRole());
            response.put("message", isSuperAdmin ? "수퍼어드민 권한이 있습니다." : "수퍼어드민 권한이 없습니다.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("수퍼어드민 권한 확인 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "권한 확인 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 수퍼어드민 목록 조회
     * 
     * @param session HTTP 세션
     * @return 수퍼어드민 목록
     */
    @GetMapping("/list")
    public ResponseEntity<?> getSuperAdminList(HttpSession session) {
        try {
            // 현재 사용자가 수퍼어드민인지 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || (!currentUser.getRole().equals(UserRole.HQ_MASTER.getValue()) && !currentUser.getRole().equals(UserRole.HQ_MASTER.getValue()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "수퍼어드민 권한이 필요합니다."));
            }
            
            return superAdminService.getSuperAdminList();
            
        } catch (Exception e) {
            log.error("수퍼어드민 목록 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "목록 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 재무 대시보드 데이터 조회
     * 
     * @param session HTTP 세션
     * @return 재무 대시보드 데이터
     */
    @GetMapping("/finance/dashboard")
    public ResponseEntity<?> getFinanceDashboard(HttpSession session) {
        try {
            // 수퍼어드민 권한 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || (!UserRole.HQ_MASTER.equals(currentUser.getRole()) && !UserRole.HQ_MASTER.equals(currentUser.getRole()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "수퍼어드민 권한이 필요합니다."));
            }
            
            log.info("재무 대시보드 데이터 조회 요청: {}", currentUser.getEmail());
            
            // TODO: 실제 재무 데이터 조회 로직 구현
            // 현재는 테스트용 데이터 반환
            Map<String, Object> financeData = new HashMap<>();
            
            // 기본 통계
            financeData.put("totalRevenue", 12500000);
            financeData.put("totalExpenses", 8500000);
            financeData.put("netProfit", 4000000);
            
            // 월별 수익 데이터
            Map<String, Object>[] monthlyRevenue = new Map[6];
            for (int i = 0; i < 6; i++) {
                Map<String, Object> monthData = new HashMap<>();
                monthData.put("month", (i + 1) + "월");
                monthData.put("revenue", 1200000 + (i * 200000));
                monthData.put("expenses", 800000 + (i * 100000));
                monthlyRevenue[i] = monthData;
            }
            financeData.put("monthlyRevenue", monthlyRevenue);
            
            // 결제 통계
            Map<String, Object> paymentStats = new HashMap<>();
            paymentStats.put("totalPayments", 156);
            paymentStats.put("pendingPayments", 12);
            paymentStats.put("completedPayments", 140);
            paymentStats.put("failedPayments", 4);
            financeData.put("paymentStats", paymentStats);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "재무 대시보드 데이터를 성공적으로 조회했습니다.");
            response.put("data", financeData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("재무 대시보드 데이터 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "재무 데이터 조회 중 오류가 발생했습니다."));
        }
    }
}

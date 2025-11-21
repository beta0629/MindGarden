package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.SuperAdminCreateRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.FinancialTransactionService;
import com.coresolution.consultation.service.SuperAdminService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
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
public class SuperAdminController extends BaseApiController {
    
    private final SuperAdminService superAdminService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FinancialTransactionService financialTransactionService;
    private final DynamicPermissionService dynamicPermissionService;
    private final PersonalDataEncryptionUtil encryptionUtil;
    
    /**
     * 수퍼어드민 계정 생성
     * 
     * @param request 수퍼어드민 생성 요청
     * @param session HTTP 세션
     * @return 생성 결과
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createSuperAdmin(
            @Valid @RequestBody SuperAdminCreateRequest request,
            HttpSession session) {
        
        // 현재 사용자가 수퍼어드민인지 확인
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || (!currentUser.getRole().equals(UserRole.HQ_MASTER.getValue()) && !currentUser.getRole().equals(UserRole.HQ_MASTER.getValue()))) {
            log.warn("수퍼어드민 계정 생성 권한 없음: {}", currentUser != null ? currentUser.getEmail() : "null");
            throw new RuntimeException("수퍼어드민 권한이 필요합니다.");
        }
        
        // 이메일 중복 확인
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("이미 존재하는 이메일입니다.");
        }
        
        // 사용자명 중복 확인
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("이미 존재하는 사용자명입니다.");
        }
        
        // 수퍼어드민 계정 생성 (현재 사용자의 지점코드 전달)
        User superAdmin = superAdminService.createSuperAdmin(request, currentUser);
        
        log.info("수퍼어드민 계정 생성 완료: {}", superAdmin.getEmail());
        
        Map<String, Object> data = new HashMap<>();
        data.put("id", superAdmin.getId());
        data.put("email", superAdmin.getEmail());
        data.put("username", superAdmin.getUsername());
        data.put("role", superAdmin.getRole());
        data.put("createdAt", superAdmin.getCreatedAt());
        
        return created("수퍼어드민 계정이 성공적으로 생성되었습니다.", data);
    }
    
    /**
     * 수퍼어드민 권한 확인
     * 
     * @param session HTTP 세션
     * @return 권한 확인 결과
     */
    @GetMapping("/check-permission")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkSuperAdminPermission(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        
        boolean isSuperAdmin = currentUser.getRole().equals(UserRole.HQ_MASTER.getValue()) || currentUser.getRole().equals(UserRole.HQ_MASTER.getValue());
        
        Map<String, Object> data = new HashMap<>();
        data.put("isSuperAdmin", isSuperAdmin);
        data.put("role", currentUser.getRole());
        
        String message = isSuperAdmin ? "수퍼어드민 권한이 있습니다." : "수퍼어드민 권한이 없습니다.";
        
        return success(message, data);
    }
    
    /**
     * 수퍼어드민 목록 조회
     * 
     * @param session HTTP 세션
     * @return 수퍼어드민 목록
     */
    @GetMapping("/list")
    public ResponseEntity<?> getSuperAdminList(HttpSession session) {
        // 현재 사용자가 수퍼어드민인지 확인
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || (!currentUser.getRole().equals(UserRole.HQ_MASTER.getValue()) && !currentUser.getRole().equals(UserRole.HQ_MASTER.getValue()))) {
            throw new RuntimeException("수퍼어드민 권한이 필요합니다.");
        }
        
        return superAdminService.getSuperAdminList();
    }
    
    /**
     * 재무 대시보드 데이터 조회
     * 
     * @param session HTTP 세션
     * @return 재무 대시보드 데이터
     */
    @GetMapping("/finance/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFinanceDashboard(HttpSession session) {
        // 수퍼어드민 권한 확인
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || (!UserRole.HQ_MASTER.equals(currentUser.getRole()) && !UserRole.HQ_MASTER.equals(currentUser.getRole()))) {
            throw new RuntimeException("수퍼어드민 권한이 필요합니다.");
        }
        
        log.info("재무 대시보드 데이터 조회 요청: {}", currentUser.getEmail());
        
        // 실제 재무 데이터 조회 로직 구현
        Map<String, Object> financeData = new HashMap<>();
        
        try {
            // 재무 대시보드 데이터 조회 (현재 월 기준)
            java.time.LocalDate startDate = java.time.LocalDate.now().withDayOfMonth(1);
            java.time.LocalDate endDate = java.time.LocalDate.now();
            var dashboardData = financialTransactionService.getFinancialDashboard(startDate, endDate);
            
            // 기본 통계 (실제 데이터 사용)
            financeData.put("totalRevenue", dashboardData.getTotalIncome());
            financeData.put("totalExpenses", dashboardData.getTotalExpense());
            financeData.put("netProfit", dashboardData.getNetProfit());
            
            // 추가 재무 데이터
            financeData.put("monthlyRevenue", dashboardData.getMonthlyData());
            financeData.put("monthlyExpenses", dashboardData.getMonthlyData());
            financeData.put("revenueByCategory", dashboardData.getIncomeByCategory());
            financeData.put("expenseByCategory", dashboardData.getExpenseByCategory());
            
            log.info("✅ 재무 대시보드 데이터 조회 성공 - 총 수익: {}, 총 지출: {}, 순이익: {}", 
                    dashboardData.getTotalIncome(), dashboardData.getTotalExpense(), dashboardData.getNetProfit());
                    
        } catch (Exception e) {
            log.error("❌ 재무 데이터 조회 중 오류 발생: {}", e.getMessage(), e);
            
            // 오류 발생 시 기본값으로 폴백
            financeData.put("totalRevenue", 0);
            financeData.put("totalExpenses", 0);
            financeData.put("netProfit", 0);
            financeData.put("monthlyRevenue", new Object[0]);
            financeData.put("monthlyExpenses", new Object[0]);
            financeData.put("revenueByCategory", new Object[0]);
            financeData.put("expenseByCategory", new Object[0]);
        }
        
        return success("재무 대시보드 데이터를 성공적으로 조회했습니다.", financeData);
    }
}

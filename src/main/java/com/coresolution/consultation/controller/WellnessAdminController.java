package com.coresolution.consultation.controller;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.entity.OpenAIUsageLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.WellnessTemplate;
import com.coresolution.consultation.repository.OpenAIUsageLogRepository;
import com.coresolution.consultation.scheduler.WellnessNotificationScheduler;
import com.coresolution.consultation.service.ExchangeRateService;
import com.coresolution.consultation.service.OpenAIWellnessService;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.service.WellnessTemplateService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
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
 * 웰니스 알림 관리 컨트롤러
 * - 관리자 전용 (BRANCH_ADMIN 이상)
 * - 템플릿 관리, 테스트 발송, 비용 통계
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-21
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/wellness")
@RequiredArgsConstructor
public class WellnessAdminController extends BaseApiController {
    
    private final WellnessTemplateService wellnessTemplateService;
    private final WellnessNotificationScheduler wellnessNotificationScheduler;
    private final OpenAIUsageLogRepository usageLogRepository;
    private final SystemConfigService systemConfigService;
    private final ExchangeRateService exchangeRateService;
    
    /**
     * 권한 체크: BRANCH_ADMIN 이상
     */
    private boolean hasAdminPermission(User user) {
        if (user == null) {
            return false;
        }
        try {
            // UserRole의 isAdmin() 메서드 사용 (동적 권한 확인)
            return user.getRole().isAdmin();
        } catch (Exception e) {
            log.error("❌ 권한 확인 실패", e);
            return false;
        }
    }
    
    /**
     * 웰니스 알림 테스트 발송
     * - 즉시 웰니스 알림 생성 및 발송
     */
    @PostMapping("/test-send")
    public ResponseEntity<ApiResponse<Void>> testSendWellness(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (!hasAdminPermission(currentUser)) {
            throw new RuntimeException("권한이 없습니다.");
        }
        
        log.info("💚 웰니스 알림 테스트 발송 시작 - 요청자: {}", currentUser.getName());
        
        // 스케줄러 메서드 직접 호출
        wellnessNotificationScheduler.sendDailyWellnessTip();
        
        return success("웰니스 알림 테스트 발송이 완료되었습니다.");
    }
    
    /**
     * 웰니스 템플릿 목록 조회
     */
    @GetMapping("/templates")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTemplates(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (!hasAdminPermission(currentUser)) {
            throw new RuntimeException("권한이 없습니다.");
        }
        
        List<WellnessTemplate> templates = wellnessTemplateService.getAllActiveTemplates();
        
        List<Map<String, Object>> templateList = templates.stream().map(template -> {
            Map<String, Object> data = new HashMap<>();
            data.put("id", template.getId());
            data.put("title", template.getTitle());
            data.put("category", template.getCategory());
            data.put("dayOfWeek", template.getDayOfWeek());
            data.put("season", template.getSeason());
            data.put("isImportant", template.getIsImportant());
            data.put("usageCount", template.getUsageCount());
            data.put("lastUsedAt", template.getLastUsedAt());
            data.put("createdBy", template.getCreatedBy());
            data.put("createdAt", template.getCreatedAt());
            return data;
        }).collect(Collectors.toList());
        
        Map<String, Object> data = new HashMap<>();
        data.put("templates", templateList);
        data.put("total", templateList.size());
        
        return success(data);
    }
    
    /**
     * 웰니스 템플릿 상세 조회
     */
    @GetMapping("/templates/{id}")
    public ResponseEntity<ApiResponse<String>> getTemplateDetail(@PathVariable Long id, HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (!hasAdminPermission(currentUser)) {
            throw new RuntimeException("권한이 없습니다.");
        }
        
        // TODO: 템플릿 상세 조회 로직 추가
        
        return success("템플릿 상세 조회 (구현 예정)");
    }
    
    /**
     * API 사용 통계 조회
     */
    @GetMapping("/usage-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUsageStats(
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String month,
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (!hasAdminPermission(currentUser)) {
            throw new RuntimeException("권한이 없습니다.");
        }
        
        // 기본값: 이번 달
        YearMonth targetMonth = (year != null && month != null) 
            ? YearMonth.of(Integer.parseInt(year), Integer.parseInt(month))
            : YearMonth.now();
        
        LocalDateTime startDate = targetMonth.atDay(1).atStartOfDay();
        LocalDateTime endDate = targetMonth.atEndOfMonth().atTime(23, 59, 59);
        
        // 월별 통계 계산
        Double totalCostUSD = usageLogRepository.calculateMonthlyCost(startDate, endDate);
        Long totalTokens = usageLogRepository.calculateMonthlyTokens(startDate, endDate);
        Long totalRequests = usageLogRepository.countMonthlyRequests(startDate, endDate);
        
        // 실시간 환율 조회
        Double USD_TO_KRW_RATE = exchangeRateService.getUsdToKrwRate();
        Double totalCostKRW = totalCostUSD != null ? totalCostUSD * USD_TO_KRW_RATE : 0.0;
        
        // 소수점 2자리까지 표시 (원 단위)
        Double totalCostKRWRounded = totalCostKRW != null ? 
            Math.round(totalCostKRW * 100.0) / 100.0 : 0.0;
        
        // 최근 로그
        List<OpenAIUsageLog> recentLogs = usageLogRepository.findTop10ByOrderByCreatedAtDesc();
        
        List<Map<String, Object>> logList = recentLogs.stream().map(log -> {
            Map<String, Object> data = new HashMap<>();
            data.put("id", log.getId());
            data.put("requestType", log.getRequestType());
            data.put("model", log.getModel());
            data.put("totalTokens", log.getTotalTokens());
            data.put("estimatedCostUSD", log.getEstimatedCost());
            data.put("estimatedCostKRW", log.getEstimatedCost() != null ? 
                Math.round(log.getEstimatedCost() * USD_TO_KRW_RATE * 100.0) / 100.0 : 0.0);
            data.put("costDisplay", log.getEstimatedCost() != null ? 
                String.format("$%.6f (₩%.2f)", log.getEstimatedCost(), 
                    Math.round(log.getEstimatedCost() * USD_TO_KRW_RATE * 100.0) / 100.0) : "$0.000000 (₩0.00)");
            data.put("isSuccess", log.getIsSuccess());
            data.put("responseTimeMs", log.getResponseTimeMs());
            data.put("requestedBy", log.getRequestedBy());
            data.put("createdAt", log.getCreatedAt());
            return data;
        }).collect(Collectors.toList());
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("year", targetMonth.getYear());
        stats.put("month", targetMonth.getMonthValue());
        stats.put("totalCostUSD", totalCostUSD);
        stats.put("totalCostKRW", totalCostKRWRounded);
        stats.put("totalCostDisplay", String.format("$%.6f (₩%.2f)", 
            totalCostUSD != null ? totalCostUSD : 0.0, totalCostKRWRounded));
        stats.put("exchangeRate", USD_TO_KRW_RATE);
        stats.put("exchangeRateDisplay", String.format("1 USD = %.2f KRW", USD_TO_KRW_RATE));
        stats.put("totalTokens", totalTokens);
        stats.put("totalRequests", totalRequests);
        stats.put("recentLogs", logList);
        
        return success(stats);
    }
    
    /**
     * 환율 설정 조회
     */
    @GetMapping("/exchange-rate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExchangeRate(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (!hasAdminPermission(currentUser)) {
            throw new RuntimeException("권한이 없습니다.");
        }
        
        Double exchangeRate = exchangeRateService.getUsdToKrwRate();
        String lastUpdateTime = exchangeRateService.getLastUpdateTime();
        
        Map<String, Object> data = new HashMap<>();
        data.put("exchangeRate", exchangeRate);
        data.put("exchangeRateDisplay", String.format("1 USD = %.2f KRW", exchangeRate));
        data.put("lastUpdateTime", lastUpdateTime);
        
        return success(data);
    }
    
    /**
     * 환율 설정 변경
     */
    @PostMapping("/exchange-rate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> setExchangeRate(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (!hasAdminPermission(currentUser)) {
            throw new RuntimeException("권한이 없습니다.");
        }
        
        Double newRate = Double.parseDouble(request.get("exchangeRate").toString());
        if (newRate <= 0) {
            throw new RuntimeException("환율은 0보다 커야 합니다.");
        }
        
        systemConfigService.setUsdToKrwRate(newRate);
        
        log.info("환율 설정 변경: {} -> {} (사용자: {})", 
            systemConfigService.getUsdToKrwRate(), newRate, currentUser.getName());
        
        Map<String, Object> data = new HashMap<>();
        data.put("exchangeRate", newRate);
        data.put("exchangeRateDisplay", String.format("1 USD = %.2f KRW", newRate));
        
        return updated("환율이 성공적으로 변경되었습니다.", data);
    }
    
    /**
     * 환율 새로고침
     */
    @PostMapping("/exchange-rate/refresh")
    public ResponseEntity<ApiResponse<Map<String, Object>>> refreshExchangeRate(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (!hasAdminPermission(currentUser)) {
            throw new RuntimeException("권한이 없습니다.");
        }
        
        Double newRate = exchangeRateService.refreshExchangeRate();
        String lastUpdateTime = exchangeRateService.getLastUpdateTime();
        
        log.info("환율 새로고침 완료: {} (사용자: {})", newRate, currentUser.getName());
        
        Map<String, Object> data = new HashMap<>();
        data.put("exchangeRate", newRate);
        data.put("exchangeRateDisplay", String.format("1 USD = %.2f KRW", newRate));
        data.put("lastUpdateTime", lastUpdateTime);
        
        return success("환율이 성공적으로 새로고침되었습니다.", data);
    }
    
    /**
     * 템플릿 비활성화
     */
    @PutMapping("/templates/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateTemplate(@PathVariable Long id, HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (!hasAdminPermission(currentUser)) {
            throw new RuntimeException("권한이 없습니다.");
        }
        
        wellnessTemplateService.deactivateTemplate(id);
        
        return success("템플릿이 비활성화되었습니다.");
    }
    
    /**
     * 웰니스 컨텐츠 테스트 생성
     */
    @PostMapping("/test")
    public ResponseEntity<ApiResponse<OpenAIWellnessService.WellnessContent>> testWellnessContent(@RequestBody Map<String, Object> request) {
        Integer dayOfWeek = (Integer) request.getOrDefault("dayOfWeek", 1);
        String season = (String) request.getOrDefault("season", "SPRING");
        String category = (String) request.getOrDefault("category", "MENTAL");
        
        OpenAIWellnessService.WellnessContent content = wellnessTemplateService.generateWellnessContent(dayOfWeek, season, category, "ADMIN_TEST");
        
        return success("테스트 컨텐츠 생성 성공", content);
    }
}


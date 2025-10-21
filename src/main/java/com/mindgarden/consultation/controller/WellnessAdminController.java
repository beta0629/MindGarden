package com.mindgarden.consultation.controller;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.mindgarden.consultation.entity.OpenAIUsageLog;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.WellnessTemplate;
import com.mindgarden.consultation.repository.OpenAIUsageLogRepository;
import com.mindgarden.consultation.scheduler.WellnessNotificationScheduler;
import com.mindgarden.consultation.service.WellnessTemplateService;
import com.mindgarden.consultation.service.OpenAIWellnessService;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
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
public class WellnessAdminController {
    
    private final WellnessTemplateService wellnessTemplateService;
    private final WellnessNotificationScheduler wellnessNotificationScheduler;
    private final OpenAIUsageLogRepository usageLogRepository;
    
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
    public ResponseEntity<?> testSendWellness(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (!hasAdminPermission(currentUser)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "권한이 없습니다."));
            }
            
            log.info("💚 웰니스 알림 테스트 발송 시작 - 요청자: {}", currentUser.getName());
            
            // 스케줄러 메서드 직접 호출
            wellnessNotificationScheduler.sendDailyWellnessTip();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "웰니스 알림 테스트 발송이 완료되었습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 웰니스 알림 테스트 발송 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "테스트 발송 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
    
    /**
     * 웰니스 템플릿 목록 조회
     */
    @GetMapping("/templates")
    public ResponseEntity<?> getTemplates(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (!hasAdminPermission(currentUser)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "권한이 없습니다."));
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
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", templateList,
                "total", templateList.size()
            ));
            
        } catch (Exception e) {
            log.error("❌ 템플릿 목록 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "템플릿 목록 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 웰니스 템플릿 상세 조회
     */
    @GetMapping("/templates/{id}")
    public ResponseEntity<?> getTemplateDetail(@PathVariable Long id, HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (!hasAdminPermission(currentUser)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "권한이 없습니다."));
            }
            
            // TODO: 템플릿 상세 조회 로직 추가
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "템플릿 상세 조회 (구현 예정)"
            ));
            
        } catch (Exception e) {
            log.error("❌ 템플릿 상세 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "템플릿 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * API 사용 통계 조회
     */
    @GetMapping("/usage-stats")
    public ResponseEntity<?> getUsageStats(
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String month,
            HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (!hasAdminPermission(currentUser)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "권한이 없습니다."));
            }
            
            // 기본값: 이번 달
            YearMonth targetMonth = (year != null && month != null) 
                ? YearMonth.of(Integer.parseInt(year), Integer.parseInt(month))
                : YearMonth.now();
            
            LocalDateTime startDate = targetMonth.atDay(1).atStartOfDay();
            LocalDateTime endDate = targetMonth.atEndOfMonth().atTime(23, 59, 59);
            
            // 월별 통계 계산
            Double totalCost = usageLogRepository.calculateMonthlyCost(startDate, endDate);
            Long totalTokens = usageLogRepository.calculateMonthlyTokens(startDate, endDate);
            Long totalRequests = usageLogRepository.countMonthlyRequests(startDate, endDate);
            
            // 최근 로그
            List<OpenAIUsageLog> recentLogs = usageLogRepository.findTop10ByOrderByCreatedAtDesc();
            
            List<Map<String, Object>> logList = recentLogs.stream().map(log -> {
                Map<String, Object> data = new HashMap<>();
                data.put("id", log.getId());
                data.put("requestType", log.getRequestType());
                data.put("model", log.getModel());
                data.put("totalTokens", log.getTotalTokens());
                data.put("estimatedCost", log.getEstimatedCost());
                data.put("isSuccess", log.getIsSuccess());
                data.put("responseTimeMs", log.getResponseTimeMs());
                data.put("requestedBy", log.getRequestedBy());
                data.put("createdAt", log.getCreatedAt());
                return data;
            }).collect(Collectors.toList());
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("year", targetMonth.getYear());
            stats.put("month", targetMonth.getMonthValue());
            stats.put("totalCost", totalCost);
            stats.put("totalTokens", totalTokens);
            stats.put("totalRequests", totalRequests);
            stats.put("recentLogs", logList);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", stats
            ));
            
        } catch (Exception e) {
            log.error("❌ API 사용 통계 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "통계 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 템플릿 비활성화
     */
    @PutMapping("/templates/{id}/deactivate")
    public ResponseEntity<?> deactivateTemplate(@PathVariable Long id, HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (!hasAdminPermission(currentUser)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "권한이 없습니다."));
            }
            
            wellnessTemplateService.deactivateTemplate(id);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "템플릿이 비활성화되었습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 템플릿 비활성화 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "템플릿 비활성화 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 웰니스 컨텐츠 테스트 생성
     */
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> testWellnessContent(@RequestBody Map<String, Object> request) {
        try {
            Integer dayOfWeek = (Integer) request.getOrDefault("dayOfWeek", 1);
            String season = (String) request.getOrDefault("season", "SPRING");
            String category = (String) request.getOrDefault("category", "MENTAL");
            
            OpenAIWellnessService.WellnessContent content = wellnessTemplateService.generateWellnessContent(dayOfWeek, season, category, "ADMIN_TEST");
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", content);
            response.put("message", "테스트 컨텐츠 생성 성공");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("웰니스 컨텐츠 테스트 실패", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "테스트 실패: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
}


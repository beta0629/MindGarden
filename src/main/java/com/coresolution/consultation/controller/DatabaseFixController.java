package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.entity.OpenAIUsageLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.OpenAIUsageLogRepository;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 데이터베이스 수정 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-22
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/admin/database", "/api/admin/database"}) // v1 경로 추가, 레거시 경로 유지
@RequiredArgsConstructor
public class DatabaseFixController extends BaseApiController {
    
    private final OpenAIUsageLogRepository usageLogRepository;
    private final DynamicPermissionService dynamicPermissionService;
    
    /**
     * OpenAI 사용 로그의 estimatedCost null 값 수정
     */
    @PostMapping("/fix-usage-costs")
    public ResponseEntity<ApiResponse<Map<String, Object>>> fixUsageCosts(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        // 동적 권한 확인
        boolean hasPermission = dynamicPermissionService.hasPermission(currentUser, "DATABASE_MANAGE");
        if (!hasPermission) {
            log.warn("⚠️ 권한 없음 - 사용자 ID: {}, 역할: {}", currentUser.getId(), currentUser.getRole());
            throw new org.springframework.security.access.AccessDeniedException("데이터베이스 관리 권한이 필요합니다.");
        }
        
        log.info("🔧 OpenAI 사용 로그 비용 수정 시작 - 사용자: {}", currentUser.getName());
        
        // estimatedCost가 null인 모든 로그 조회
        var nullCostLogs = usageLogRepository.findAll().stream()
            .filter(log -> log.getEstimatedCost() == null)
            .toList();
        
        int fixedCount = 0;
        double totalFixedCost = 0.0;
        
        for (OpenAIUsageLog usageLog : nullCostLogs) {
            // 비용 재계산
            if (usageLog.getPromptTokens() != null && usageLog.getCompletionTokens() != null) {
                double inputCost = (usageLog.getPromptTokens() / 1000.0) * 0.0015;
                double outputCost = (usageLog.getCompletionTokens() / 1000.0) * 0.002;
                double calculatedCost = inputCost + outputCost;
                
                usageLog.setEstimatedCost(calculatedCost);
                usageLogRepository.save(usageLog);
                
                totalFixedCost += calculatedCost;
                fixedCount++;
                
                log.info("💰 로그 ID {} 비용 수정: ${}", usageLog.getId(), 
                    String.format("%.6f", calculatedCost));
            } else {
                // 토큰 정보가 없는 경우 0으로 설정
                usageLog.setEstimatedCost(0.0);
                usageLogRepository.save(usageLog);
                fixedCount++;
            }
        }
        
        log.info("✅ OpenAI 사용 로그 비용 수정 완료 - 수정된 레코드: {}개, 총 비용: ${}", 
            fixedCount, String.format("%.6f", totalFixedCost));
        
        Map<String, Object> data = new HashMap<>();
        data.put("fixedCount", fixedCount);
        data.put("totalFixedCost", String.format("%.6f", totalFixedCost));
        
        return success("사용 로그 비용 수정이 완료되었습니다.", data);
    }
}

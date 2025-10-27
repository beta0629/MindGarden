package com.mindgarden.consultation.controller;

import java.util.Map;
import com.mindgarden.consultation.entity.OpenAIUsageLog;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.OpenAIUsageLogRepository;
import com.mindgarden.consultation.service.DynamicPermissionService;
import com.mindgarden.consultation.utils.SessionUtils;
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
@RequestMapping("/api/admin/database")
@RequiredArgsConstructor
public class DatabaseFixController {
    
    private final OpenAIUsageLogRepository usageLogRepository;
    private final DynamicPermissionService dynamicPermissionService;
    
    /**
     * OpenAI 사용 로그의 estimatedCost null 값 수정
     */
    @PostMapping("/fix-usage-costs")
    public ResponseEntity<?> fixUsageCosts(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 동적 권한 확인
            boolean hasPermission = dynamicPermissionService.hasPermission(currentUser, "DATABASE_MANAGE");
            if (!hasPermission) {
                log.warn("⚠️ 권한 없음 - 사용자 ID: {}, 역할: {}", currentUser.getId(), currentUser.getRole());
                return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "데이터베이스 관리 권한이 필요합니다."
                ));
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
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "사용 로그 비용 수정이 완료되었습니다.",
                "fixedCount", fixedCount,
                "totalFixedCost", String.format("%.6f", totalFixedCost)
            ));
            
        } catch (Exception e) {
            log.error("❌ 사용 로그 비용 수정 실패", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "사용 로그 비용 수정에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}

package com.coresolution.consultation.controller;

import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.ai.AiProviderHealthService;
import com.coresolution.consultation.service.ai.dto.AiProviderHealth;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 어드민 AI 프로바이더 헬스체크 API.
 *
 * <p>기획: {@code docs/project-management/2026-05-23/AI_SSOT_STANDARDIZATION_PLAN.md} §7 Q6
 *
 * @author CoreSolution
 * @since 2026-05-23
 */
@RestController
@RequestMapping("/api/v1/admin/ai")
@RequiredArgsConstructor
public class AdminAiHealthController extends BaseApiController {

    private final AiProviderHealthService healthService;

    /**
     * AI 프로바이더 헬스 상태 조회 — 키 등록 여부만 반환 (키 값 미노출).
     *
     * @param session HTTP 세션
     * @return 헬스 DTO
     */
    @GetMapping("/health")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getHealth(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return unauthorized("로그인이 필요합니다.");
        }
        String tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            return forbidden("테넌트 정보가 없습니다.");
        }
        try {
            TenantContextHolder.setTenantId(tenantId);
            AiProviderHealth health = healthService.checkHealth(tenantId);
            return success(health);
        } finally {
            TenantContextHolder.clear();
        }
    }
}

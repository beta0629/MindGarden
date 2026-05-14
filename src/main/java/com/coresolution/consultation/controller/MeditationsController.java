package com.coresolution.consultation.controller;

import com.coresolution.consultation.constant.HealingContentMediaType;
import com.coresolution.consultation.dto.HealingContentItemResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.HealingContentsCatalogService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Expo 명상 카탈로그 별칭 ({@code GET /api/v1/meditations}).
 *
 * <p><strong>SSOT</strong>: 목록 원천은 {@link HealingContentsCatalogService}와
 * {@code GET /api/v1/healing-contents}가 동일하며, 본 엔드포인트는
 * {@link HealingContentMediaType#MEDITATION} 항목만 필터한 뷰이다.</p>
 *
 * <p>응답 항목 스키마는 {@link HealingContentItemResponse}로 힐링 목록과 동일해
 * Expo {@code meditationCatalogService} 정규화기와 정합한다.</p>
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/meditations")
@RequiredArgsConstructor
public class MeditationsController extends BaseApiController {

    private final HealingContentsCatalogService healingContentsCatalogService;

    /**
     * 내담자 세션 기준 명상(힐링 카탈로그 중 MEDITATION 타입) 목록.
     *
     * @param session HTTP 세션
     * @param size    무시됨 (Expo 호환)
     * @param sort    무시됨 (Expo 호환)
     * @return {@link ApiResponse} 의 {@code data}에 {@link HealingContentItemResponse} 배열
     */
    @GetMapping
    @SuppressWarnings("unused")
    public ResponseEntity<ApiResponse<List<HealingContentItemResponse>>> listMeditations(
            HttpSession session,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        if (currentUser.getRole() == null || !currentUser.getRole().isClient()) {
            log.warn("명상 목록 접근 거부 — 내담자만 허용: userId={}, role={}",
                currentUser.getId(), currentUser.getRole());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("내담자만 이용할 수 있습니다."));
        }
        String tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("테넌트 정보가 없습니다."));
        }

        List<HealingContentItemResponse> items = healingContentsCatalogService.listForClientTenant(tenantId).stream()
            .filter(row -> row.getType() == HealingContentMediaType.MEDITATION)
            .toList();
        log.debug("명상 목록 조회 tenantId={}, count={}", tenantId, items.size());
        return success(items);
    }
}

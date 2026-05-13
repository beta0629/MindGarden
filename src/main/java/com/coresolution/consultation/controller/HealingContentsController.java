package com.coresolution.consultation.controller;

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
 * Expo 네이티브 앱용 힐링 콘텐츠 목록 API ({@code GET /api/v1/healing-contents}).
 * 레거시 {@link HealingContentController}({@code /api/v1/healing})와 병행하며 하위 호환을 유지한다.
 *
 * <p>쿼리 파라미터 {@code size}, {@code sort} 등은 Expo 호환을 위해 허용하나 현재 구현에서는 무시한다.</p>
 *
 * <p><strong>응답 JSON 예시</strong> (성공 시 {@code data}가 배열):</p>
 * <pre>{@code
 * {
 *   "success": true,
 *   "message": null,
 *   "data": [
 *     {
 *       "id": 12,
 *       "title": "오늘의 한마디",
 *       "description": "당신의 속도로 천천히 나아가도 괜찮습니다.",
 *       "category": "GENERAL",
 *       "type": "ARTICLE",
 *       "thumbnailUrl": null,
 *       "contentUrl": null,
 *       "durationMinutes": null
 *     },
 *     {
 *       "id": 9000001,
 *       "title": "호흡과 바디 스캔",
 *       "description": "짧은 가이드 명상으로 긴장을 낮춥니다.",
 *       "category": "RELAXATION",
 *       "type": "MEDITATION",
 *       "thumbnailUrl": null,
 *       "contentUrl": null,
 *       "durationMinutes": 5
 *     }
 *   ],
 *   "timestamp": "2026-05-13T10:00:00"
 * }
 * }</pre>
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/healing-contents")
@RequiredArgsConstructor
public class HealingContentsController extends BaseApiController {

    private final HealingContentsCatalogService healingContentsCatalogService;

    /**
     * 내담자 세션 기준 힐링 콘텐츠 목록 조회.
     *
     * @param session HTTP 세션
     * @param size    무시됨 (Expo 호환)
     * @param sort    무시됨 (Expo 호환)
     * @return {@link ApiResponse} 의 {@code data}에 {@link HealingContentItemResponse} 배열
     */
    @GetMapping
    @SuppressWarnings("unused")
    public ResponseEntity<ApiResponse<List<HealingContentItemResponse>>> listHealingContents(
            HttpSession session,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        if (currentUser.getRole() == null || !currentUser.getRole().isClient()) {
            log.warn("힐링 콘텐츠 목록 접근 거부 — 내담자만 허용: userId={}, role={}",
                currentUser.getId(), currentUser.getRole());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("내담자만 이용할 수 있습니다."));
        }
        String tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("테넌트 정보가 없습니다."));
        }

        List<HealingContentItemResponse> items = healingContentsCatalogService.listForClientTenant(tenantId);
        log.debug("힐링 콘텐츠 목록 조회 tenantId={}, count={}", tenantId, items.size());
        return success(items);
    }
}

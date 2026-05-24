package com.coresolution.consultation.controller;

import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.ai.AiUsageStatsService;
import com.coresolution.consultation.service.ai.dto.AiUsageLogDetailResponse;
import com.coresolution.consultation.service.ai.dto.AiUsageLogResponse;
import com.coresolution.consultation.service.ai.dto.AiUsageStatsResponse;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 어드민 AI 사용 통계·로그 조회 API (AI 프로바이더 관리 페이지 전용).
 *
 * <p>트랙 B PR-4 (2026-05-24): 디자이너 핸드오프 §6 — 통계 대시보드 + 호출 로그 데이터 제공.
 * 권한·테넌트 가드는 {@link AdminAiHealthController} 와 동일 정책 (ADMIN/STAFF + tenantId 필수).</p>
 *
 * <ul>
 *   <li>{@code GET /api/v1/admin/ai/usage-stats?period=today|week|month}</li>
 *   <li>{@code GET /api/v1/admin/ai/usage-logs?provider=&caller=&status=&page=&size=}</li>
 *   <li>{@code GET /api/v1/admin/ai/usage-logs/{id}/detail}</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-05-24
 */
@RestController
@RequestMapping("/api/v1/admin/ai")
@RequiredArgsConstructor
public class AdminAiUsageController extends BaseApiController {

    private static final String DEFAULT_PAGE_SIZE_VALUE = "50";
    private static final int MAX_PAGE_SIZE = 200;

    private final AiUsageStatsService aiUsageStatsService;

    /**
     * AI 사용 통계 조회.
     *
     * <p>응답은 period 라벨과 무관하게 callsToday / callsThisWeek / callsThisMonth 3종을 모두
     * 반환한다. period 라벨은 응답의 {@code requestedPeriod} 필드(legacy: {@code period})로 echo 된다.
     * 후속 PR 에서 period 별 분기를 추가할 때도 backward-compatible 하다.</p>
     *
     * @param period  요청 기간 라벨 (today | week | month). null/blank 시 응답에 "month" 로 echo.
     * @param session HTTP 세션
     * @return 통계 DTO (period 와 무관하게 3종 호출 수 모두 반환 — 클라이언트는 requestedPeriod 로 라벨 식별)
     */
    @GetMapping("/usage-stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getUsageStats(
            @RequestParam(required = false) String period,
            HttpSession session
    ) {
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
            AiUsageStatsResponse stats = aiUsageStatsService.getUsageStats(tenantId, period);
            return success(stats);
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * AI 사용 로그 페이징 조회.
     *
     * @param provider provider 필터 (openai|gemini|claude|replicate) — 옵션
     * @param caller   caller 필터 (wellness|healing|psych 등) — 옵션
     * @param status   상태 필터 (success|failed) — 옵션
     * @param page     0-base 페이지 인덱스
     * @param size     페이지 크기 (1 ~ {@value #MAX_PAGE_SIZE})
     * @param session  HTTP 세션
     * @return 페이징 로그 응답
     */
    @GetMapping("/usage-logs")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getUsageLogs(
            @RequestParam(required = false) String provider,
            @RequestParam(required = false) String caller,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = DEFAULT_PAGE_SIZE_VALUE) int size,
            HttpSession session
    ) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return unauthorized("로그인이 필요합니다.");
        }
        String tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            return forbidden("테넌트 정보가 없습니다.");
        }
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        try {
            TenantContextHolder.setTenantId(tenantId);
            Page<AiUsageLogResponse> result = aiUsageStatsService.getUsageLogs(
                    tenantId, provider, caller, status, pageable
            );
            return success(result);
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * AI 사용 로그 상세 조회 (모달 노출용 전체 본문).
     *
     * @param id      로그 PK
     * @param session HTTP 세션
     */
    @GetMapping("/usage-logs/{id}/detail")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getUsageLogDetail(@PathVariable Long id, HttpSession session) {
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
            return aiUsageStatsService.getLogDetail(tenantId, id)
                    .<ResponseEntity<?>>map(this::success)
                    .orElseGet(() -> notFound("해당 로그를 찾을 수 없습니다."));
        } finally {
            TenantContextHolder.clear();
        }
    }

}

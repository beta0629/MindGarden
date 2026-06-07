package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.PushMonitoringChannelFilter;
import com.coresolution.consultation.dto.PushMonitoringRange;
import com.coresolution.consultation.dto.PushMonitoringResendRequest;
import com.coresolution.consultation.dto.PushMonitoringResendResponse;
import com.coresolution.consultation.dto.PushMonitoringSnapshotResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AdminPushMonitoringService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.ErrorResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * BW-1 「푸시 설정 모니터링」 어드민 REST 컨트롤러.
 *
 * <p>본인 테넌트 한정. ADMIN/STAFF 공유 풀(rate-limit) 을 사용하며, FE 60s 폴링이 단일
 * 엔드포인트({@link #getSnapshot}) 로 페이지 전체 데이터를 받는다.
 *
 * <p>경로:
 * <ul>
 *   <li>{@code GET /api/v1/admin/notifications/monitoring/snapshot}</li>
 *   <li>{@code POST /api/v1/admin/notifications/monitoring/resend/{logId}}</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/notifications/monitoring")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminPushMonitoringController extends BaseApiController {

    static final String ERROR_CODE_TENANT_CONTEXT_MISSING = "TENANT_CONTEXT_MISSING";
    static final String ERROR_CODE_RANGE_INVALID = "RANGE_INVALID";
    static final String ERROR_CODE_CHANNEL_INVALID = "CHANNEL_INVALID";

    /** 실패 사례 응답 기본 limit (디자인 §4.8 — 페이지네이션 20행). */
    static final int DEFAULT_FAILURES_LIMIT = 20;

    /** 실패 사례 응답 최대 limit (운영 안전망). */
    static final int MAX_FAILURES_LIMIT = 200;

    private final AdminPushMonitoringService pushMonitoringService;

    /**
     * 페이지 단일 응답.
     *
     * @param rangeRaw   조회 범위 (H24 / D7 / D30, 기본 D7)
     * @param channelRaw 채널 필터 (ALL / ALIMTALK / SMS / PUSH, 기본 ALL)
     * @param failures   실패 사례 limit (기본 20, 최대 200)
     * @return 페이지 응답
     */
    @GetMapping("/snapshot")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getSnapshot(
            @RequestParam(value = "range", required = false, defaultValue = "D7") String rangeRaw,
            @RequestParam(value = "channel", required = false, defaultValue = "ALL") String channelRaw,
            @RequestParam(value = "failures", required = false) Integer failures) {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        PushMonitoringRange range = PushMonitoringRange.fromJson(rangeRaw);
        if (range == null) {
            return badRequest("조회 범위가 유효하지 않습니다 (값=" + rangeRaw + ").",
                ERROR_CODE_RANGE_INVALID);
        }
        PushMonitoringChannelFilter channel = PushMonitoringChannelFilter.fromJson(channelRaw);
        if (channel == null) {
            return badRequest("채널 필터가 유효하지 않습니다 (값=" + channelRaw + ").",
                ERROR_CODE_CHANNEL_INVALID);
        }
        int safeLimit = clampFailuresLimit(failures);
        PushMonitoringSnapshotResponse response =
            pushMonitoringService.loadSnapshot(tenantId, range, channel, safeLimit);
        return success(response);
    }

    /**
     * 어드민 수동 재발송. ADMIN_TEST source 만 활성, BATCH 는 후속 PR 에서 활성화.
     *
     * @param logId       대상 행 PK
     * @param sourceParam query parameter source (우선)
     * @param request     body (선택 — 사유 메모 / source fallback)
     * @param session     HTTP 세션 (currentUser 추출)
     * @return 재발송 결과
     */
    @PostMapping("/resend/{logId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> resendFailure(
            @PathVariable("logId") Long logId,
            @RequestParam(value = "source", required = false) String sourceParam,
            @RequestBody(required = false) @Valid PushMonitoringResendRequest request,
            HttpSession session) {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || currentUser.getId() == null) {
            return unauthorized("로그인이 필요합니다.");
        }
        String source = sourceParam != null && !sourceParam.isBlank()
            ? sourceParam
            : (request != null ? request.getSource() : null);
        String reason = request != null ? request.getReason() : null;
        PushMonitoringResendResponse response =
            pushMonitoringService.resendFailure(tenantId, currentUser, logId, source, reason);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private int clampFailuresLimit(Integer requested) {
        if (requested == null || requested <= 0) {
            return DEFAULT_FAILURES_LIMIT;
        }
        return Math.min(requested, MAX_FAILURES_LIMIT);
    }

    private String getTenantOrFail() {
        try {
            return TenantContextHolder.getRequiredTenantId();
        } catch (IllegalStateException e) {
            log.warn("BW-1 push monitoring: 테넌트 컨텍스트 없음");
            return null;
        }
    }

    private ResponseEntity<ErrorResponse> tenantMissing() {
        return badRequest("테넌트 컨텍스트가 없습니다.", ERROR_CODE_TENANT_CONTEXT_MISSING);
    }
}

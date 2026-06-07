package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.PushMonitoringChannelFilter;
import com.coresolution.consultation.dto.PushMonitoringFailureItem;
import com.coresolution.consultation.dto.PushMonitoringRange;
import com.coresolution.consultation.dto.PushMonitoringSnapshotResponse;
import com.coresolution.consultation.dto.TestNotificationResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AdminPushMonitoringService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * BW-1 「푸시 설정 모니터링」 어드민 API (읽기 + 재발송).
 *
 * <p>설계: {@code docs/project-management/2026-06-07/BW1_PUSH_MONITORING_DESIGN_HANDOFF.md}
 *
 * <p>권한: 디자이너 핸드오프 §1.D8 — ADMIN/STAFF 본인 테넌트 한정. 그 외 403.
 *
 * <p>엔드포인트:
 * <ol>
 *   <li>{@code GET /api/v1/admin/notifications/monitoring/snapshot?range=D7&channel=ALL} —
 *       60s 폴링 단일 응답.</li>
 *   <li>{@code POST /api/v1/admin/notifications/monitoring/resend/{logId}?source=BATCH|ADMIN_TEST} —
 *       어드민 수동 재발송({@link com.coresolution.consultation.service.impl.AdminTestNotificationRateLimiter}
 *       풀 공유).</li>
 * </ol>
 *
 * <p>멀티테넌트 격리: {@code TenantContextHolder.getRequiredTenantId()} 단일 격리 (DB 0).
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/notifications/monitoring")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
@RequiredArgsConstructor
public class AdminPushMonitoringController extends BaseApiController {

    static final String ERROR_CODE_TENANT_CONTEXT_MISSING = "TENANT_CONTEXT_MISSING";
    static final String ERROR_CODE_AUTH_REQUIRED = "AUTH_REQUIRED";
    static final String ERROR_CODE_INVALID_REQUEST = "INVALID_REQUEST";

    private final AdminPushMonitoringService service;

    /**
     * 60s 폴링 단일 응답.
     *
     * @param rangeParam   조회 범위 (H24 / D7 / D30) — null/blank 시 D7 기본
     * @param channelParam 채널 필터 (ALL / ALIMTALK / SMS / PUSH) — null/blank 시 ALL 기본
     * @return 합성 응답
     */
    @GetMapping("/snapshot")
    public ResponseEntity<?> getSnapshot(
            @RequestParam(value = "range", required = false) String rangeParam,
            @RequestParam(value = "channel", required = false) String channelParam) {
        String tenantId = getTenantOrNull();
        if (tenantId == null) {
            return badRequest("테넌트 컨텍스트가 없습니다.", ERROR_CODE_TENANT_CONTEXT_MISSING);
        }
        PushMonitoringRange range = parseRange(rangeParam);
        if (range == null && rangeParam != null && !rangeParam.isBlank()) {
            return badRequest("지원하지 않는 range 값입니다.", ERROR_CODE_INVALID_REQUEST);
        }
        PushMonitoringChannelFilter channel = parseChannel(channelParam);
        if (channel == null && channelParam != null && !channelParam.isBlank()) {
            return badRequest("지원하지 않는 channel 값입니다.", ERROR_CODE_INVALID_REQUEST);
        }
        PushMonitoringSnapshotResponse response = service.buildSnapshot(
            tenantId,
            range == null ? PushMonitoringRange.D7 : range,
            channel == null ? PushMonitoringChannelFilter.ALL : channel);
        return success(response);
    }

    /**
     * 재발송 액션 — 원본 로그 PK + 출처(BATCH/ADMIN_TEST) 로 분기.
     *
     * @param logId       원본 로그 PK
     * @param sourceParam BATCH|ADMIN_TEST
     * @param session     세션 (현재 사용자)
     * @return 재발송 결과
     */
    @PostMapping("/resend/{logId}")
    public ResponseEntity<?> resend(
            @PathVariable("logId") Long logId,
            @RequestParam("source") String sourceParam,
            HttpSession session) {
        String tenantId = getTenantOrNull();
        if (tenantId == null) {
            return badRequest("테넌트 컨텍스트가 없습니다.", ERROR_CODE_TENANT_CONTEXT_MISSING);
        }
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || currentUser.getId() == null) {
            return unauthorized("로그인이 필요합니다.");
        }
        if (logId == null || logId <= 0) {
            return badRequest("logId가 유효하지 않습니다.", ERROR_CODE_INVALID_REQUEST);
        }
        PushMonitoringFailureItem.Source source = parseSource(sourceParam);
        if (source == null) {
            return badRequest("source 는 BATCH|ADMIN_TEST 만 허용됩니다.",
                ERROR_CODE_INVALID_REQUEST);
        }
        TestNotificationResponse response = service.resend(tenantId, currentUser, logId, source);
        return success(response);
    }

    private static PushMonitoringRange parseRange(String value) {
        if (value == null || value.isBlank()) {
            return PushMonitoringRange.D7;
        }
        return PushMonitoringRange.fromJson(value);
    }

    private static PushMonitoringChannelFilter parseChannel(String value) {
        if (value == null || value.isBlank()) {
            return PushMonitoringChannelFilter.ALL;
        }
        return PushMonitoringChannelFilter.fromJson(value);
    }

    private static PushMonitoringFailureItem.Source parseSource(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return PushMonitoringFailureItem.Source.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String getTenantOrNull() {
        try {
            return TenantContextHolder.getRequiredTenantId();
        } catch (IllegalStateException e) {
            log.warn("푸시 모니터링: 테넌트 컨텍스트 없음");
            return null;
        }
    }
}

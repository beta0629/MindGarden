package com.coresolution.consultation.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.config.AdminTestNotificationProperties;
import com.coresolution.consultation.dto.TestAlimtalkRequest;
import com.coresolution.consultation.dto.TestNotificationAlimtalkTemplate;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.dto.TestNotificationHistoryItem;
import com.coresolution.consultation.dto.TestNotificationRecipient;
import com.coresolution.consultation.dto.TestNotificationResponse;
import com.coresolution.consultation.dto.TestSmsRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AdminTestNotificationService;
import com.coresolution.consultation.service.impl.AdminTestNotificationRateLimiter.Decision;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.ErrorResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 어드민 SMS·카카오 알림톡 테스트 발송 도구 — REST API.
 *
 * <p>기획: {@code docs/project-management/2026-05-22/ADMIN_TEST_NOTIFICATION_TOOL_PLAN.md}<br>
 * 권한: 기획서 §4.X C2({@code admin_staff}, 2026-05-22 정정) — 현행 4역할({@code ADMIN}/{@code STAFF}/
 * {@code CONSULTANT}/{@code CLIENT}) 중 {@code ADMIN}·{@code STAFF}만 허용. 그 외 403.
 *
 * <p>수신자 범위: 2026-05-27 정정 — {@code SELF}/{@code USER}/{@code PHONE} 3종 모두 허용.
 * PHONE 모드는 어드민이 임의 전화번호 직접 입력(목록 외 수신자 지원). 형식 검증·정규화·마스킹은
 * 서비스 레이어({@code AdminTestNotificationServiceImpl#resolveRecipient})가 수행한다.
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/test-notifications")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminTestNotificationController extends BaseApiController {

    static final String HEADER_RETRY_AFTER = "Retry-After";
    static final String HEADER_REMAINING_PER_MINUTE = "X-RateLimit-Remaining-Per-Minute";
    static final String HEADER_REMAINING_PER_DAY = "X-RateLimit-Remaining-Per-Day";

    static final String ERROR_CODE_TENANT_CONTEXT_MISSING = "TENANT_CONTEXT_MISSING";
    static final String ERROR_CODE_AUTH_REQUIRED = "AUTH_REQUIRED";
    static final String ERROR_CODE_RATE_LIMIT = "RATE_LIMIT_EXCEEDED";
    static final String ERROR_CODE_INVALID_REQUEST = "INVALID_REQUEST";

    private final AdminTestNotificationService service;
    private final AdminTestNotificationProperties properties;

    /**
     * 현재 테넌트 수신자 검색.
     *
     * @param search   이름·이메일 검색어
     * @param role     역할 필터(없으면 전체)
     * @param hasPhone true이면 전화번호 있는 사용자만(기본 true)
     * @return 마스킹된 수신자 후보 리스트
     */
    @GetMapping("/recipients")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getRecipients(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "hasPhone", required = false, defaultValue = "true")
                boolean hasPhone) {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        List<TestNotificationRecipient> recipients = service.searchRecipients(
            tenantId, search, role, hasPhone);
        return success(recipients);
    }

    /**
     * 공통코드 출처 알림톡 템플릿 목록.
     *
     * @return 템플릿 메타 리스트
     */
    @GetMapping("/alimtalk-templates")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getAlimtalkTemplates() {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        return success(service.listCommonCodeTemplates(tenantId));
    }

    /**
     * 솔라피 실시간 출처 알림톡 템플릿 목록.
     *
     * @return 템플릿 메타 리스트 (솔라피 미설정·실패 시 빈 리스트)
     */
    @GetMapping("/alimtalk-templates/live")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getAlimtalkTemplatesLive() {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        List<TestNotificationAlimtalkTemplate> templates = service.listLiveAlimtalkTemplates(tenantId);
        return success(templates);
    }

    /**
     * SMS 테스트 발송.
     *
     * @param request 발송 요청
     * @param session HTTP 세션(현재 사용자 획득)
     * @return 발송 결과
     */
    @PostMapping("/sms")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> sendSms(@Valid @RequestBody TestSmsRequest request,
            HttpSession session) {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || currentUser.getId() == null) {
            return authMissing();
        }

        Decision decision = service.checkRateLimit(tenantId, currentUser.getId());
        if (decision.exceeded()) {
            return rateLimited(decision);
        }

        TestNotificationResponse response = service.sendSms(tenantId, currentUser, request);
        return successWithRateHeaders(response, decision);
    }

    /**
     * 카카오 알림톡 테스트 발송.
     *
     * @param request 발송 요청
     * @param session HTTP 세션
     * @return 발송 결과
     */
    @PostMapping("/alimtalk")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> sendAlimtalk(@Valid @RequestBody TestAlimtalkRequest request,
            HttpSession session) {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || currentUser.getId() == null) {
            return authMissing();
        }

        Decision decision = service.checkRateLimit(tenantId, currentUser.getId());
        if (decision.exceeded()) {
            return rateLimited(decision);
        }

        TestNotificationResponse response = service.sendAlimtalk(tenantId, currentUser, request);
        return successWithRateHeaders(response, decision);
    }

    /**
     * 본 사용자·tenant 한정 이력 조회.
     *
     * @param from    시작일(yyyy-MM-dd, optional)
     * @param to      종료일(yyyy-MM-dd, optional)
     * @param channel 채널 필터(optional)
     * @param result  결과 필터(SUCCESS|FAIL, optional)
     * @param page    페이지(0-based, 기본 0)
     * @param size    페이지 크기(기본 30, 최대 100)
     * @param session HTTP 세션
     * @return 페이지 결과
     */
    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getHistory(
            @RequestParam(value = "from", required = false)
                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to", required = false)
                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(value = "channel", required = false) TestNotificationChannel channel,
            @RequestParam(value = "result", required = false) String result,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false) Integer size,
            HttpSession session) {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || currentUser.getId() == null) {
            return authMissing();
        }
        Boolean successFilter = parseSuccessFilter(result);
        int pageSize = clampPageSize(size);
        Page<TestNotificationHistoryItem> historyPage = service.getHistory(tenantId, currentUser,
            from, to, channel, successFilter, PageRequest.of(Math.max(page, 0), pageSize));
        return success(historyPage);
    }

    private Boolean parseSuccessFilter(String result) {
        if (result == null || result.isBlank()) {
            return null;
        }
        switch (result.trim().toUpperCase()) {
            case "SUCCESS":
                return Boolean.TRUE;
            case "FAIL":
            case "FAILURE":
                return Boolean.FALSE;
            default:
                return null;
        }
    }

    private int clampPageSize(Integer requested) {
        int defaultSize = properties.getHistoryPageSizeDefault();
        int maxSize = properties.getHistoryPageSizeMax();
        if (requested == null || requested <= 0) {
            return defaultSize;
        }
        return Math.min(requested, maxSize);
    }

    private String getTenantOrFail() {
        try {
            return TenantContextHolder.getRequiredTenantId();
        } catch (IllegalStateException e) {
            log.warn("어드민 테스트 발송: 테넌트 컨텍스트 없음");
            return null;
        }
    }

    private ResponseEntity<ErrorResponse> tenantMissing() {
        return badRequest("테넌트 컨텍스트가 없습니다.", ERROR_CODE_TENANT_CONTEXT_MISSING);
    }

    private ResponseEntity<ErrorResponse> authMissing() {
        return unauthorized("로그인이 필요합니다.");
    }

    private ResponseEntity<ApiResponse<Map<String, Object>>> rateLimited(Decision decision) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("errorCode", ERROR_CODE_RATE_LIMIT);
        body.put("limitKind", decision.limitKind());
        body.put("remainingPerMinute", decision.remainingPerMinute());
        body.put("remainingPerDay", decision.remainingPerDay());
        body.put("retryAfter", decision.retryAfterSeconds());
        ApiResponse<Map<String, Object>> payload =
            ApiResponse.error("요청 한도를 초과했습니다.", body);
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .header(HEADER_RETRY_AFTER, String.valueOf(decision.retryAfterSeconds()))
            .header(HEADER_REMAINING_PER_MINUTE, String.valueOf(decision.remainingPerMinute()))
            .header(HEADER_REMAINING_PER_DAY, String.valueOf(decision.remainingPerDay()))
            .body(payload);
    }

    private ResponseEntity<ApiResponse<TestNotificationResponse>> successWithRateHeaders(
            TestNotificationResponse response, Decision decision) {
        return ResponseEntity.ok()
            .header(HEADER_REMAINING_PER_MINUTE,
                String.valueOf(Math.max(0, decision.remainingPerMinute() - 1)))
            .header(HEADER_REMAINING_PER_DAY,
                String.valueOf(Math.max(0, decision.remainingPerDay() - 1)))
            .body(ApiResponse.success(response));
    }
}

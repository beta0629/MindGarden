package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.config.AdminTestNotificationProperties;
import com.coresolution.consultation.dto.BulkAlimtalkManualRequest;
import com.coresolution.consultation.dto.BulkNotificationResponse;
import com.coresolution.consultation.dto.BulkPushManualRequest;
import com.coresolution.consultation.dto.BulkRecipientResult;
import com.coresolution.consultation.dto.BulkSmsManualRequest;
import com.coresolution.consultation.dto.ManualNotificationJobRequest;
import com.coresolution.consultation.dto.ManualNotificationJobResponse;
import com.coresolution.consultation.dto.TestNotificationAlimtalkTemplate;
import com.coresolution.consultation.dto.TestNotificationRecipient;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.ManualNotificationJobException;
import com.coresolution.consultation.service.AdminManualNotificationService;
import com.coresolution.consultation.service.AdminTestNotificationService;
import com.coresolution.consultation.service.ManualNotificationJobService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
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
import org.springframework.http.HttpStatus;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 어드민 수동 다중 SMS·알림톡 발송 도구 — REST API.
 *
 * <p>P1.2 — 별도 메뉴 {@code /admin/manual-notification}. 권한은 단일 도구와 동일 (ADMIN/STAFF).
 * 수신자 검색·템플릿 목록은 단일 도구({@link AdminTestNotificationService}) 에 위임하여 SSOT 를 유지한다.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/manual-notifications")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminManualNotificationController extends BaseApiController {

    static final String HEADER_RETRY_AFTER = "Retry-After";
    static final String HEADER_REMAINING_PER_MINUTE = "X-RateLimit-Remaining-Per-Minute";
    static final String HEADER_REMAINING_PER_DAY = "X-RateLimit-Remaining-Per-Day";

    static final String ERROR_CODE_TENANT_CONTEXT_MISSING = "TENANT_CONTEXT_MISSING";
    static final String ERROR_CODE_RATE_LIMIT = "RATE_LIMIT_EXCEEDED";
    static final String ERROR_CODE_RATE_LIMIT_BULK = "RATE_LIMIT_EXCEEDED_BULK";

    private final AdminManualNotificationService manualService;
    private final AdminTestNotificationService singleService;
    private final AdminTestNotificationProperties properties;
    private final ManualNotificationJobService jobService;
    private final ResourceOwnerAccessGuard resourceOwnerAccessGuard;
    private final ClientPathAccessGuard clientPathAccessGuard;

    /**
     * 다중 SMS 발송. 본문·사유는 1건 공통, 수신자는 서버 상한(notification.manual.max-recipients) 이하. rate-limit 잔여 부족 시 0건 발송.
     *
     * @param request 요청
     * @param session HTTP 세션
     * @return 배치 결과
     */
    @PostMapping("/sms")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> sendSms(@Valid @RequestBody BulkSmsManualRequest request,
            HttpSession session) {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || currentUser.getId() == null) {
            return unauthorized("로그인이 필요합니다.");
        }
        Decision decision = singleService.checkRateLimit(tenantId, currentUser.getId());
        if (decision.exceeded()) {
            return rateLimited(decision);
        }
        BulkNotificationResponse response = manualService.sendBulkSms(tenantId, currentUser, request);
        return buildBatchResponse(response);
    }

    /**
     * 다중 알림톡 발송.
     *
     * @param request 요청
     * @param session HTTP 세션
     * @return 배치 결과
     */
    @PostMapping("/alimtalk")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> sendAlimtalk(@Valid @RequestBody BulkAlimtalkManualRequest request,
            HttpSession session) {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || currentUser.getId() == null) {
            return unauthorized("로그인이 필요합니다.");
        }
        Decision decision = singleService.checkRateLimit(tenantId, currentUser.getId());
        if (decision.exceeded()) {
            return rateLimited(decision);
        }
        BulkNotificationResponse response = manualService.sendBulkAlimtalk(tenantId, currentUser, request);
        return buildBatchResponse(response);
    }

    /**
     * 다중 푸시(Expo Push API) broadcast 발송. SMS/알림톡과 동일한 RBAC·tenant 가드·rate-limit
     * 풀을 공유하며, 채널만 PUSH 로 분기한다. 토큰 없는 사용자·옵트아웃 사용자는 SKIPPED 로 표기
     * (실패 아님).
     *
     * @param request 요청
     * @param session HTTP 세션
     * @return 배치 결과
     * @since 2026-05-25
     */
    @PostMapping("/push")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> sendPush(@Valid @RequestBody BulkPushManualRequest request,
            HttpSession session) {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || currentUser.getId() == null) {
            return unauthorized("로그인이 필요합니다.");
        }
        Decision decision = singleService.checkRateLimit(tenantId, currentUser.getId());
        if (decision.exceeded()) {
            return rateLimited(decision);
        }
        BulkNotificationResponse response = manualService.sendBulkPush(tenantId, currentUser, request);
        return buildBatchResponse(response);
    }

    /**
     * 수신자 검색 — 단일 도구에 위임(SSOT).
     *
     * @param search 검색어
     * @param role 역할 필터
     * @param hasPhone 전화번호 보유 사용자만 노출(기본 true)
     * @return 수신자 후보
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
        List<TestNotificationRecipient> recipients = singleService.searchRecipients(
            tenantId, search, role, hasPhone);
        return success(recipients);
    }

    /**
     * 알림톡 템플릿 목록(공통코드) — 단일 도구에 위임.
     *
     * @return 템플릿 목록
     */
    @GetMapping("/alimtalk-templates")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getAlimtalkTemplates() {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        return success(singleService.listCommonCodeTemplates(tenantId));
    }

    /**
     * 알림톡 템플릿 목록(솔라피 라이브) — 단일 도구에 위임.
     *
     * @return 템플릿 목록
     */
    @GetMapping("/alimtalk-templates/live")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getAlimtalkTemplatesLive() {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        List<TestNotificationAlimtalkTemplate> templates = singleService.listLiveAlimtalkTemplates(tenantId);
        return success(templates);
    }

    /**
     * 배치 상세 — 같은 batch_id 의 모든 행을 행 단위 결과로 노출.
     *
     * @param batchId 배치 UUID
     * @return 배치 행 결과
     */
    @GetMapping("/batches/{batchId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getBatch(@PathVariable("batchId") String batchId) {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        List<BulkRecipientResult> rows = manualService.getBatchDetails(tenantId, batchId);
        return success(rows);
    }

    /**
     * 배치 그룹 페이지네이션 — 본인·tenant 한정.
     *
     * @param page 페이지(0-based)
     * @param size 페이지 크기(기본 30, 최대 100)
     * @param session HTTP 세션
     * @return 배치 헤더 페이지
     */
    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getHistory(
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false) Integer size,
            HttpSession session) {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || currentUser.getId() == null) {
            return unauthorized("로그인이 필요합니다.");
        }
        int pageSize = clampPageSize(size);
        Page<BulkNotificationResponse> result = manualService.getBatchHistory(
            tenantId, currentUser, PageRequest.of(Math.max(page, 0), pageSize));
        return success(result);
    }

    /**
     * 수동 발송 화면 설정(서버 단일 수신자 상한). 테넌트 관리자 전용.
     *
     * @param session HTTP 세션
     * @return 설정
     */
    @GetMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getJobConfig(HttpSession session) {
        resourceOwnerAccessGuard.requireTenantAdminAccess(session);
        return success(jobService.getConfig());
    }

    /**
     * 발송 확인 단계 — 서버가 대상 집합을 확정해 인원·제외·마스킹 미리보기·토큰을 돌려준다(저장·발송 없음).
     *
     * @param request 요청
     * @param session HTTP 세션
     * @return 미리보기
     */
    @PostMapping("/jobs/preview")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> previewJob(@Valid @RequestBody ManualNotificationJobRequest request,
            HttpSession session) {
        User caller = resourceOwnerAccessGuard.requireTenantAdminAccess(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        try {
            return success(jobService.preview(tenantId, request));
        } catch (ManualNotificationJobException e) {
            return jobError(e);
        }
    }

    /**
     * 발송 작업 생성 — 미리보기 토큰과 같은 대상일 때만 만들고 작업 id 를 바로 돌려준다(발송은 백그라운드).
     * 같은 멱등 키 재요청은 기존 작업을 200 으로 돌려준다.
     *
     * @param request 요청
     * @param session HTTP 세션
     * @return 작업
     */
    @PostMapping("/jobs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createJob(@Valid @RequestBody ManualNotificationJobRequest request,
            HttpSession session) {
        User caller = resourceOwnerAccessGuard.requireTenantAdminAccess(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        try {
            ManualNotificationJobResponse job = jobService.createJob(tenantId, caller, request);
            HttpStatus status = job.isDuplicateRequest() ? HttpStatus.OK : HttpStatus.ACCEPTED;
            return ResponseEntity.status(status).body(ApiResponse.success(job));
        } catch (ManualNotificationJobException e) {
            return jobError(e);
        }
    }

    /**
     * 발송 작업 진행·요약. {@code includeRecords=true} 면 수신자별 발송 기록·청크·중복 요약을 포함한다.
     *
     * @param jobId          작업 UUID
     * @param includeRecords 수신자별 기록 포함
     * @param session        HTTP 세션
     * @return 작업
     */
    @GetMapping("/jobs/{jobId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getJob(@PathVariable("jobId") String jobId,
            @RequestParam(value = "includeRecords", required = false, defaultValue = "false") boolean includeRecords,
            HttpSession session) {
        User caller = resourceOwnerAccessGuard.requireTenantAdminAccess(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        try {
            return success(jobService.getJob(tenantId, jobId, includeRecords));
        } catch (ManualNotificationJobException e) {
            return jobError(e);
        }
    }

    private ResponseEntity<ErrorResponse> jobError(ManualNotificationJobException e) {
        return error(e.getMessage(), e.getErrorCode(), e.getStatus());
    }

    /**
     * 배치 응답 직렬화. 사전 차단(0건 발송) 인 경우에도 200 OK 로 응답하지만, body 의
     * {@code batchErrorCode} 가 채워져 프론트가 사용자에게 차단 사유를 노출할 수 있다.
     *
     * @param response 배치 결과
     * @return ApiResponse 래핑된 응답
     */
    private ResponseEntity<ApiResponse<BulkNotificationResponse>> buildBatchResponse(
            BulkNotificationResponse response) {
        return ResponseEntity.ok(ApiResponse.success(response));
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
            log.warn("어드민 수동 다중 발송: 테넌트 컨텍스트 없음");
            return null;
        }
    }

    private ResponseEntity<ErrorResponse> tenantMissing() {
        return badRequest("테넌트 컨텍스트가 없습니다.", ERROR_CODE_TENANT_CONTEXT_MISSING);
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
}

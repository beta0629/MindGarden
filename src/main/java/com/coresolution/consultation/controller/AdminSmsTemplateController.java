package com.coresolution.consultation.controller;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.dto.SmsTemplateAdminItem;
import com.coresolution.consultation.dto.SmsTemplateDispatchFlagRequest;
import com.coresolution.consultation.dto.SmsTemplatePreviewRequest;
import com.coresolution.consultation.dto.SmsTemplatePreviewResponse;
import com.coresolution.consultation.dto.SmsTemplateUpdateRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.SmsTemplateService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 어드민 — 트랜잭션 SMS 템플릿 관리 API.
 *
 * <p>운영 결정권자 컨펌(2026-05-29) — SMS 본문 코드 하드코딩을 DB 화 + 어드민 UI 편집 가능
 * 으로 전환. 현재 테넌트의 override 본문만 편집·삭제할 수 있으며, 글로벌 본문은
 * Flyway 마이그레이션으로만 변경한다(SSOT 가드).
 *
 * <p>RBAC:
 * <ul>
 *   <li>GET 목록 — {@code ADMIN}, {@code STAFF}</li>
 *   <li>POST 미리보기 — {@code ADMIN}, {@code STAFF}</li>
 *   <li>PUT 저장 / DELETE override 삭제 — {@code ADMIN} 만 (테넌트 운영자 권한)</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-29
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/sms-templates")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminSmsTemplateController extends BaseApiController {

    static final String ERROR_CODE_TENANT_CONTEXT_MISSING = "TENANT_CONTEXT_MISSING";
    static final String ERROR_CODE_AUTH_REQUIRED = "AUTH_REQUIRED";
    static final String ERROR_CODE_TEMPLATE_NOT_FOUND = "SMS_TEMPLATE_NOT_FOUND";
    static final String ERROR_CODE_INVALID_REQUEST = "INVALID_REQUEST";

    /** P0 보안(2026-10-03): 전역 SMS 발송 게이트는 운영자 전용. */
    static final String ERROR_CODE_GLOBAL_DISPATCH_OPS_ONLY = "GLOBAL_DISPATCH_OPS_ONLY";

    /** P0 보안(2026-10-03): 전역 게이트 변경 거부 메시지. */
    static final String MSG_GLOBAL_DISPATCH_OPS_ONLY =
            "전역 자동 SMS 발송 게이트는 운영자 전용입니다. 테넌트 관리자 경로에서는 변경할 수 없습니다.";

    private final SmsTemplateService smsTemplateService;

    /**
     * 현재 테넌트 SMS 템플릿 목록 조회 (글로벌 + 테넌트 override 병합).
     *
     * @return 키별 행 리스트
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> list() {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        List<SmsTemplateAdminItem> items = smsTemplateService.listForAdmin(tenantId);
        return success(items != null ? items : Collections.emptyList());
    }

    /**
     * 테넌트 override 본문 저장 (upsert).
     *
     * @param key     SMS_TEMPLATE 키 (예: PAYMENT_COMPLETED)
     * @param request 저장 요청 본문
     * @param session 세션 (audit)
     * @return 저장 결과 행
     */
    @PutMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> upsertTenantOverride(
            @PathVariable("key") String key,
            @Valid @RequestBody SmsTemplateUpdateRequest request,
            HttpSession session) {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || currentUser.getId() == null) {
            return unauthorized("로그인이 필요합니다.");
        }
        try {
            SmsTemplateAdminItem item = smsTemplateService.upsertTenantOverride(
                    key, request.getContent(), tenantId, currentUser);
            return updated(item);
        } catch (IllegalArgumentException e) {
            log.warn("SMS 템플릿 저장 실패: key={}, err={}", key, e.getMessage());
            return badRequest(e.getMessage(), ERROR_CODE_TEMPLATE_NOT_FOUND);
        }
    }

    /**
     * 테넌트 override 삭제 (글로벌 본문으로 회귀, soft-delete).
     *
     * @param key     SMS_TEMPLATE 키
     * @param session 세션 (audit)
     * @return 삭제 후 행
     */
    @DeleteMapping("/{key}/tenant-override")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteTenantOverride(
            @PathVariable("key") String key,
            HttpSession session) {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || currentUser.getId() == null) {
            return unauthorized("로그인이 필요합니다.");
        }
        try {
            SmsTemplateAdminItem item = smsTemplateService.deleteTenantOverride(
                    key, tenantId, currentUser);
            return success("테넌트 override 가 삭제되었습니다.", item);
        } catch (IllegalArgumentException e) {
            log.warn("SMS 템플릿 override 삭제 실패: key={}, err={}", key, e.getMessage());
            return badRequest(e.getMessage(), ERROR_CODE_TEMPLATE_NOT_FOUND);
        }
    }

    /**
     * 변수 치환 미리보기.
     *
     * @param key     SMS_TEMPLATE 키
     * @param request 변수 입력
     * @return 치환 결과 + 길이 + 누락 변수
     */
    @PostMapping("/{key}/preview")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> preview(
            @PathVariable("key") String key,
            @RequestBody(required = false) SmsTemplatePreviewRequest request) {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        SmsTemplatePreviewRequest safe = request != null ? request : new SmsTemplatePreviewRequest();
        boolean preferTenant = safe.getPreferTenantOverride() == null
                ? Boolean.TRUE
                : safe.getPreferTenantOverride();
        Optional<SmsTemplatePreviewResponse> preview = smsTemplateService.preview(
                key, tenantId, safe.getVariables(), preferTenant);
        if (preview.isEmpty()) {
            return notFound("SMS 템플릿을 찾을 수 없습니다: " + key);
        }
        return success(preview.get());
    }

    /**
     * 글로벌 자동 SMS 발송 게이트 토글 — P0 보안(2026-10-03) 이후 테넌트 경로에서는 차단된다.
     *
     * <p>{@code system_config} 의 {@code notification.sms.auto-dispatch.enabled} 행은 전역
     * ({@code tenant_id=''}) 이라 한 테넌트 관리자가 OFF 하면 모든 테넌트의 자동 SMS 가 멈춘다.
     * 전역 스위치는 운영자 전용 경로로만 변경하며, 본 엔드포인트는 ADMIN 이라도 403 을 반환한다.
     * 종목별 토글({@code PATCH /{key}/dispatch})은 테넌트 override 라 그대로 유지한다.
     *
     * @param request enabled=true|false (사용하지 않음)
     * @param session 세션 (인증 확인)
     * @return 403 (운영자 전용)
     */
    @PatchMapping("/global-dispatch")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateGlobalDispatchFlag(
            @Valid @RequestBody SmsTemplateDispatchFlagRequest request,
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || currentUser.getId() == null) {
            return unauthorized("로그인이 필요합니다.");
        }
        log.warn("어드민 SMS 글로벌 게이트 변경 차단(운영자 전용): userId={}", currentUser.getId());
        return error(MSG_GLOBAL_DISPATCH_OPS_ONLY, ERROR_CODE_GLOBAL_DISPATCH_OPS_ONLY,
                org.springframework.http.HttpStatus.FORBIDDEN);
    }

    /**
     * 종목별 자동 SMS 발송 게이트 토글 (옵션 C 2/2).
     *
     * <p>테넌트 override row 의 {@code extra_data.dispatch_enabled} 를 갱신한다.
     * row 가 없으면 글로벌 row 본문을 복사하여 신설된다 — 어드민 본문 편집과 동일 row.
     * 글로벌 토글이 OFF 면 본 종목별 토글 값과 무관하게 발송은 차단된다 (글로벌 우선).
     *
     * @param key     SMS_TEMPLATE 키 (예: PAYMENT_COMPLETED)
     * @param request enabled=true|false
     * @param session 세션 (audit)
     * @return 갱신된 어드민 행
     */
    @PatchMapping("/{key}/dispatch")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateTemplateDispatchFlag(
            @PathVariable("key") String key,
            @Valid @RequestBody SmsTemplateDispatchFlagRequest request,
            HttpSession session) {
        String tenantId = getTenantOrFail();
        if (tenantId == null) {
            return tenantMissing();
        }
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || currentUser.getId() == null) {
            return unauthorized("로그인이 필요합니다.");
        }
        try {
            boolean enabled = Boolean.TRUE.equals(request.getEnabled());
            SmsTemplateAdminItem item = smsTemplateService.updateAutoDispatchFlag(
                    key, enabled, tenantId, currentUser);
            log.info("어드민 SMS 종목 게이트 토글: key={}, enabled={}, tenant={}, by={}",
                    key, enabled, tenantId, currentUser.getUserId());
            return updated(item);
        } catch (IllegalArgumentException e) {
            log.warn("SMS 종목 게이트 토글 실패: key={}, err={}", key, e.getMessage());
            return badRequest(e.getMessage(), ERROR_CODE_TEMPLATE_NOT_FOUND);
        }
    }

    private String getTenantOrFail() {
        try {
            return TenantContextHolder.getRequiredTenantId();
        } catch (IllegalStateException e) {
            log.warn("어드민 SMS 템플릿 API: 테넌트 컨텍스트 없음");
            return null;
        }
    }

    private ResponseEntity<?> tenantMissing() {
        return badRequest("테넌트 컨텍스트가 없습니다.", ERROR_CODE_TENANT_CONTEXT_MISSING);
    }
}

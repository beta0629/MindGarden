package com.coresolution.consultation.controller;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.dto.SmsTemplateAdminItem;
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

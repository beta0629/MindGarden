package com.coresolution.consultation.controller;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.dto.AdminAuditLogResponse;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 테넌트 감사 로그 조회(ADMIN).
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@RequiredArgsConstructor
public class AdminAuditLogController extends BaseApiController {

    private final AuditLogService auditLogService;

    /**
     * 감사 로그 페이지 조회.
     *
     * @param action     선택 필터 — {@link AuditAction} 코드
     * @param entityType 선택 필터
     * @param pageable   페이징
     * @return 페이지
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> list(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @PageableDefault(size = 50) Pageable pageable) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        AuditAction auditAction = null;
        if (StringUtils.hasText(action)) {
            try {
                auditAction = AuditAction.valueOf(action.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                return badRequest("알 수 없는 action 입니다.", "VALIDATION_ERROR");
            }
        }
        String entityFilter = StringUtils.hasText(entityType) ? entityType.trim() : null;
        Page<AuditLog> page = auditLogService.findAdminPage(
                tenantId, auditAction, entityFilter, pageable);
        Page<AdminAuditLogResponse> mapped = page.map(AdminAuditLogController::toResponse);
        return success(mapped);
    }

    private static AdminAuditLogResponse toResponse(AuditLog log) {
        return AdminAuditLogResponse.builder()
                .id(log.getId())
                .tenantId(log.getTenantId())
                .actorUserId(log.getActorUserId())
                .actorRole(log.getActorRole())
                .targetUserId(log.getTargetUserId())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .metadataJson(log.getMetadataJson())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
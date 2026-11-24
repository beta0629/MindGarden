package com.coresolution.consultation.sct.controller;

import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.sct.dto.SctSettingsResponse;
import com.coresolution.consultation.sct.dto.SctSettingsUpdateRequest;
import com.coresolution.consultation.sct.service.SctSettingsService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * SCT 센터 설정 API — ADMIN만 변경.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/sct-settings")
@RequiredArgsConstructor
public class AdminSctSettingsController extends BaseApiController {

    private final SctSettingsService sctSettingsService;

    /**
     * 설정 조회.
     *
     * @return 설정
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getSettings() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return success(sctSettingsService.getSettings(tenantId));
    }

    /**
     * 설정 변경(ADMIN).
     *
     * @param request 요청
     * @param session 세션
     * @return 저장 결과
     */
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> putSettings(
            @Valid @RequestBody SctSettingsUpdateRequest request,
            HttpSession session) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        User actor = SessionUtils.getCurrentUser(session);
        if (actor == null) {
            return unauthorized("로그인이 필요합니다.");
        }
        SctSettingsResponse data = sctSettingsService.updateSettings(
                tenantId, request, actor.getId(),
                actor.getRole() == null ? "ADMIN" : actor.getRole().name());
        return updated(data);
    }
}

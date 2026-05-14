package com.coresolution.consultation.controller;

import java.util.List;
import com.coresolution.consultation.dto.selfassessment.SelfAssessmentResultResponse;
import com.coresolution.consultation.dto.selfassessment.SelfAssessmentShareUpdateRequest;
import com.coresolution.consultation.dto.selfassessment.SelfAssessmentSubmitRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.SelfAssessmentService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Expo {@code SELF_ASSESSMENT_API} — 내담자 자가검사.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@RestController
@RequestMapping("/api/v1/self-assessments")
@RequiredArgsConstructor
public class SelfAssessmentController extends BaseApiController {

    private final SelfAssessmentService selfAssessmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SelfAssessmentResultResponse>>> list(HttpSession session) {
        User client = requireClient(session);
        String tenantId = requireTenantId(client);
        try {
            TenantContextHolder.setTenantId(tenantId);
            return success(selfAssessmentService.listMine(client));
        } finally {
            TenantContextHolder.clear();
        }
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<SelfAssessmentResultResponse>> getOne(
            HttpSession session,
            @PathVariable long id) {
        User client = requireClient(session);
        String tenantId = requireTenantId(client);
        try {
            TenantContextHolder.setTenantId(tenantId);
            return success(selfAssessmentService.getMineById(client, id));
        } finally {
            TenantContextHolder.clear();
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SelfAssessmentResultResponse>> submit(
            HttpSession session,
            @Valid @RequestBody SelfAssessmentSubmitRequest request) {
        User client = requireClient(session);
        String tenantId = requireTenantId(client);
        try {
            TenantContextHolder.setTenantId(tenantId);
            return created(selfAssessmentService.submit(client, request));
        } finally {
            TenantContextHolder.clear();
        }
    }

    @PutMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<Void>> updateShare(
            HttpSession session,
            @PathVariable long id,
            @Valid @RequestBody SelfAssessmentShareUpdateRequest request) {
        User client = requireClient(session);
        String tenantId = requireTenantId(client);
        try {
            TenantContextHolder.setTenantId(tenantId);
            selfAssessmentService.updateShare(client, id, Boolean.TRUE.equals(request.getSharedWithConsultant()));
            return updated("수정되었습니다.", (Void) null);
        } finally {
            TenantContextHolder.clear();
        }
    }

    private static User requireClient(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        if (user.getRole() == null || !user.getRole().isClient()) {
            throw new org.springframework.security.access.AccessDeniedException("내담자만 이용할 수 있습니다.");
        }
        return user;
    }

    private static String requireTenantId(User client) {
        String tenantId = client.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new org.springframework.security.access.AccessDeniedException("테넌트 정보가 없습니다.");
        }
        return tenantId.trim();
    }
}

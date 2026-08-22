package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.SessionSuccessionPreviewResponse;
import com.coresolution.consultation.dto.SessionSuccessionRequest;
import com.coresolution.consultation.dto.SessionSuccessionResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.SessionSuccessionService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
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
import org.springframework.web.bind.annotation.RestController;

/**
 * 회기 승계 API — {@code POST /mappings/transfer}(상담사 이전)와 경로·의미 분리.
 *
 * @author CoreSolution
 * @since 2026-08-22
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/mappings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminSessionSuccessionController extends BaseApiController {

    private final SessionSuccessionService sessionSuccessionService;

    /**
     * 승계가능 미리보기.
     *
     * @param sourceMappingId 소스 매핑 ID
     * @return 미리보기
     */
    @GetMapping("/{sourceMappingId}/session-succession/preview")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<SessionSuccessionPreviewResponse>> preview(
            @PathVariable Long sourceMappingId) {
        log.info("회기 승계 미리보기: sourceMappingId={}", sourceMappingId);
        SessionSuccessionPreviewResponse preview = sessionSuccessionService.preview(sourceMappingId);
        return success(preview);
    }

    /**
     * 회기 승계 실행.
     *
     * @param sourceMappingId 소스 매핑 ID
     * @param request         실행 요청
     * @param session         HTTP 세션
     * @return 실행 결과
     */
    @PostMapping("/{sourceMappingId}/session-succession")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<SessionSuccessionResponse>> execute(
            @PathVariable Long sourceMappingId,
            @Valid @RequestBody SessionSuccessionRequest request,
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        Long actorUserId = currentUser != null ? currentUser.getId() : null;
        String actorRole = currentUser != null && currentUser.getRole() != null
                ? currentUser.getRole().name()
                : null;
        log.info("회기 승계 실행: sourceMappingId={}, targetConsultantId={}, sessionCount={}, actor={}",
                sourceMappingId, request.getTargetConsultantId(), request.getSessionCount(), actorUserId);
        SessionSuccessionResponse result = sessionSuccessionService.execute(
                sourceMappingId, request, actorUserId, actorRole);
        return success("회기 승계가 완료되었습니다.", result);
    }
}

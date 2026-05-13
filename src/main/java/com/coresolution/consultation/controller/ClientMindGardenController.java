package com.coresolution.consultation.controller;

import com.coresolution.consultation.constant.GardenGrowthEventType;
import com.coresolution.consultation.dto.MindGardenEventApplyResponse;
import com.coresolution.consultation.dto.MindGardenEventRequest;
import com.coresolution.consultation.dto.MindGardenServerStateResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.ClientMindGardenService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import java.util.Optional;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Expo {@code GARDEN_API} — 내담자 본인 「마음 정원」상태·이벤트.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/clients/me/mind-garden")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ClientMindGardenController extends BaseApiController {

    private final ClientMindGardenService clientMindGardenService;

    /**
     * 서버 권위 정원 상태 조회.
     *
     * @param session HTTP 세션
     * @return {@link MindGardenServerStateResponse}
     */
    @GetMapping
    public ResponseEntity<ApiResponse<MindGardenServerStateResponse>> getState(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("로그인이 필요합니다."));
        }
        if (currentUser.getRole() == null || !currentUser.getRole().isClient()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("내담자 전용 API 입니다."));
        }
        String tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("테넌트 정보가 없습니다."));
        }
        tenantId = tenantId.trim();
        try {
            TenantContextHolder.setTenantId(tenantId);
            MindGardenServerStateResponse data =
                    clientMindGardenService.getServerState(tenantId, currentUser.getId());
            return success(data);
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 성장 이벤트 적재 — 멱등·주간 캡 검증.
     *
     * @param session HTTP 세션
     * @param request 이벤트 본문
     * @return 적용 결과
     */
    @PostMapping("/events")
    public ResponseEntity<ApiResponse<MindGardenEventApplyResponse>> postEvent(
            HttpSession session,
            @Valid @RequestBody MindGardenEventRequest request) {

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("로그인이 필요합니다."));
        }
        if (currentUser.getRole() == null || !currentUser.getRole().isClient()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("내담자 전용 API 입니다."));
        }
        String tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("테넌트 정보가 없습니다."));
        }
        tenantId = tenantId.trim();

        Optional<GardenGrowthEventType> typeOpt = GardenGrowthEventType.parse(request.getEventType());
        if (typeOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("유효하지 않은 eventType 입니다."));
        }

        try {
            TenantContextHolder.setTenantId(tenantId);
            MindGardenEventApplyResponse result = clientMindGardenService.applyEvent(
                    tenantId,
                    currentUser.getId(),
                    typeOpt.get(),
                    request.getSourceId());
            return success(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } finally {
            TenantContextHolder.clear();
        }
    }
}

package com.coresolution.consultation.controller;

import java.util.Map;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 내담자 맥락 프로필 SSOT (상담일지 모달 등).
 *
 * <p>GET /api/v1/clients/{clientId}/context-profile
 *
 * @author CoreSolution
 * @since 2026-04-08
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/clients")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ClientContextProfileController extends BaseApiController {

    private final ClientStatsService clientStatsService;

    /**
     * 내담자 프로필·통계 맥락 조회 — 표시 등급·접근 근거 포함.
     *
     * @param clientId     내담자 ID
     * @param consultantId 상담사(CONSULTANT)일 때 필수이며 로그인 사용자 ID와 일치해야 함
     * @param session      HTTP 세션
     * @return 통계 본문 + visibilityTier + accessReason
     */
    @GetMapping("/{clientId}/context-profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getContextProfile(
            @PathVariable Long clientId,
            @RequestParam(value = "consultantId", required = false) Long consultantId,
            HttpSession session) {

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("로그인이 필요합니다."));
        }
        String tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("테넌트 정보가 없습니다."));
        }
        tenantId = tenantId.trim();

        UserRole role = currentUser.getRole();
        if (role != null && role.isConsultant()) {
            if (consultantId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("상담사는 consultantId 쿼리 파라미터가 필요합니다."));
            }
            if (!consultantId.equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("consultantId가 로그인 사용자와 일치하지 않습니다."));
            }
        }

        try {
            com.coresolution.core.context.TenantContextHolder.setTenantId(tenantId);
            Map<String, Object> data = clientStatsService.getClientContextProfile(tenantId, clientId, currentUser);
            return success(data);
        } catch (AccessDeniedException e) {
            log.warn("내담자 context-profile 접근 거부: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (EntityNotFoundException e) {
            log.warn("내담자 context-profile 조회 불가(리소스 없음·접근 불가)");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("해당 내담자 정보를 조회할 수 없습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("내담자 context-profile 조회 실패: clientId={}, error={}", clientId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("내담자 정보 조회에 실패했습니다: " + e.getMessage()));
        }
    }
}

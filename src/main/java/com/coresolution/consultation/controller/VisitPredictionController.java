package com.coresolution.consultation.controller;

import java.time.LocalDate;
import com.coresolution.consultation.dto.prediction.DismissExpectedVisitRequest;
import com.coresolution.consultation.dto.prediction.UnbookedExpectedClientResponse;
import com.coresolution.consultation.dto.prediction.VisitPredictionSettingsUpdateRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.VisitPredictionService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 방문 예측 컨트롤러
 *
 * <p>예상 방문일인데 미예약인 내담자 목록 조회, 무시/예측 설정 API를 제공한다.</p>
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-08-13
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/schedules/predictions")
@RequiredArgsConstructor
public class VisitPredictionController extends BaseApiController {

    private final VisitPredictionService visitPredictionService;
    private final RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;

    /**
     * 미예약 예상 방문 내담자 목록 조회
     *
     * <p>권한: ADMIN=전체, CONSULTANT=본인 담당만</p>
     *
     * @param startDate    조회 시작일 (yyyy-MM-dd)
     * @param endDate      조회 종료일 (yyyy-MM-dd)
     * @param consultantId 상담사 ID (선택)
     * @param pageable     페이지네이션 (page, size)
     * @return 미예약 예상 내담자 페이지
     */
    @GetMapping("/unbooked-expected")
    public ResponseEntity<ApiResponse<Page<UnbookedExpectedClientResponse>>> getUnbookedExpectedClients(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long consultantId,
            @PageableDefault(size = 20) Pageable pageable,
            HttpSession session) {

        String tenantId = TenantContextHolder.getRequiredTenantId();

        Long effectiveConsultantId = resolveConsultantId(consultantId, session);

        log.info("미예약 예상 방문 조회 요청: tenantId={}, startDate={}, endDate={}, consultantId={}",
                tenantId, startDate, endDate, effectiveConsultantId);

        Page<UnbookedExpectedClientResponse> result = visitPredictionService
                .findUnbookedExpectedClients(tenantId, startDate, endDate, effectiveConsultantId, pageable);

        log.info("미예약 예상 방문 조회 완료: totalElements={}", result.getTotalElements());
        return success(result);
    }

    /**
     * 예상 방문일 1회 무시 처리
     *
     * @param request 무시 요청 (mappingId, expectedDate)
     */
    @PostMapping("/dismiss")
    public ResponseEntity<ApiResponse<Void>> dismissExpectedVisit(
            @RequestBody @Valid DismissExpectedVisitRequest request) {

        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("예상 방문 무시 요청: tenantId={}, mappingId={}, expectedDate={}",
                tenantId, request.getMappingId(), request.getExpectedDate());

        visitPredictionService.dismissExpectedVisit(tenantId, request);

        log.info("예상 방문 무시 처리 완료: mappingId={}", request.getMappingId());
        return success("예상 방문일이 무시되었습니다.");
    }

    /**
     * 매핑별 예측 설정 변경 (ON/OFF 토글)
     *
     * @param mappingId 매핑 ID
     * @param request   설정 변경 요청
     */
    @PutMapping("/settings/{mappingId}")
    public ResponseEntity<ApiResponse<Void>> updatePredictionSettings(
            @PathVariable Long mappingId,
            @RequestBody @Valid VisitPredictionSettingsUpdateRequest request) {

        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("예측 설정 변경 요청: tenantId={}, mappingId={}, predictionEnabled={}",
                tenantId, mappingId, request.getPredictionEnabled());

        visitPredictionService.updatePredictionSettings(tenantId, mappingId, request);

        log.info("예측 설정 변경 완료: mappingId={}", mappingId);
        return success("예측 설정이 변경되었습니다.");
    }

    /**
     * CONSULTANT 역할이면 본인 ID를 강제 반환, ADMIN/STAFF는 요청 파라미터를 그대로 사용
     *
     * @param requestedConsultantId 요청 파라미터로 전달된 상담사 ID (nullable)
     * @param session               HTTP 세션
     * @return 유효한 consultantId (ADMIN은 null 가능 = 전체 조회)
     */
    private Long resolveConsultantId(Long requestedConsultantId, HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        if (roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(currentUser.getRole())) {
            return requestedConsultantId;
        }

        return currentUser.getId();
    }
}

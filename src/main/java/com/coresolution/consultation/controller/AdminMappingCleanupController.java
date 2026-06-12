package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.PendingPaymentBulkCleanupRequest;
import com.coresolution.consultation.dto.PendingPaymentCleanupRequest;
import com.coresolution.consultation.dto.PendingPaymentCleanupResult;
import com.coresolution.consultation.dto.PendingPaymentDirtyMappingPage;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AdminMappingCleanupService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

/**
 * 옵션 B R4 — 디러티 PENDING_PAYMENT 매핑 어드민 수동 정리 컨트롤러.
 *
 * <p>합의서: {@code docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md}.
 * 어드민이 매칭 생성 후 일정 시간(기본 24h) 이상 결제가 들어오지 않은 PENDING_PAYMENT
 * 매핑을 조회·단건 정리·일괄 정리할 수 있도록 지원하는 3종 API 를 제공한다.</p>
 *
 * <p>2026-06 4종 SSOT (PR-2/9): 권한을 {@code ADMIN} 단일로 단순화한다.
 * 매핑 상태 변경은 위험도가 높아 STAFF 는 제외한다. 레거시 SUPER_ADMIN /
 * HQ_ADMIN / BRANCH_SUPER_ADMIN 은 {@link com.coresolution.consultation.constant.UserRole#fromString}
 * 에서 ADMIN 으로 매핑되므로 호환된다.</p>
 *
 * @author MindGarden
 * @since 2026-05-28
 * @updated 2026-06 - 4종 SSOT 적용 (PR-2/9)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminMappingCleanupController extends BaseApiController {

    private final AdminMappingCleanupService adminMappingCleanupService;

    /**
     * 디러티 PENDING_PAYMENT 매핑 페이지 조회.
     *
     * @param ageHours 최소 경과 시간(시간 단위, 기본 24)
     * @param page     0 기반 페이지 번호
     * @param size     페이지 크기 (1~100)
     */
    @GetMapping("/mappings/pending-payment-dirty")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PendingPaymentDirtyMappingPage>> getDirtyPendingPaymentMappings(
            @RequestParam(name = "ageHours", required = false, defaultValue = "24") long ageHours,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        log.info("🔍 [R4] 디러티 PENDING_PAYMENT 매핑 조회: ageHours={}, page={}, size={}", ageHours, page, size);
        PendingPaymentDirtyMappingPage result =
                adminMappingCleanupService.getDirtyPendingPaymentMappings(ageHours, page, size);
        return success(result);
    }

    /**
     * 디러티 PENDING_PAYMENT 매핑 단건 수동 정리.
     *
     * <p>PENDING_PAYMENT 외 상태인 매핑은 409 (Conflict) 를 반환한다.</p>
     */
    @PostMapping("/mappings/{mappingId}/cleanup-pending-payment")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PendingPaymentCleanupResult>> cleanupPendingPaymentMapping(
            @PathVariable Long mappingId,
            @RequestBody @Valid PendingPaymentCleanupRequest request,
            HttpSession session) {
        log.info("🧹 [R4] PENDING_PAYMENT 매핑 단건 정리: mappingId={}", mappingId);

        String actor = resolveActor(session);
        try {
            PendingPaymentCleanupResult result = adminMappingCleanupService.cleanupPendingPaymentMapping(
                    mappingId, request.getReason(), request.getNotifyClient(), actor);
            return success("매칭이 정리되었습니다.", result);
        } catch (IllegalStateException ex) {
            log.warn("⚠️ [R4] 단건 정리 거부 (상태 위반): mappingId={}, reason={}", mappingId, ex.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error(ex.getMessage()));
        }
    }

    /**
     * 디러티 PENDING_PAYMENT 매핑 일괄 수동 정리 (최대 50건).
     */
    @PostMapping("/mappings/pending-payment-dirty/bulk-cleanup")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PendingPaymentCleanupResult>> bulkCleanupPendingPaymentMappings(
            @RequestBody @Valid PendingPaymentBulkCleanupRequest request,
            HttpSession session) {
        int total = request.getMappingIds() != null ? request.getMappingIds().size() : 0;
        log.info("🧹 [R4] PENDING_PAYMENT 매핑 일괄 정리: count={}", total);

        String actor = resolveActor(session);
        PendingPaymentCleanupResult result = adminMappingCleanupService.bulkCleanupPendingPaymentMappings(
                request.getMappingIds(), request.getReason(), request.getNotifyClient(), actor);
        return success("매칭 일괄 정리가 완료되었습니다.", result);
    }

    private String resolveActor(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return "ADMIN_CLEANUP";
        }
        return currentUser.getName() != null ? currentUser.getName() : "ADMIN_CLEANUP";
    }
}

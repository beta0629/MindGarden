package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.SessionRecoveryRequest;
import com.coresolution.consultation.dto.SessionRecoveryResponse;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.scheduler.SessionDeductionRecoveryBatch;
import com.coresolution.consultation.scheduler.SessionDeductionRecoveryBatch.RecoveryResult;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.ErrorResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 어드민 운영 유지보수 트리거 컨트롤러.
 *
 * <p>현재 노출 엔드포인트:</p>
 * <ul>
 *   <li>POST {@code /api/v1/admin/maintenance/session-recovery}
 *       — 회기 차감 누락 보정 (mapping#93 P1).
 *       Body: {@code {"mappingId": 93}} 또는 {@code {"all": true}}.</li>
 * </ul>
 *
 * <p>권한: 2026-06 4종 SSOT (PR-2/9) 후 {@code ADMIN} 단일.
 * 회기 차감 보정은 위험도가 높아 STAFF 는 제외한다. 레거시 SUPER_ADMIN /
 * HQ_ADMIN / BRANCH_SUPER_ADMIN 은 {@link com.coresolution.consultation.constant.UserRole#fromString}
 * 에서 ADMIN 으로 매핑되므로 호환된다.
 * 멀티테넌트: 어드민 토큰의 tenantId 기준으로 매핑 조회.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 * @updated 2026-06 - 4종 SSOT 적용 (PR-2/9)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/maintenance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminMaintenanceController extends BaseApiController {

    private final ScheduleService scheduleService;
    private final ConsultantClientMappingRepository mappingRepository;
    private final SessionDeductionRecoveryBatch sessionDeductionRecoveryBatch;

    /**
     * 회기 차감 누락 보정 트리거.
     *
     * @param request {@code mappingId} 단건 또는 {@code all=true} 전체
     * @return 처리 결과 (processed / skipped / alerted)
     */
    @PostMapping("/session-recovery")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> recoverSessionDeductions(@RequestBody SessionRecoveryRequest request) {
        if (request == null
                || ((request.getMappingId() == null) && !Boolean.TRUE.equals(request.getAll()))) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("mappingId 또는 all=true 중 하나가 필요합니다."));
        }
        if (Boolean.TRUE.equals(request.getAll())) {
            log.info("session deduction recovery: manual_recovery=batch trigger");
            RecoveryResult result = sessionDeductionRecoveryBatch.runRecovery();
            SessionRecoveryResponse response = SessionRecoveryResponse.builder()
                    .processed(result.success())
                    .skipped(result.skipped())
                    .alerted(result.alerted())
                    .build();
            log.info("session deduction recovery: manual_recovery=batch result candidates={}, success={}, skipped={}, alerted={}",
                    result.candidates(), result.success(), result.skipped(), result.alerted());
            return success("회기 차감 보정 배치를 실행했습니다.", response);
        }
        Long mappingId = request.getMappingId();
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("테넌트 컨텍스트가 없습니다."));
        }
        ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(tenantId, mappingId)
                .orElse(null);
        if (mapping == null) {
            return ResponseEntity.status(404)
                    .body(ErrorResponse.of(
                            "매핑을 찾을 수 없습니다. mappingId=" + mappingId,
                            "MAPPING_NOT_FOUND",
                            404));
        }
        log.info("session deduction recovery: manual_recovery=single mappingId={}", mappingId);
        int processed = scheduleService.recoverMissedSessionDeductionsForMapping(mapping);
        SessionRecoveryResponse response = SessionRecoveryResponse.builder()
                .processed(processed)
                .skipped(0)
                .alerted(0)
                .build();
        log.info("session deduction recovery: manual_recovery=single mappingId={}, processed={}",
                mappingId, processed);
        return success("매핑 회기 차감 보정 완료.", response);
    }
}

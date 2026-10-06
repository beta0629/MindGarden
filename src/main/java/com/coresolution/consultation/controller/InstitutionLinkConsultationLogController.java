package com.coresolution.consultation.controller;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.dto.InstitutionLinkConsultationLogCreateRequest;
import com.coresolution.consultation.dto.InstitutionLinkConsultationLogResponse;
import com.coresolution.consultation.service.InstitutionLinkConsultationLogService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 타기관 연계 상담일지 API. 회기권 {@code /api/v1/schedules/consultation-records} 와 분리한다.
 *
 * <p>예외는 삼키지 않고 {@code GlobalExceptionHandler} 에 위임한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/institution-link/consultation-records")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class InstitutionLinkConsultationLogController extends BaseApiController {

    private final InstitutionLinkConsultationLogService institutionLinkConsultationLogService;

    /**
     * 타기관 연계 상담일지 작성.
     *
     * @param request 작성 요청
     * @return 저장된 일지
     */
    @PostMapping
    public ResponseEntity<ApiResponse<InstitutionLinkConsultationLogResponse>> create(
            @Valid @RequestBody InstitutionLinkConsultationLogCreateRequest request) {
        log.info("타기관 연계 상담일지 작성: mappingId={}, contractId={}, scheduleId={}",
                request.getMappingId(), request.getContractId(), request.getScheduleId());
        String tenantId = TenantContextHolder.getRequiredTenantId();
        InstitutionLinkConsultationLogResponse saved =
                institutionLinkConsultationLogService.create(tenantId, request);
        return created("타기관 연계 상담일지가 작성되었습니다.", saved);
    }

    /**
     * 월말 상담내역 목록.
     *
     * @param contractId 계약 ID
     * @param mappingId 매핑 ID
     * @param billingYearMonth 청구 연월
     * @return 월내 일지 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<InstitutionLinkConsultationLogResponse>>> list(
            @RequestParam(required = false) Long contractId,
            @RequestParam(required = false) Long mappingId,
            @RequestParam String billingYearMonth) {
        log.info("타기관 연계 월말 상담내역 조회: mappingId={}, contractId={}, billingYearMonth={}",
                mappingId, contractId, billingYearMonth);
        List<InstitutionLinkConsultationLogResponse> records =
                institutionLinkConsultationLogService.listByBillingMonth(contractId, mappingId, billingYearMonth);
        return success(records);
    }

    /**
     * 스케줄(또는 매핑) 기준 최신 타기관 일지. 재오픈 로드용.
     *
     * <p>회기권 {@code /api/v1/schedules/consultation-records} 와 분리한다.</p>
     *
     * @param scheduleId 스케줄 ID
     * @param mappingId 매핑 ID
     * @return 최신 일지. 없으면 data null
     */
    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<InstitutionLinkConsultationLogResponse>> latest(
            @RequestParam(required = false) Long scheduleId,
            @RequestParam(required = false) Long mappingId) {
        log.info("타기관 연계 상담일지 최신 조회: scheduleId={}, mappingId={}", scheduleId, mappingId);
        Optional<InstitutionLinkConsultationLogResponse> found =
                institutionLinkConsultationLogService.findLatestByScheduleOrMapping(scheduleId, mappingId);
        return success(found.orElse(null));
    }

    /**
     * 타기관 연계 상담일지 단건.
     *
     * @param recordId 일지 ID
     * @return 일지
     */
    @GetMapping("/{recordId}")
    public ResponseEntity<ApiResponse<InstitutionLinkConsultationLogResponse>> get(
            @PathVariable Long recordId) {
        return success(institutionLinkConsultationLogService.getById(recordId));
    }

    /**
     * 타기관 연계 상담일지 수정.
     *
     * @param recordId 일지 ID
     * @param request 수정 본문
     * @return 수정된 일지
     */
    @PutMapping("/{recordId}")
    public ResponseEntity<ApiResponse<InstitutionLinkConsultationLogResponse>> update(
            @PathVariable Long recordId,
            @Valid @RequestBody InstitutionLinkConsultationLogCreateRequest request) {
        log.info("타기관 연계 상담일지 수정: recordId={}", recordId);
        InstitutionLinkConsultationLogResponse saved =
                institutionLinkConsultationLogService.update(recordId, request);
        return success("타기관 연계 상담일지가 수정되었습니다.", saved);
    }

    /**
     * 월 실적 완료. 회기권 잔여 회기를 차감하지 않는다.
     *
     * @param recordId 일지 ID
     * @return 완료된 일지
     */
    @PostMapping("/{recordId}/complete")
    public ResponseEntity<ApiResponse<InstitutionLinkConsultationLogResponse>> complete(
            @PathVariable Long recordId) {
        log.info("타기관 연계 상담일지 완료: recordId={}", recordId);
        InstitutionLinkConsultationLogResponse saved = institutionLinkConsultationLogService.complete(recordId);
        return success("타기관 연계 상담일지가 완료되었습니다.", saved);
    }
}

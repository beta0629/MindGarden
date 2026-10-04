package com.coresolution.consultation.controller;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.dto.InstitutionLinkConsultationLogCreateRequest;
import com.coresolution.consultation.dto.InstitutionLinkConsultationLogResponse;
import com.coresolution.consultation.service.InstitutionLinkConsultationLogService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ConsultationRecordAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
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
    private final ClientPathAccessGuard clientPathAccessGuard;
    private final ConsultationRecordAccessGuard consultationRecordAccessGuard;

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
     * <p>계약·매핑 단위로 여러 상담사의 일지 본문이 섞이므로 같은 테넌트 관리자·사무원만 허용한다
     * (월말 청구·실적 용도). 상담사 본인 범위 목록이 필요해지면 작성자 기준 필터를 추가한다.</p>
     *
     * @param contractId 계약 ID
     * @param mappingId 매핑 ID
     * @param billingYearMonth 청구 연월
     * @param session HTTP 세션
     * @return 월내 일지 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<InstitutionLinkConsultationLogResponse>>> list(
            @RequestParam(required = false) Long contractId,
            @RequestParam(required = false) Long mappingId,
            @RequestParam String billingYearMonth,
            HttpSession session) {
        log.info("타기관 연계 월말 상담내역 조회: mappingId={}, contractId={}, billingYearMonth={}",
                mappingId, contractId, billingYearMonth);
        clientPathAccessGuard.requireTenantManager(session);
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
     * @param session HTTP 세션
     * @return 최신 일지. 없으면 data null
     */
    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<InstitutionLinkConsultationLogResponse>> latest(
            @RequestParam(required = false) Long scheduleId,
            @RequestParam(required = false) Long mappingId,
            HttpSession session) {
        log.info("타기관 연계 상담일지 최신 조회: scheduleId={}, mappingId={}", scheduleId, mappingId);
        consultationRecordAccessGuard.requireConsultationRecordRole(session);
        Optional<InstitutionLinkConsultationLogResponse> found =
                institutionLinkConsultationLogService.findLatestByScheduleOrMapping(scheduleId, mappingId);
        // 자원이 특정된 뒤 작성자·관리자까지 검증 (다른 상담사의 일지 본문 비노출).
        found.ifPresent(latestLog -> consultationRecordAccessGuard
                .requireInstitutionLinkLogReadAccess(session, latestLog.getId()));
        return success(found.orElse(null));
    }

    /**
     * 타기관 연계 상담일지 단건.
     *
     * @param recordId 일지 ID
     * @param session HTTP 세션
     * @return 일지
     */
    @GetMapping("/{recordId}")
    public ResponseEntity<ApiResponse<InstitutionLinkConsultationLogResponse>> get(
            @PathVariable Long recordId,
            HttpSession session) {
        consultationRecordAccessGuard.requireInstitutionLinkLogReadAccess(session, recordId);
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

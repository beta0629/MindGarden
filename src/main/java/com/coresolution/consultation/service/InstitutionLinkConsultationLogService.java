package com.coresolution.consultation.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.dto.InstitutionLinkConsultationLogCreateRequest;
import com.coresolution.consultation.dto.InstitutionLinkConsultationLogResponse;

/**
 * 타기관 연계 상담일지 서비스. 회기 {@code consultation_records} 에 쓰지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
public interface InstitutionLinkConsultationLogService {

    /**
     * 타기관 일지를 저장한다. remainingSessions·sessionSequence 검증을 하지 않는다.
     *
     * @param tenantId 테넌트 ID
     * @param request 생성 요청
     * @return 저장된 일지
     * @throws IllegalStateException tenantId 가 없거나 공백인 경우
     * @throws com.coresolution.consultation.exception.EntityNotFoundException 계약·매핑이 테넌트에 없을 때
     * @throws com.coresolution.consultation.exception.ValidationException 필수값 누락 또는 회기권 매핑
     */
    InstitutionLinkConsultationLogResponse create(String tenantId,
            InstitutionLinkConsultationLogCreateRequest request);

    /**
     * 레거시 스케줄 일지 payload 를 타기관 경로로 저장한다.
     *
     * @param recordData 스케줄 컨트롤러 본문
     * @return 저장된 일지
     */
    InstitutionLinkConsultationLogResponse createFromSchedulePayload(Map<String, Object> recordData);

    /**
     * 월말 상담내역 목록.
     *
     * @param contractId 계약 ID
     * @param mappingId 매핑 ID
     * @param billingYearMonth 청구 연월({@code yyyy-MM})
     * @return 월내 일지 목록
     */
    List<InstitutionLinkConsultationLogResponse> listByBillingMonth(
            Long contractId,
            Long mappingId,
            String billingYearMonth);

    /**
     * 단건 조회.
     *
     * @param recordId 일지 ID
     * @return 일지
     */
    InstitutionLinkConsultationLogResponse getById(Long recordId);

    /**
     * 스케줄(또는 매핑) 기준 최신 타기관 일지. 회기권 {@code consultation_records} 는 조회하지 않는다.
     *
     * @param scheduleId 스케줄 ID
     * @param mappingId 매핑 ID({@code scheduleId} 없을 때)
     * @return 최신 일지. 없으면 empty
     */
    Optional<InstitutionLinkConsultationLogResponse> findLatestByScheduleOrMapping(
            Long scheduleId,
            Long mappingId);

    /**
     * 타기관 일지 본문 수정. 회기권 테이블·잔여 회기를 건드리지 않는다.
     *
     * @param recordId 일지 ID
     * @param request 수정 본문({@code mappingId}/{@code contractId} 변경 없음)
     * @return 수정된 일지
     */
    InstitutionLinkConsultationLogResponse update(Long recordId,
            InstitutionLinkConsultationLogCreateRequest request);

    /**
     * 월 실적 완료. 회기권 잔여 회기를 차감하지 않는다.
     *
     * @param recordId 일지 ID
     * @return 완료된 일지
     */
    InstitutionLinkConsultationLogResponse complete(Long recordId);
}

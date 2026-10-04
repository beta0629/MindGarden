package com.coresolution.consultation.service;

import java.util.Optional;
import com.coresolution.consultation.dto.ConsultationRecordDraftResponse;

/**
 * 상담일지 서버 초안(자동저장) 서비스.
 *
 * <p>초안 본문은 확정 일지와 같은 암호화 변환기로 저장되며, 접근 권한 판정은
 * {@link com.coresolution.consultation.service.support.ConsultationRecordDraftAccessGuard}
 * 가 컨트롤러 진입 시 수행한다(작성자 본인 전용 — 상담사·관리자 모두 본인 id 키).</p>
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
public interface ConsultationRecordDraftService {

    /**
     * 초안 조회.
     *
     * @param tenantId 테넌트 ID
     * @param consultationId 상담(스케줄) ID
     * @param consultantId 상담사 ID
     * @return 초안(없으면 empty)
     */
    Optional<ConsultationRecordDraftResponse> getDraft(String tenantId, Long consultationId, Long consultantId);

    /**
     * 초안 조회 — 초안 키는 작성자 본인 users.id.
     *
     * @param tenantId 테넌트 ID
     * @param consultationId 상담(스케줄) ID
     * @param ownerUserId 초안 소유자(작성자 본인) users.id
     * @param managerOwner 같은 테넌트 관리자 계열 소유자면 true (일정 담당 상담사 일치 검사 생략 — 가드가 판정)
     * @return 초안(없으면 empty)
     */
    Optional<ConsultationRecordDraftResponse> getDraft(String tenantId, Long consultationId, Long ownerUserId,
            boolean managerOwner);

    /**
     * 초안 upsert (테넌트·상담·상담사 단위 1건).
     *
     * @param tenantId 테넌트 ID
     * @param consultationId 상담(스케줄) ID
     * @param consultantId 상담사 ID
     * @param payloadJson JSON 문자열
     * @param expectedVersion 기대 버전(null이면 검사 생략)
     * @return 저장 후 응답
     */
    ConsultationRecordDraftResponse upsertDraft(
            String tenantId,
            Long consultationId,
            Long consultantId,
            String payloadJson,
            Long expectedVersion);

    /**
     * 초안 upsert — 초안 키는 작성자 본인 users.id (테넌트·상담·소유자 단위 1건).
     *
     * @param tenantId 테넌트 ID
     * @param consultationId 상담(스케줄) ID
     * @param ownerUserId 초안 소유자(작성자 본인) users.id
     * @param payloadJson JSON 문자열
     * @param expectedVersion 기대 버전(null이면 검사 생략)
     * @param managerOwner 같은 테넌트 관리자 계열 소유자면 true (일정 담당 상담사 일치 검사 생략 — 가드가 판정)
     * @return 저장 후 응답
     */
    ConsultationRecordDraftResponse upsertDraft(
            String tenantId,
            Long consultationId,
            Long ownerUserId,
            String payloadJson,
            Long expectedVersion,
            boolean managerOwner);

    /**
     * 초안 삭제 (버리기·확정 저장 완료 시). 없으면 아무 것도 하지 않는다.
     *
     * @param tenantId 테넌트 ID
     * @param consultationId 상담(스케줄) ID
     * @param consultantId 상담사 ID
     * @return 실제로 삭제했으면 true
     */
    boolean deleteDraft(String tenantId, Long consultationId, Long consultantId);
}

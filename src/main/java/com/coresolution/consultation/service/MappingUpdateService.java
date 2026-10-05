package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.dto.ConsultantClientMappingResponse;

/**
 * 매칭 수정 — ERP 동기화(UpdateMappingInfo)와 매칭 저장을 순서대로 부르는 트랜잭션 없는 조정자.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public interface MappingUpdateService {

    /**
     * 입금 확인된 매칭의 금액·회기 변경이면 ERP 동기화를 먼저 실행하고(실패 시 422·변경 없음), 그 다음 매칭을 저장한다.
     *
     * @param id 매칭 ID
     * @param request 수정 요청
     * @param updatedBy 수정자
     * @return 수정된 매칭
     */
    ConsultantClientMappingResponse update(Long id, ConsultantClientMappingCreateRequest request, String updatedBy);
}

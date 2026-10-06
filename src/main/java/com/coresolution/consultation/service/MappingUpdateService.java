package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.dto.ConsultantClientMappingResponse;

/**
 * 매칭 수정 진입점 — 트랜잭션 밖에서 {@link AdminService#updateMapping} 트랜잭션을 실행하고, 외부 알림은 커밋 뒤에 보낸다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public interface MappingUpdateService {

    /**
     * 매칭과 (입금 확인된 매칭의 금액 변경이면) 차액 조정 전표를 한 트랜잭션에서 저장한다. 실패하면 둘 다 롤백된다.
     *
     * @param id 매칭 ID
     * @param request 수정 요청
     * @param updatedBy 수정자
     * @return 수정된 매칭
     */
    ConsultantClientMappingResponse update(Long id, ConsultantClientMappingCreateRequest request, String updatedBy);
}

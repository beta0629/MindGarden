package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.SessionSuccessionPreviewResponse;
import com.coresolution.consultation.dto.SessionSuccessionRequest;
import com.coresolution.consultation.dto.SessionSuccessionResponse;

/**
 * 회기 승계 서비스 — 스케줄 점유분을 제외한 remaining을 수혜자 매핑으로 이전.
 *
 * @author CoreSolution
 * @since 2026-08-22
 */
public interface SessionSuccessionService {

    /**
     * 승계가능 미리보기.
     *
     * @param sourceMappingId 소스 매핑 ID
     * @return 미리보기
     */
    SessionSuccessionPreviewResponse preview(Long sourceMappingId);

    /**
     * 회기 승계 실행. ERP 거래 재작성 없음. 스케줄 행 미변경.
     *
     * @param sourceMappingId 소스 매핑 ID
     * @param request         실행 요청
     * @param actorUserId     행위자 users.id
     * @param actorRole       행위자 역할 코드
     * @return 실행 결과
     */
    SessionSuccessionResponse execute(
            Long sourceMappingId,
            SessionSuccessionRequest request,
            Long actorUserId,
            String actorRole);
}

package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.dto.selfassessment.SelfAssessmentResultResponse;
import com.coresolution.consultation.dto.selfassessment.SelfAssessmentSubmitRequest;
import com.coresolution.consultation.entity.User;

/**
 * Expo {@code SELF_ASSESSMENT_API} 서비스.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
public interface SelfAssessmentService {

    /**
     * 제출 이력 목록(최신순).
     *
     * @param client 내담자
     * @return 결과 배열
     */
    List<SelfAssessmentResultResponse> listMine(User client);

    /**
     * 단건 상세.
     *
     * @param client 내담자
     * @param id     제출 PK
     * @return 결과
     */
    SelfAssessmentResultResponse getMineById(User client, long id);

    /**
     * 제출.
     *
     * @param client  내담자
     * @param request 본문
     * @return 저장된 결과
     */
    SelfAssessmentResultResponse submit(User client, SelfAssessmentSubmitRequest request);

    /**
     * 상담사 공유 여부 수정.
     *
     * @param client                내담자
     * @param id                    제출 PK
     * @param sharedWithConsultant 공유 여부
     */
    void updateShare(User client, long id, boolean sharedWithConsultant);
}

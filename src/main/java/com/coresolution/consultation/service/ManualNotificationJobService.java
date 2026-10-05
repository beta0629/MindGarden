package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.ManualNotificationConfigResponse;
import com.coresolution.consultation.dto.ManualNotificationJobPreviewResponse;
import com.coresolution.consultation.dto.ManualNotificationJobRequest;
import com.coresolution.consultation.dto.ManualNotificationJobResponse;
import com.coresolution.consultation.entity.User;

/**
 * 어드민 수동 다중 발송 작업(전체 내담자·제외, 확인 단계, 비동기 발송).
 *
 * @author MindGarden
 * @since 2026-10-05
 */
public interface ManualNotificationJobService {

    /**
     * 화면 설정(수신자 상한 등).
     *
     * @return 설정
     */
    ManualNotificationConfigResponse getConfig();

    /**
     * 대상 집합을 확정해 확인 단계 정보를 돌려준다(저장·발송 없음).
     *
     * @param tenantId 테넌트 ID
     * @param request  요청
     * @return 미리보기
     */
    ManualNotificationJobPreviewResponse preview(String tenantId, ManualNotificationJobRequest request);

    /**
     * 대상 집합을 다시 확정해 미리보기 토큰과 같을 때만 작업을 만든다. 같은 멱등 키면 기존 작업을 돌려준다.
     *
     * @param tenantId    테넌트 ID
     * @param currentUser 요청 관리자
     * @param request     요청
     * @return 작업
     */
    ManualNotificationJobResponse createJob(String tenantId, User currentUser, ManualNotificationJobRequest request);

    /**
     * 작업 진행·요약.
     *
     * @param tenantId       테넌트 ID
     * @param jobUuid        작업 UUID
     * @param includeRecords 수신자별 기록 포함 여부
     * @return 작업
     */
    ManualNotificationJobResponse getJob(String tenantId, String jobUuid, boolean includeRecords);
}

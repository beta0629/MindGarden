package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.GardenGrowthEventType;
import com.coresolution.consultation.dto.MindGardenEventApplyResponse;
import com.coresolution.consultation.dto.MindGardenServerStateResponse;
import com.coresolution.consultation.dto.admin.wellness.MindGardenAdminSnapshotResponse;
import com.coresolution.consultation.dto.admin.wellness.MindGardenAdminSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 내담자 「마음 정원」서버 권위 상태 (MVP 인메모리).
 *
 * @author MindGarden
 * @since 2026-05-13
 */
public interface ClientMindGardenService {

    /**
     * 현재 서버 상태를 조회한다. 최초 호출 시 시드 상태를 만든다.
     *
     * @param tenantId 테넌트 ID
     * @param userId   내담자 사용자 PK
     * @return 서버 상태
     */
    MindGardenServerStateResponse getServerState(String tenantId, long userId);

    /**
     * 성장 이벤트를 적용한다. 주간 캡·멱등을 검증한다.
     *
     * @param tenantId  테넌트 ID
     * @param userId    내담자 사용자 PK
     * @param eventType 이벤트 유형
     * @param sourceId  멱등용 소스 ID (nullable)
     * @return 적용 결과
     */
    MindGardenEventApplyResponse applyEvent(
            String tenantId,
            long userId,
            GardenGrowthEventType eventType,
            String sourceId);

    /**
     * BW-6: 테넌트 내 인메모리 정원 스냅샷 목록(읽기 전용).
     *
     * @param tenantId 테넌트 ID
     * @param pageable 페이지
     * @return 페이지
     */
    Page<MindGardenAdminSnapshotResponse> listSnapshotsForAdmin(String tenantId, Pageable pageable);

    /**
     * BW-6: 테넌트 단위 정원 요약(인메모리).
     *
     * @param tenantId 테넌트 ID
     * @return 요약
     */
    MindGardenAdminSummaryResponse summarizeForAdmin(String tenantId);
}

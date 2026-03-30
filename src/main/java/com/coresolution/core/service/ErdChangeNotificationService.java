package com.coresolution.core.service;

import java.util.List;

/**
 * ERD 변경 알림 서비스 인터페이스
 * <p>
 * ERD가 변경되었을 때 테넌트에게 알림을 발송합니다.
 * </p>
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface ErdChangeNotificationService {

    /**
     * ERD 변경 알림 발송
     *
     * @param tenantId 테넌트 ID (null이면 전체 시스템 ERD 변경)
     * @param diagramId ERD 다이어그램 ID
     * @param changeDescription 변경 설명
     * @param version 변경된 버전
     */
    void notifyErdChange(String tenantId, String diagramId, String changeDescription, Integer version);

    /**
     * 여러 테넌트에게 ERD 변경 알림 발송
     *
     * @param tenantIds 테넌트 ID 목록
     * @param diagramId ERD 다이어그램 ID
     * @param changeDescription 변경 설명
     * @param version 변경된 버전
     * @return 알림 발송 성공 수
     */
    int notifyErdChangeToTenants(List<String> tenantIds, String diagramId, String changeDescription, Integer version);

    /**
     * 스키마 변경으로 인한 ERD 재생성 알림 발송
     *
     * @param tenantId 테넌트 ID
     * @param changedTableNames 변경된 테이블 이름 목록
     */
    void notifySchemaChange(String tenantId, List<String> changedTableNames);
}


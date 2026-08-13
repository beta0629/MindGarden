package com.coresolution.consultation.service;

import java.time.LocalDate;
import com.coresolution.consultation.dto.prediction.DismissExpectedVisitRequest;
import com.coresolution.consultation.dto.prediction.UnbookedExpectedClientResponse;
import com.coresolution.consultation.dto.prediction.VisitPredictionSettingsUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 방문 예측 서비스 인터페이스
 *
 * <p>예상 방문일인데 미예약인 내담자 목록을 산출하고,
 * 무시/예측끄기 설정을 관리한다.</p>
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-08-13
 */
public interface VisitPredictionService {

    /**
     * 미예약 예상 방문 내담자 목록 조회
     *
     * @param tenantId     테넌트 ID
     * @param startDate    조회 시작일
     * @param endDate      조회 종료일
     * @param consultantId 상담사 ID (선택, null이면 전체)
     * @param pageable     페이지네이션
     * @return 미예약 예상 내담자 페이지
     */
    Page<UnbookedExpectedClientResponse> findUnbookedExpectedClients(
            String tenantId,
            LocalDate startDate,
            LocalDate endDate,
            Long consultantId,
            Pageable pageable);

    /**
     * 예상 방문일 1회 무시 처리
     *
     * @param tenantId 테넌트 ID
     * @param request  무시 요청 (mappingId, expectedDate)
     */
    void dismissExpectedVisit(String tenantId, DismissExpectedVisitRequest request);

    /**
     * 매핑별 예측 설정 변경 (ON/OFF 토글)
     *
     * @param tenantId  테넌트 ID
     * @param mappingId 매핑 ID
     * @param request   설정 변경 요청
     */
    void updatePredictionSettings(String tenantId, Long mappingId, VisitPredictionSettingsUpdateRequest request);
}

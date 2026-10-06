package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.ClientDirectBookingRequest;
import com.coresolution.consultation.dto.ClientDirectBookingResponse;

/**
 * 내담자 직접 예약 — 가예약으로 접수하고 센터가 확정한다.
 *
 * <p>회기 차감·ERP 수입은 여기서 일어나지 않는다. 확정은 기존 일정 확정 경로, 차감·수입은 결제(입금 확인·당일 카드 결제)
 * 경로에서 한 번만 일어난다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
public interface ClientDirectBookingService {

    /**
     * 현재 테넌트에서 내담자 본인의 가예약을 만든다.
     *
     * @param clientId 세션 내담자 사용자 ID (요청 본문 값이 아님)
     * @param request  예약 요청
     * @return 생성된 가예약
     * @throws com.coresolution.consultation.exception.ValidationException 상담 유형이 공통코드에 없을 때
     * @throws com.coresolution.consultation.exception.SchedulePastTimeException 시작 시각이 지났을 때
     * @throws com.coresolution.consultation.exception.ClientBookingRejectedException 매칭·휴무·슬롯 충돌 등
     */
    ClientDirectBookingResponse createTentativeBooking(Long clientId, ClientDirectBookingRequest request);
}

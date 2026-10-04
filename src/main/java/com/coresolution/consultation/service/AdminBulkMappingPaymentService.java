package com.coresolution.consultation.service;

import java.util.List;

import com.coresolution.consultation.dto.admin.BulkMappingPaymentResult;

/**
 * 관리자 일괄 매칭 결제 확인·취소.
 *
 * <p>사전 검증은 전부 아니면 전무다: 상태가 맞지 않는 매칭이 하나라도 있으면 아무것도 처리하지 않는다.
 * 처리 단계는 매칭마다 독립 트랜잭션이고, 외부 알림은 각 트랜잭션 커밋 뒤(커넥션 반환 뒤)에 보낸다.
 * 형식·테넌트 검증은 호출 전에 {@code ResourceOwnerAccessGuard} 가 끝낸다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
public interface AdminBulkMappingPaymentService {

    /**
     * 일괄 결제 취소(매칭 종료·원장 환불). 쇼핑 주문(PG) 결제 매칭은 대상이 아니다.
     *
     * @param mappingIds 중복 제거·테넌트 검증된 매칭 ID
     * @param reason     취소 사유
     * @return 처리 결과
     * @throws com.coresolution.consultation.exception.MappingAlreadyProcessedException
     *         이미 종료·취소된 매칭 또는 쇼핑 주문 결제 매칭이 하나라도 있을 때 (아무것도 처리하지 않음)
     */
    BulkMappingPaymentResult cancelMappings(List<Long> mappingIds, String reason);

    /**
     * 일괄 결제 확인. 결제 대기(PENDING_PAYMENT) 매칭만 대상이며, 2건 이상이면 금액이 패키지 금액 합계와 같아야 하고
     * 각 매칭에는 자기 패키지 금액이 기록된다.
     *
     * @param mappingIds    중복 제거·테넌트 검증된 매칭 ID
     * @param paymentMethod 결제 수단
     * @param rawAmount     요청 본문의 금액 값 (정수 숫자 또는 숫자 문자열)
     * @return 처리 결과
     * @throws IllegalArgumentException 결제 수단·금액이 없거나 잘못되었거나 합계가 맞지 않을 때 (아무것도 처리하지 않음)
     * @throws com.coresolution.consultation.exception.MappingAlreadyProcessedException
     *         결제 대기가 아닌 매칭이 하나라도 있을 때 (아무것도 처리하지 않음)
     */
    BulkMappingPaymentResult confirmMappings(List<Long> mappingIds, String paymentMethod, Object rawAmount);
}

package com.coresolution.consultation.service;

import java.util.Optional;

import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;

/**
 * 입금 확인된 매칭의 패키지 금액 변경 재무 전표 — 유일한 writer.
 *
 * <p>호출자(매칭 수정) 트랜잭션에 반드시 참여한다. 매칭 변경과 전표가 같이 커밋되거나 같이 롤백된다.
 * 기존 전표는 지우거나 고치지 않고 차액만 조정 INCOME 으로 남긴다(감액은 음수).</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public interface MappingPackageLedgerService {

    /**
     * 감액 하한 검사: 새 금액이 (결제액 − 누적 환불액) 미만이면 거부한다.
     *
     * @param mapping         변경 전 매칭 (테넌트 스코프로 조회한 행)
     * @param newPackagePrice 새 패키지 금액
     * @throws com.coresolution.consultation.exception.MappingAmountBelowRefundFloorException 하한 미만이거나 결제액을 알 수 없음
     */
    void assertDecreaseAllowed(ConsultantClientMapping mapping, long newPackagePrice);

    /**
     * 패키지 금액 차액 조정 INCOME 을 기록한다. 같은 변경(같은 baseVersion)의 두 번째 기록은 DB UNIQUE 로 거부된다.
     *
     * @param mapping         매칭
     * @param oldPackagePrice 변경 전 금액
     * @param newPackagePrice 변경 후 금액
     * @param baseVersion     변경 전 매칭 version (멱등 키)
     * @param actor           수정자
     * @return 기록한 전표, 차액이 0 이면 empty
     */
    Optional<FinancialTransaction> recordPackagePriceAdjustment(ConsultantClientMapping mapping,
            long oldPackagePrice, long newPackagePrice, long baseVersion, String actor);
}

package com.coresolution.consultation.dto;

import com.coresolution.consultation.entity.ConsultantClientMapping;

/**
 * 매칭 수정의 금액 변경 판정 — 매칭 수정 트랜잭션 안에서만 쓴다(영속 매칭을 담는다).
 *
 * @param mapping          같은 트랜잭션에서 조회한 영속 매칭
 * @param ledgerAdjustment 입금 확인된 매칭의 금액 변경이라 조정 전표가 필요함
 * @param oldPackagePrice  변경 전 금액
 * @param newPackagePrice  변경 후 금액
 * @param baseVersion      변경 전 매칭 version (조정 전표 멱등 키)
 * @author CoreSolution
 * @since 2026-10-05
 */
public record MappingPackageChange(ConsultantClientMapping mapping, boolean ledgerAdjustment, long oldPackagePrice,
        long newPackagePrice, long baseVersion) {

    /**
     * @return 조정 전표 대상인 감액
     */
    public boolean isLedgerDecrease() {
        return ledgerAdjustment && newPackagePrice < oldPackagePrice;
    }
}

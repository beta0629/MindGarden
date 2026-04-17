package com.coresolution.consultation.service.erp.accounting;

/**
 * ERP 재무 데이터 소급(D8) 전용 서비스.
 * <p>
 * 레거시 스키마·의미 혼용을 정리하는 배치용 훅이다. 운영 전 테넌트 일괄 실행·스케줄러 직결은 금지한다.
 * 구현·절차: {@code docs/project-management/ERP_TAX_ACCOUNTING_DECISIONS_2026.md} (D8 소급 절차).
 *
 * @author CoreSolution
 * @since 2026-04-17
 */
public interface ErpFinancialDataRetrofitService {

    /**
     * 레거시: 원천징수 예정액이 {@code tax_amount}에만 있던 거래를 {@code withholding_tax_amount}로 이관하는 소급 작업.
     * <p>
     * <b>설계 전제(코드 주석 요약):</b>
     * <ul>
     * <li>대상 행은 테넌트·거래 유형·카테고리(프리랜스/사업소득 등)로 좁힌 뒤, {@code withholding_tax_amount}가 0이고
     *     {@code tax_amount}가 양수인 경우 등 규칙으로 식별한다(실제 규칙은 운영 데이터 샘플로 확정).</li>
     * <li>실제 UPDATE 전 반드시 dry-run(SELECT-only 또는 미리보기 결과 집계)으로 건수·합계·표본 ID를 감사 로그에 남긴다.</li>
     * <li>파괴적 일괄 UPDATE 없이, 행 단위 트랜잭션 또는 배치 청크 + 롤백 전략을 문서화한 뒤 실행한다.</li>
     * </ul>
     * 현재 구현은 dry-run(읽기 전용) 집계만 수행하며 DB를 변경하지 않는다.
     *
     * @param tenantId 격리된 테넌트 ID (필수)
     */
    void retrofitWithholdingFromLegacyTaxAmount(String tenantId);
}

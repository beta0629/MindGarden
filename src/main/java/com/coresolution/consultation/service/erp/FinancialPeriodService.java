package com.coresolution.consultation.service.erp;

import java.time.LocalDate;

import com.coresolution.consultation.entity.erp.financial.FinancialPeriod;
import com.coresolution.consultation.entity.erp.financial.PeriodType;

/**
 * 재무 마감 기간 SSOT 서비스.
 *
 * <p>합의서: docs/project-management/2026-05-28/ERP_FINANCIAL_CLOSE_IMPLEMENTATION_PLAN.md §4.1.</p>
 *
 * <ul>
 *   <li>{@link #isPeriodClosed} — 거래 수정·삭제 가드 (Q3)</li>
 *   <li>{@link #closePeriod} — 합산 + 부가세 가드(Q8) + dry-run(Q7) + retry(Q9)</li>
 *   <li>{@link #reopenPeriod} — HQ_ADMIN 재오픈 (Q6, 사유 ≥ 20자)</li>
 *   <li>{@link #getPeriodStatus} — 단건 상태 조회</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
public interface FinancialPeriodService {

    /**
     * 거래일자가 닫힌(CLOSED 또는 REOPENED) 기간에 속하는지 검사한다.
     *
     * <p>{@code FinancialTransactionServiceImpl} 가 거래 수정·삭제 진입부에서 본 메서드 결과로
     * {@link com.coresolution.consultation.exception.PeriodClosedException} 을 throw 한다 (Q3).</p>
     *
     * @param tenantId 테넌트 ID (필수)
     * @param date 검사할 거래일자
     * @param type 기간 단위 (보통 {@link PeriodType#DAY})
     * @return 닫힌 기간이면 true
     */
    boolean isPeriodClosed(String tenantId, LocalDate date, PeriodType type);

    /**
     * 단건 기간을 마감한다 (Q8 부가세 가드 + Q7 dry-run + Q9 retry).
     *
     * <p>dry-run=true 인 경우 합산만 수행하고 row 미삽입.
     * dry-run=false 인 경우 financial_period row 를 UPSERT (status=CLOSED).
     * 부가세 누적 차이 감지 시 {@link com.coresolution.consultation.exception.TaxIntegrityException} throw.</p>
     *
     * @param tenantId 테넌트 ID (필수)
     * @param periodStart 기간 시작일
     * @param type 기간 단위
     * @return 마감된 기간 row (dry-run 시 in-memory 합산 결과; persist 되지 않음)
     */
    FinancialPeriod closePeriod(String tenantId, LocalDate periodStart, PeriodType type);

    /**
     * 닫힌 기간을 재오픈한다 (Q6).
     *
     * <p>HQ_ADMIN 만 호출 가능 (호출자 역할 검증은 호출자 또는 컨트롤러에서 수행).
     * 사유는 최소 20자 필수, audit 기록 발생.</p>
     *
     * @param tenantId 테넌트 ID
     * @param periodId 재오픈할 financial_period.id
     * @param reason 재오픈 사유 (≥ 20자)
     * @param reopenedBy 재오픈 호출자 식별자 (HQ_ADMIN user_id)
     * @return 재오픈된 기간 row
     */
    FinancialPeriod reopenPeriod(String tenantId, Long periodId, String reason, String reopenedBy);

    /**
     * 단건 기간 상태 조회 — 어드민 결산 관리 화면용.
     *
     * @param tenantId 테넌트 ID
     * @param date 조회할 날짜 (해당 날짜를 포함하는 기간 검색)
     * @param type 기간 단위
     * @return 매칭되는 기간 (없으면 null)
     */
    FinancialPeriod getPeriodStatus(String tenantId, LocalDate date, PeriodType type);
}

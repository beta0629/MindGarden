package com.coresolution.consultation.service.impl;

import java.util.List;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.erp.accounting.ErpFinancialDataRetrofitService;
import com.coresolution.core.context.TenantIsolationValidator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * D8 소급: 원천징수 레거시({@code tax_amount} 단일 저장) → {@code withholding_tax_amount} 정리.
 * <p>
 * <b>안전 장치:</b>
 * <ul>
 * <li>기본 프로파일에서는 빈이 등록되지 않음 — {@code erp.financial.retrofit.enabled=true} 와 함께
 *     선택적으로 {@code erp-retrofit} 프로파일을 켠 환경에서만 로드(운영에서 무심코 전 테넌트 배치에 연결되지 않도록).</li>
 * <li>향후 호출 경로는 {@link com.coresolution.consultation.controller.erp.AccountingBackfillController}와 동일하게
 *     <strong>관리자 세션 + 테넌트 컨텍스트</strong>로만 노출할 것. 스케줄러에 주입 금지.</li>
 * <li>실제 UPDATE 구현 시 dry-run 단계 없이 실행하지 말 것({@code ERP_TAX_ACCOUNTING_DECISIONS_2026.md} D8 절차).</li>
 * </ul>
 * <p>
 * <b>D8 dry-run 한계:</b> 후보 식별은 INCOME·{@code withholding=0}·{@code tax_amount&gt;0}·
 * 서브카테고리/설명/비고의 보수적 LIKE(프리랜스·원천·사업소득)뿐이다.
 * VAT만 있는 정상 거래와 혼동하거나 레거시 변형 문구는 누락될 수 있으므로, 본 이관 전 운영 샘플·대사로 규칙을 확정한다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-17
 */
@Slf4j
@Service
@Profile("erp-retrofit")
@ConditionalOnProperty(
        name = "erp.financial.retrofit.enabled",
        havingValue = "true",
        matchIfMissing = false)
@RequiredArgsConstructor
public class ErpFinancialDataRetrofitServiceImpl implements ErpFinancialDataRetrofitService {

    /** 표본으로 로그에 남길 거래 ID 상한. */
    private static final int D8_SAMPLE_ID_LIMIT = 10;

    /** 서브카테고리 문자열에 FREELANCE 포함(대소문자 무시, {@link com.coresolution.consultation.util.FreelanceWithholdingTaxUtil} 정합). */
    private static final String LIKE_PATTERN_FREELANCE_SUB = "%freelance%";

    /** 설명·비고에 원천 관련 문구 포함 시(레거시 혼용 가능 맥락). */
    private static final String LIKE_PATTERN_WITHHOLDING_KR = "%원천%";

    /** 설명에 사업소득 문구 포함 시(신규 입금 설명과 정합). */
    private static final String LIKE_PATTERN_BUSINESS_INCOME_KR = "%사업소득%";

    private final FinancialTransactionRepository financialTransactionRepository;

    @Override
    public void retrofitWithholdingFromLegacyTaxAmount(String tenantId) {
        TenantIsolationValidator.requireTenantIdMatch(tenantId);
        long candidateCount = countD8WithholdingLegacyCandidates(tenantId);
        List<Long> sampleIds = findD8SampleCandidateIds(tenantId);
        log.info(
                "[ERP D8 retrofit] dry-run(읽기 전용): 원천 레거시(tax_amount)→withholding 후보. tenantId={}, "
                        + "candidateCount={}, sampleIds(max {})={}",
                tenantId,
                candidateCount,
                D8_SAMPLE_ID_LIMIT,
                sampleIds);
    }

    private long countD8WithholdingLegacyCandidates(String tenantId) {
        return financialTransactionRepository.countD8WithholdingLegacyCandidates(
                tenantId,
                LIKE_PATTERN_FREELANCE_SUB,
                LIKE_PATTERN_WITHHOLDING_KR,
                LIKE_PATTERN_BUSINESS_INCOME_KR);
    }

    private List<Long> findD8SampleCandidateIds(String tenantId) {
        return financialTransactionRepository.findD8WithholdingLegacyCandidateIds(
                tenantId,
                LIKE_PATTERN_FREELANCE_SUB,
                LIKE_PATTERN_WITHHOLDING_KR,
                LIKE_PATTERN_BUSINESS_INCOME_KR,
                PageRequest.of(0, D8_SAMPLE_ID_LIMIT));
    }
}

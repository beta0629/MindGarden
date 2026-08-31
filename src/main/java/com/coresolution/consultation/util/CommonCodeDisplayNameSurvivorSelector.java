package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.ExpenseCommonCodeSsotConstants;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/**
 * 동일 tenant+group+표시명 중복 공통코드 중 생존자 선정.
 * <p>
 * Flyway {@code V20260831_004} 와 동일 정신:
 * </p>
 * <ol>
 *   <li>시드 SSOT code_value 우선</li>
 *   <li>financial_transactions 매칭 건수(내림차순)</li>
 *   <li>recurring_expenses 매칭 건수(내림차순)</li>
 *   <li>더 이른 created_at, 그다음 더 작은 id</li>
 * </ol>
 *
 * @author MindGarden
 * @since 2026-08-31
 */
public final class CommonCodeDisplayNameSurvivorSelector {

    private CommonCodeDisplayNameSurvivorSelector() {
    }

    /**
     * 생존자 후보.
     *
     * @param id 공통코드 PK
     * @param codeValue 코드 값
     * @param createdAt 생성 시각 (null 이면 최후로 취급)
     * @param financialTransactionCount FT category|subcategory 매칭 건수
     * @param recurringExpenseCount recurring category|subcategory|expenseType 매칭 건수
     */
    public record Candidate(
            Long id,
            String codeValue,
            LocalDateTime createdAt,
            long financialTransactionCount,
            long recurringExpenseCount
    ) {
        /**
         * @param id PK
         * @param codeValue 코드 값
         * @param createdAt 생성 시각
         * @param financialTransactionCount FT 건수
         * @param recurringExpenseCount recurring 건수
         */
        public Candidate {
            Objects.requireNonNull(id, "id");
            Objects.requireNonNull(codeValue, "codeValue");
        }
    }

    /**
     * 후보 중 생존자 1건을 선정한다. 후보가 비어 있으면 null.
     *
     * @param codeGroup 코드 그룹 (시드 집합 판별)
     * @param candidates 동일 표시명 미소거 후보 (≥1)
     * @return 생존자 후보
     */
    public static Candidate selectSurvivor(String codeGroup, List<Candidate> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return null;
        }
        Set<String> seedValues = ExpenseCommonCodeSsotConstants.seedCodeValuesForGroup(codeGroup);
        return candidates.stream()
                .min(survivorComparator(seedValues))
                .orElse(null);
    }

    private static Comparator<Candidate> survivorComparator(Set<String> seedValues) {
        return Comparator
                .comparingInt((Candidate c) -> seedValues.contains(c.codeValue()) ? 0 : 1)
                .thenComparing(Comparator.comparingLong(Candidate::financialTransactionCount).reversed())
                .thenComparing(Comparator.comparingLong(Candidate::recurringExpenseCount).reversed())
                .thenComparing(c -> c.createdAt() != null ? c.createdAt() : LocalDateTime.MAX)
                .thenComparing(Candidate::id);
    }
}

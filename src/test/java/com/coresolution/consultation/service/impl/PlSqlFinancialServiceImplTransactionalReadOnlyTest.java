package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.transaction.annotation.Transactional;

/**
 * 운영 P1-A hotfix 2026-06-11 회귀 가드: {@link PlSqlFinancialServiceImpl} 의 procedure CALL
 * 메서드(5개)는 {@code @Transactional(readOnly = true)} 가 부여되어서는 안 된다.
 *
 * <p><b>회귀 방지 대상</b>: 2026-04-XX 부터 운영 매일 04:00 {@code getBranchFinancialBreakdown}
 * 등에서 발생한 {@code Connection is read-only. Queries leading to data modification are not allowed}
 * 예외. MySQL procedure 본문이 {@code MODIFIES SQL DATA} characteristic 을 가지므로 readOnly
 * 트랜잭션 컨텍스트에서 CALL 시 충돌.
 *
 * <p>대상 5개 메서드 (라인 변경에 영향받지 않도록 이름으로 검증):
 * <ul>
 *   <li>{@code getBranchFinancialBreakdown}  ★ P1-A 핵심</li>
 *   <li>{@code getMonthlyFinancialTrend}</li>
 *   <li>{@code getCategoryFinancialBreakdown}</li>
 *   <li>{@code generateQuarterlyFinancialReport}</li>
 *   <li>{@code calculateFinancialKPIs}</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@DisplayName("PlSqlFinancialServiceImpl procedure CALL 메서드 readOnly=true 금지 회귀 가드 (운영 P1-A)")
class PlSqlFinancialServiceImplTransactionalReadOnlyTest {

    @ParameterizedTest(name = "{0} 메서드는 readOnly=true 금지 (procedure CALL → MODIFIES SQL DATA 충돌)")
    @ValueSource(strings = {
            "getBranchFinancialBreakdown",
            "getMonthlyFinancialTrend",
            "getCategoryFinancialBreakdown",
            "generateQuarterlyFinancialReport",
            "calculateFinancialKPIs"
    })
    void procedureCallMethods_mustNotBeReadOnlyTransactional(String methodName) throws Exception {
        Method method = findPublicMethod(methodName);

        Transactional tx = method.getAnnotation(Transactional.class);
        assertThat(tx)
                .as("%s: procedure CALL 메서드는 @Transactional 이 반드시 부여되어야 함", methodName)
                .isNotNull();
        assertThat(tx.readOnly())
                .as("%s: readOnly=true 는 'Connection is read-only' 운영 회귀를 유발 (P1-A 차단)",
                        methodName)
                .isFalse();
    }

    @ParameterizedTest(name = "{0} 메서드는 plain SELECT → readOnly=true 유지 허용 (보존 가드)")
    @ValueSource(strings = {
            "getConsolidatedFinancialData",
            "generateMonthlyFinancialReport",
            "generateYearlyFinancialReport"
    })
    void plainSelectMethods_keepReadOnlyTrue(String methodName) throws Exception {
        Method method = findPublicMethod(methodName);

        Transactional tx = method.getAnnotation(Transactional.class);
        assertThat(tx)
                .as("%s: plain SELECT 메서드는 @Transactional 이 부여되어야 함", methodName)
                .isNotNull();
        assertThat(tx.readOnly())
                .as("%s: plain SELECT 는 readOnly=true 유지 (성능·정합)", methodName)
                .isTrue();
    }

    /**
     * 메서드 이름만으로 매칭 (시그니처 변경 회귀 회피).
     */
    private Method findPublicMethod(String methodName) {
        for (Method m : PlSqlFinancialServiceImpl.class.getDeclaredMethods()) {
            if (m.getName().equals(methodName) && java.lang.reflect.Modifier.isPublic(m.getModifiers())) {
                return m;
            }
        }
        throw new AssertionError("public 메서드를 찾을 수 없습니다: " + methodName);
    }
}

package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.LocalDate;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.service.CommonCodeService;

/**
 * 급여·세금 영역 SalaryScheduleServiceImpl 단위 테스트 (기산일·기간 계산)
 * 시나리오: docs/project-management/SALARY_TAX_TEST_SCENARIOS.md §1.2
 *
 * @author MindGarden
 * @since 2026-03-16
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SalaryScheduleServiceImpl 단위 테스트")
class SalaryScheduleServiceImplTest {

    private static final String GROUP_SALARY_BASE_DATE = "SALARY_BASE_DATE";
    private static final String CODE_MONTHLY_BASE_DAY = "MONTHLY_BASE_DAY";
    private static final String CODE_PAYMENT_DAY = "PAYMENT_DAY";
    private static final String CODE_CUTOFF_DAY = "CUTOFF_DAY";

    @Mock
    private CommonCodeService commonCodeService;

    @InjectMocks
    private SalaryScheduleServiceImpl salaryScheduleService;

    private static CommonCode commonCodeWithExtraData(String extraData) {
        CommonCode code = new CommonCode();
        code.setExtraData(extraData);
        return code;
    }

    @Nested
    @DisplayName("getBaseDate")
    class GetBaseDate {

        @Test
        @DisplayName("U-SCH-01: 공통코드 LAST_DAY → 2월 말일 (2025-02-28)")
        void lastDay_returnsLastDayOfMonth() {
            when(commonCodeService.getCode(GROUP_SALARY_BASE_DATE, CODE_MONTHLY_BASE_DAY))
                    .thenReturn(commonCodeWithExtraData("{\"default_day\":\"LAST_DAY\"}"));

            LocalDate actual = salaryScheduleService.getBaseDate(2025, 2);
            assertThat(actual).isEqualTo(LocalDate.of(2025, 2, 28));
        }

        @Test
        @DisplayName("U-SCH-02: 공통코드 특정일(25일) → 2025-02-25")
        void specificDay_returnsThatDay() {
            when(commonCodeService.getCode(GROUP_SALARY_BASE_DATE, CODE_MONTHLY_BASE_DAY))
                    .thenReturn(commonCodeWithExtraData("{\"default_day\":\"25\"}"));

            LocalDate actual = salaryScheduleService.getBaseDate(2025, 2);
            assertThat(actual).isEqualTo(LocalDate.of(2025, 2, 25));
        }

        @Test
        @DisplayName("U-SCH-03: 해당 월 일수 초과(31일, 2월) → 2025-02-28")
        void dayExceedsLastDay_returnsLastDayOfMonth() {
            when(commonCodeService.getCode(GROUP_SALARY_BASE_DATE, CODE_MONTHLY_BASE_DAY))
                    .thenReturn(commonCodeWithExtraData("{\"default_day\":\"31\"}"));

            LocalDate actual = salaryScheduleService.getBaseDate(2025, 2);
            assertThat(actual).isEqualTo(LocalDate.of(2025, 2, 28));
        }

        @Test
        @DisplayName("U-SCH-04: 공통코드 null/예외 시 폴백 → 해당 월 말일")
        void nullOrException_fallbackToLastDayOfMonth() {
            when(commonCodeService.getCode(GROUP_SALARY_BASE_DATE, CODE_MONTHLY_BASE_DAY))
                    .thenReturn(null);

            LocalDate actual = salaryScheduleService.getBaseDate(2025, 1);
            assertThat(actual).isEqualTo(LocalDate.of(2025, 1, 31));
        }
    }

    @Nested
    @DisplayName("getCalculationPeriod")
    class GetCalculationPeriod {

        @Test
        @DisplayName("U-SCH-05: 1월 → 전년 12월 기산일+1일 ~ 1월 기산일")
        void january_returnsDecBasePlusOneToJanBase() {
            when(commonCodeService.getCode(GROUP_SALARY_BASE_DATE, CODE_MONTHLY_BASE_DAY))
                    .thenReturn(commonCodeWithExtraData("{\"default_day\":\"LAST_DAY\"}"));

            LocalDate[] period = salaryScheduleService.getCalculationPeriod(2026, 1);
            assertThat(period[0]).isEqualTo(LocalDate.of(2025, 12, 31).plusDays(1));
            assertThat(period[1]).isEqualTo(LocalDate.of(2026, 1, 31));
        }

        @Test
        @DisplayName("U-SCH-06: 2월 이상 → 전월 기산일+1일 ~ 당월 기산일 (3월 예시)")
        void march_returnsFebBasePlusOneToMarBase() {
            when(commonCodeService.getCode(GROUP_SALARY_BASE_DATE, CODE_MONTHLY_BASE_DAY))
                    .thenReturn(commonCodeWithExtraData("{\"default_day\":\"LAST_DAY\"}"));

            LocalDate[] period = salaryScheduleService.getCalculationPeriod(2025, 3);
            assertThat(period[0]).isEqualTo(LocalDate.of(2025, 2, 28).plusDays(1));
            assertThat(period[1]).isEqualTo(LocalDate.of(2025, 3, 31));
        }

        @Test
        @DisplayName("U-SCH-07: 12월 → 11월 기산일+1일 ~ 12월 기산일")
        void december_returnsNovBasePlusOneToDecBase() {
            when(commonCodeService.getCode(GROUP_SALARY_BASE_DATE, CODE_MONTHLY_BASE_DAY))
                    .thenReturn(commonCodeWithExtraData("{\"default_day\":\"LAST_DAY\"}"));

            LocalDate[] period = salaryScheduleService.getCalculationPeriod(2025, 12);
            assertThat(period[0]).isEqualTo(LocalDate.of(2025, 11, 30).plusDays(1));
            assertThat(period[1]).isEqualTo(LocalDate.of(2025, 12, 31));
        }
    }

    @Nested
    @DisplayName("getPaymentDate")
    class GetPaymentDate {

        @Test
        @DisplayName("U-SCH-08: 익월 지급일, 2월→3월 5일")
        void february_paymentDay5_returnsMarch5() {
            when(commonCodeService.getCode(GROUP_SALARY_BASE_DATE, CODE_PAYMENT_DAY))
                    .thenReturn(commonCodeWithExtraData("{\"default_day\":5}"));

            LocalDate actual = salaryScheduleService.getPaymentDate(2025, 2);
            assertThat(actual).isEqualTo(LocalDate.of(2025, 3, 5));
        }

        @Test
        @DisplayName("U-SCH-09: 익월 일수 초과(31일, 2월→3월) → 3월 31일")
        void february_paymentDay31_returnsMarch31() {
            when(commonCodeService.getCode(GROUP_SALARY_BASE_DATE, CODE_PAYMENT_DAY))
                    .thenReturn(commonCodeWithExtraData("{\"default_day\":31}"));

            LocalDate actual = salaryScheduleService.getPaymentDate(2025, 2);
            assertThat(actual).isEqualTo(LocalDate.of(2025, 3, 31));
        }
    }

    @Nested
    @DisplayName("getCutoffDate")
    class GetCutoffDate {

        @Test
        @DisplayName("U-SCH-10: LAST_DAY → 2025-06-30")
        void lastDay_returnsLastDayOfMonth() {
            when(commonCodeService.getCode(GROUP_SALARY_BASE_DATE, CODE_CUTOFF_DAY))
                    .thenReturn(commonCodeWithExtraData("{\"default_day\":\"LAST_DAY\"}"));

            LocalDate actual = salaryScheduleService.getCutoffDate(2025, 6);
            assertThat(actual).isEqualTo(LocalDate.of(2025, 6, 30));
        }
    }
}

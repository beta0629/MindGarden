package com.coresolution.consultation.salary;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * 급여 월의 등록·보정 가능 시각.
 *
 * <p>계산 기간은 달력 월(기산일 규칙) 그대로다. 그 달의 최종 잠금은 익월
 * {@link #DEFAULT_GRACE_DAYS}일 23:59:59까지 열리고, 그 다음 날 00:00(Asia/Seoul)부터 닫힌다.
 * 2026-09 는 2026-10-03 23:59:59 KST 까지 보정 가능하고 2026-10-04 00:00:00 KST 부터 잠긴다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-02
 */
public final class PayrollConfirmGrace {

    /**
     * 익월 보정 일수. 별도 설정이 없을 때의 기본값.
     * 9월 급여는 10월 3일 끝까지 고칠 수 있다.
     */
    public static final int DEFAULT_GRACE_DAYS = 3;

    /** 급여 확정·배치 시각의 기준 시간대. */
    public static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    /**
     * 보정 기간이 끝난 뒤 같은 달 재확정을 거절할 때 화면·API에 보여주는 문구.
     */
    public static final String ALREADY_CONFIRMED_AFTER_GRACE =
            "동일 상담사·동일 월에 급여 확정이 이미 있습니다. 익월 보정 기간이 끝나 다시 확정할 수 없습니다.";

    /**
     * 지급이 끝난 급여는 보정 기간이어도 확정으로 금액을 바꾸지 않는다.
     */
    public static final String PAID_NOT_REPLACEABLE =
            "지급 완료된 급여는 다시 확정할 수 없습니다. 추가 정산을 사용하세요.";

    private PayrollConfirmGrace() {
    }

    /**
     * 급여 월. 기산일(기간 끝)이 속한 달이다.
     *
     * @param periodEnd 계산 기간 종료일
     * @return 급여 월
     */
    public static YearMonth payrollMonth(LocalDate periodEnd) {
        return YearMonth.from(periodEnd);
    }

    /**
     * 기본 보정 일수(3)로 아직 고칠 수 있는지.
     *
     * @param payrollMonth 급여 월
     * @param now          판단 시각
     * @return 익월 보정 마지막 날 끝이 지나기 전이면 true
     */
    public static boolean isCorrectionOpen(YearMonth payrollMonth, Instant now) {
        return isCorrectionOpen(payrollMonth, now, DEFAULT_GRACE_DAYS);
    }

    /**
     * {@code now} 가 익월 {@code graceDays}일 23:59:59.999... KST 이전이면 열린다.
     * 잠금 시각은 그 다음 날 00:00:00 KST 다.
     *
     * @param payrollMonth 급여 월
     * @param now          판단 시각
     * @param graceDays    익월 보정 일수 (1 이상)
     * @return 보정이 열려 있으면 true
     */
    public static boolean isCorrectionOpen(YearMonth payrollMonth, Instant now, int graceDays) {
        if (payrollMonth == null || now == null || graceDays < 1) {
            return false;
        }
        ZonedDateTime lockStart = payrollMonth.plusMonths(1)
                .atDay(graceDays)
                .plusDays(1)
                .atStartOfDay(ZONE);
        return now.isBefore(lockStart.toInstant());
    }
}

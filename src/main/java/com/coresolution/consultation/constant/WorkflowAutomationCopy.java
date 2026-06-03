package com.coresolution.consultation.constant;

/**
 * 워크플로우 자동화(일일/월간 성과 요약, 미완료 알림 등) 메시지 카피 상수.
 *
 * <p>P1 보안 가드(2026-06-03 라운드 2): 상담사(CONSULTANT) 메시지함에 매출/수익 라인이 노출되지 않도록
 * 일일 성과 요약 본문에서는 {@link #DAILY_SUMMARY_BODY_FMT} 만 사용한다.
 * 매출 정보는 ADMIN/STAFF 가 수신하는 월간 리포트({@link #MONTHLY_REPORT_BODY_FMT})에만 포함한다.
 *
 * @author MindGarden
 * @since 2026-06-03
 */
public final class WorkflowAutomationCopy {

    private WorkflowAutomationCopy() {
    }

    /** 일일 성과 요약 알림 제목 (상담사 수신). */
    public static final String DAILY_SUMMARY_TITLE = "일일 성과 요약";

    /**
     * 일일 성과 요약 알림 본문 템플릿 (상담사 수신).
     * 인자 순서: 날짜(LocalDate), 완료된 상담 건수(int), 평균 평점(double).
     *
     * <p>상담사에게는 매출/수익 정보를 노출하지 않는다. 매출 라인이 필요한 경우 ADMIN/STAFF 채널의
     * {@link #MONTHLY_REPORT_BODY_FMT} 또는 별도 관리자 리포트에서 사용한다.
     */
    public static final String DAILY_SUMMARY_BODY_FMT = """
            오늘의 상담 성과 요약
            📅 날짜: %s
            ✅ 완료된 상담: %d건
            ⭐ 평균 평점: %.1f점""";

    /** 월간 성과 리포트 알림 제목 (관리자 수신). */
    public static final String MONTHLY_REPORT_TITLE = "월간 성과 리포트";

    /**
     * 월간 성과 리포트 본문 템플릿 (ADMIN/STAFF 수신, 매출 정보 포함 허용).
     * 인자 순서: 월 라벨, 시작일, 종료일, 총 상담 건수, 총 수익, 평균 평점.
     */
    public static final String MONTHLY_REPORT_BODY_FMT = """
            월간 성과 리포트 (%s)
            📅 기간: %s ~ %s
            ✅ 총 상담 건수: %d건
            💰 총 수익: %s원
            ⭐ 평균 평점: %.1f점""";

    /** 미완료 상담 알림 제목 (상담사 수신). */
    public static final String INCOMPLETE_CONSULTATION_TITLE = "미완료 상담 알림";

    /**
     * 미완료 상담 알림 본문 템플릿 (상담사 수신).
     * 인자 순서: 일자, 시작 시간, 종료 시간, 내담자 라벨.
     */
    public static final String INCOMPLETE_CONSULTATION_BODY_FMT = """
            상담 시간이 지났지만 완료 처리되지 않았습니다.
            📅 일시: %s %s-%s
            👤 내담자: %s""";

    /** 미완료 알림 본문에서 사용하는 익명 내담자 라벨. */
    public static final String INCOMPLETE_CONSULTATION_CLIENT_LABEL = "내담자";
}

package com.coresolution.consultation.constant;

import java.time.DayOfWeek;
import java.util.Collections;
import java.util.EnumMap;
import java.util.Map;

/**
 * 방문 예측(Visit Prediction) 도메인 상수
 *
 * <p>예상 방문일 계산·미예약 판정에 사용되는 임계값 및 설정 기본값을 정의한다.
 * 하드코딩 방지를 위해 매직넘버를 상수화한다.</p>
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-08-13
 */
public final class VisitPredictionConstants {

    private VisitPredictionConstants() {
    }

    /** 패턴 계산 활성화에 필요한 최소 COMPLETED 회기 수 */
    public static final int MIN_COMPLETED_SESSIONS_FOR_PATTERN = 3;

    /** 간격 계산에 사용할 최근 완료 일정의 최대 수 */
    public static final int RECENT_SESSIONS_FOR_INTERVAL = 5;

    /** 신뢰도 '높음' 임계값 (confidence >= 0.7) */
    public static final double CONFIDENCE_HIGH_THRESHOLD = 0.7;

    /** 신뢰도 '보통' 하한 임계값 (confidence >= 0.4) */
    public static final double CONFIDENCE_MEDIUM_THRESHOLD = 0.4;

    /** 신뢰도 최솟값 클램프 */
    public static final double CONFIDENCE_MIN = 0.0;

    /** 신뢰도 최댓값 클램프 */
    public static final double CONFIDENCE_MAX = 1.0;

    /** D-N 알림: 예상 방문일 N일 전 알림 발송 기본값 */
    public static final int REMINDER_DAYS_BEFORE = 3;

    /** 주 1회 간격 (일) */
    public static final int INTERVAL_WEEKLY = 7;

    /** 격주 간격 (일) */
    public static final int INTERVAL_BIWEEKLY = 14;

    /** 요일 한글명 매핑 */
    public static final Map<DayOfWeek, String> DAY_OF_WEEK_KOREAN;

    static {
        EnumMap<DayOfWeek, String> map = new EnumMap<>(DayOfWeek.class);
        map.put(DayOfWeek.MONDAY, "월요일");
        map.put(DayOfWeek.TUESDAY, "화요일");
        map.put(DayOfWeek.WEDNESDAY, "수요일");
        map.put(DayOfWeek.THURSDAY, "목요일");
        map.put(DayOfWeek.FRIDAY, "금요일");
        map.put(DayOfWeek.SATURDAY, "토요일");
        map.put(DayOfWeek.SUNDAY, "일요일");
        DAY_OF_WEEK_KOREAN = Collections.unmodifiableMap(map);
    }
}

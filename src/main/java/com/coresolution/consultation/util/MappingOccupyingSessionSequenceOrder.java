package com.coresolution.consultation.util;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.Schedule;

/**
 * 한 매핑의 점유 상담 일정을 날짜·시작 시각·id 순으로 1..N 회차에 대응시킨다.
 *
 * <p>번호만 계산한다. 저장, 회기 차감·복원, 테넌트 조회는 호출자가 한다.</p>
 *
 * @author MindGarden
 * @since 2026-10-11
 */
public final class MappingOccupyingSessionSequenceOrder {

    /**
     * 회차의 시작 번호. 상담 회차는 1부터 센다.
     */
    public static final int FIRST_OCCUPYING_SESSION_SEQUENCE = 1;

    private static final Comparator<Schedule> CHRONOLOGY = Comparator
            .comparing(MappingOccupyingSessionSequenceOrder::dateOf, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(MappingOccupyingSessionSequenceOrder::startOf, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(Schedule::getId, Comparator.nullsLast(Comparator.naturalOrder()));

    private MappingOccupyingSessionSequenceOrder() {
    }

    /**
     * 점유 일정을 날짜, 시작 시각, id 오름차순으로 1..N에 대응시킨다.
     *
     * @param occupying 재부여 대상. null 원소는 제외한다
     * @return 일정 인스턴스별 새 회차. 입력이 비어 있으면 빈 맵
     */
    public static Map<Schedule, Integer> assignSequences(List<Schedule> occupying) {
        List<Schedule> ordered = new ArrayList<>();
        if (occupying != null) {
            for (Schedule schedule : occupying) {
                if (schedule != null) {
                    ordered.add(schedule);
                }
            }
        }
        ordered.sort(CHRONOLOGY);
        // Schedule.equals 는 id 를 보지 않는다. 같은 슬롯의 다른 행이 HashMap 에서 덮이지 않게 인스턴스 기준으로 담는다.
        Map<Schedule, Integer> assigned = new IdentityHashMap<>();
        int sequence = FIRST_OCCUPYING_SESSION_SEQUENCE;
        for (Schedule schedule : ordered) {
            assigned.put(schedule, sequence);
            sequence++;
        }
        return assigned;
    }

    private static LocalDate dateOf(Schedule schedule) {
        return schedule == null ? null : schedule.getDate();
    }

    private static LocalTime startOf(Schedule schedule) {
        return schedule == null ? null : schedule.getStartTime();
    }
}

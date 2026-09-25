package com.coresolution.consultation.service.statistics;

import java.time.LocalDate;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 상담 완료 통계의 GROUP BY 결과(상담사별·일자별)를 메모리 인덱스로 바꾼다.
 * 조회 자체는 tenantId 조건이 있는 리포지토리 쿼리 한 곳이다.
 *
 * @author MindGarden
 * @since 2026-09-25
 */
public final class ConsultationCompletionCountIndex {

    private ConsultationCompletionCountIndex() {
    }

    /**
     * @param rows [0]=consultantId, [1]=count. null 이면 빈 맵
     * @return 상담사 ID → 건수. 없는 ID 는 {@link #countOf} 가 0
     */
    public static Map<Long, Long> byConsultant(List<Object[]> rows) {
        if (rows == null || rows.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : rows) {
            Long consultantId = longAt(row, 0);
            Long count = longAt(row, 1);
            if (consultantId == null || count == null) {
                continue;
            }
            counts.put(consultantId, count);
        }
        return counts;
    }

    /**
     * @param rows [0]=date, [1]=count. null 이면 빈 맵
     * @return 일자 → 건수
     */
    public static Map<LocalDate, Long> byDate(List<Object[]> rows) {
        if (rows == null || rows.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<LocalDate, Long> counts = new HashMap<>();
        for (Object[] row : rows) {
            if (row == null || row.length < 2 || row[0] == null) {
                continue;
            }
            LocalDate date = toLocalDate(row[0]);
            Long count = longAt(row, 1);
            if (date == null || count == null) {
                continue;
            }
            counts.put(date, count);
        }
        return counts;
    }

    /**
     * @param counts 상담사별 건수. null 이면 0
     * @param consultantId 상담사 ID
     * @return 없으면 0
     */
    public static long countOf(Map<Long, Long> counts, Long consultantId) {
        if (counts == null || consultantId == null) {
            return 0L;
        }
        Long count = counts.get(consultantId);
        return count == null ? 0L : count;
    }

    /**
     * 시작·종료일 포함 합계. 추이 구간의 completedCount 와 같다.
     *
     * @param counts 일자별 건수
     * @param start  시작일(포함)
     * @param end    종료일(포함)
     * @return 구간 합
     */
    public static long sumBetween(Map<LocalDate, Long> counts, LocalDate start, LocalDate end) {
        if (counts == null || counts.isEmpty() || start == null || end == null || start.isAfter(end)) {
            return 0L;
        }
        long sum = 0L;
        for (Map.Entry<LocalDate, Long> entry : counts.entrySet()) {
            LocalDate date = entry.getKey();
            if (date == null || date.isBefore(start) || date.isAfter(end)) {
                continue;
            }
            Long count = entry.getValue();
            if (count != null) {
                sum += count;
            }
        }
        return sum;
    }

    private static Long longAt(Object[] row, int index) {
        if (row == null || row.length <= index || !(row[index] instanceof Number)) {
            return null;
        }
        return ((Number) row[index]).longValue();
    }

    private static LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate) {
            return (LocalDate) value;
        }
        if (value instanceof java.sql.Date) {
            return ((java.sql.Date) value).toLocalDate();
        }
        return null;
    }
}

package com.coresolution.consultation.util;

import java.text.Collator;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * 상담사 선택 시 상담일지 정렬.
 * 묶음은 기간 내 최근 상담일 내림차순, 같으면 표시명(없으면 뒤), 그다음 내담자 id.
 * 묶음 안은 최근 순(상담일 내림차순, 같으면 회기 내림차순)이다.
 *
 * <p>표시명은 저장 시 암호화되어 있어 SQL {@code ORDER BY} 키가 아니다.
 * 집계로 최근 상담일을 정한 뒤 이 함수가 페이지를 자르기 전에 순서를 정한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-11
 */
public final class ConsultationLogGroupOrdering {

    private ConsultationLogGroupOrdering() {
        throw new UnsupportedOperationException("유틸리티 클래스입니다.");
    }

    /**
     * @param rows 필터에 걸린 전체 정렬 키. null 이면 빈 목록
     * @param lastSessionDateByClient 기간 집계의 최근 상담일. 페이지 행으로 다시 계산하지 않는다
     * @param clientNameById 복호화된 표시명. 없거나 공백이면 이름 없음으로 보고 같은 최근일 안에서 뒤로 보낸다
     * @return 묶음 순서의 새 목록
     */
    public static List<ConsultationLogSortRow> orderByClientGroup(List<ConsultationLogSortRow> rows,
            Map<Long, LocalDate> lastSessionDateByClient, Map<Long, String> clientNameById) {
        if (rows == null || rows.isEmpty()) {
            return List.of();
        }
        Map<Long, LocalDate> lastDates = lastSessionDateByClient == null ? Map.of() : lastSessionDateByClient;
        Map<Long, String> names = clientNameById == null ? Map.of() : clientNameById;
        Collator collator = Collator.getInstance(Locale.KOREAN);
        collator.setStrength(Collator.PRIMARY);
        List<ConsultationLogSortRow> ordered = new ArrayList<>(rows);
        ordered.sort(comparator(lastDates, names, collator));
        return ordered;
    }

    private static Comparator<ConsultationLogSortRow> comparator(Map<Long, LocalDate> lastDates,
            Map<Long, String> names, Collator collator) {
        return (left, right) -> compare(left, right, lastDates, names, collator);
    }

    private static int compare(ConsultationLogSortRow left, ConsultationLogSortRow right,
            Map<Long, LocalDate> lastDates, Map<Long, String> names, Collator collator) {
        Long clientA = left.clientId();
        Long clientB = right.clientId();
        if (clientA == null || clientB == null) {
            if (clientA == null && clientB == null) {
                return Long.compare(idOf(left), idOf(right));
            }
            return clientA == null ? 1 : -1;
        }
        if (!clientA.equals(clientB)) {
            int byGroup = compareGroup(clientA, clientB, lastDates, names, collator);
            if (byGroup != 0) {
                return byGroup;
            }
        }
        return ConsultationLogTimelineOrdering.compareRecent(left, right);
    }

    private static int compareGroup(Long clientA, Long clientB, Map<Long, LocalDate> lastDates,
            Map<Long, String> names, Collator collator) {
        LocalDate lastA = lastDates.get(clientA);
        LocalDate lastB = lastDates.get(clientB);
        if (lastA == null || lastB == null) {
            if (!(lastA == null && lastB == null)) {
                return lastA == null ? 1 : -1;
            }
        } else {
            int byDate = lastB.compareTo(lastA);
            if (byDate != 0) {
                return byDate;
            }
        }
        String nameA = presentName(names.get(clientA));
        String nameB = presentName(names.get(clientB));
        boolean missingA = nameA == null;
        boolean missingB = nameB == null;
        if (missingA != missingB) {
            return missingA ? 1 : -1;
        }
        if (!missingA) {
            int byName = collator.compare(nameA, nameB);
            if (byName != 0) {
                return byName;
            }
        }
        return Long.compare(clientA, clientB);
    }

    private static String presentName(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }
        return name.trim();
    }

    private static long idOf(ConsultationLogSortRow row) {
        return row.id() == null ? Long.MAX_VALUE : row.id();
    }
}

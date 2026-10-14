package com.coresolution.consultation.util;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * 내담자 한 명의 타임라인 정렬과 쪽 자르기.
 * 상담사 선택 묶음 안의 회차도 같은 최근 순 비교를 쓴다.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */
public final class ConsultationLogTimelineOrdering {

    private static final int MISSING_SESSION_RANK = Integer.MAX_VALUE;

    private ConsultationLogTimelineOrdering() {
        throw new UnsupportedOperationException("유틸리티 클래스입니다.");
    }

    /**
     * @param rows 한 내담자(또는 둘 다 선택)의 정렬 키. null 이면 빈 목록
     * @param sort 최근 순 또는 회기 순. null 이면 최근 순
     * @return 새 목록
     */
    public static List<ConsultationLogSortRow> order(List<ConsultationLogSortRow> rows,
            ConsultationLogTimelineSort sort) {
        if (rows == null || rows.isEmpty()) {
            return List.of();
        }
        ConsultationLogTimelineSort safeSort = sort == null ? ConsultationLogTimelineSort.RECENT : sort;
        List<ConsultationLogSortRow> ordered = new ArrayList<>(rows);
        ordered.sort(comparator(safeSort));
        return ordered;
    }

    /**
     * 쪽 바로 앞 행을 함께 돌려 구간 라벨을 다시 그릴지 화면이 판단하게 한다.
     *
     * @param ordered 이미 정렬된 전체
     * @param pageIndex 0부터
     * @param pageSize 1 미만이면 1
     * @return 쪽 행과 직전 행
     */
    public static Slice page(List<ConsultationLogSortRow> ordered, int pageIndex, int pageSize) {
        List<ConsultationLogSortRow> source = ordered == null ? List.of() : ordered;
        int total = source.size();
        int size = pageSize > 0 ? pageSize : 1;
        int index = Math.max(pageIndex, 0);
        int from = (int) Math.min((long) index * size, total);
        int to = (int) Math.min(from + (long) size, total);
        ConsultationLogSortRow preceding = from > 0 ? source.get(from - 1) : null;
        return new Slice(List.copyOf(source.subList(from, to)), preceding, total);
    }

    /**
     * 상담일이 늦은 행이 앞이다. 같은 날이면 회기가 큰 행이 앞이고, 회기가 없거나 0 이하면 뒤로 간다.
     *
     * @param left 왼쪽
     * @param right 오른쪽
     * @return 비교값
     */
    public static int compareRecent(ConsultationLogSortRow left, ConsultationLogSortRow right) {
        int byDate = compareDateDesc(left.sessionDate(), right.sessionDate());
        if (byDate != 0) {
            return byDate;
        }
        int leftRank = sessionRank(left.sessionNumber());
        int rightRank = sessionRank(right.sessionNumber());
        boolean leftMissing = leftRank == MISSING_SESSION_RANK;
        boolean rightMissing = rightRank == MISSING_SESSION_RANK;
        if (leftMissing != rightMissing) {
            return leftMissing ? 1 : -1;
        }
        if (!leftMissing && leftRank != rightRank) {
            return Integer.compare(rightRank, leftRank);
        }
        return Long.compare(idOf(right), idOf(left));
    }

    /**
     * 회기 오름차순. 없거나 0 이하면 뒤로 가고, 같으면 상담일 오름차순이다.
     *
     * @param left 왼쪽
     * @param right 오른쪽
     * @return 비교값
     */
    public static int compareSession(ConsultationLogSortRow left, ConsultationLogSortRow right) {
        int byRank = Integer.compare(sessionRank(left.sessionNumber()), sessionRank(right.sessionNumber()));
        if (byRank != 0) {
            return byRank;
        }
        LocalDate dateA = left.sessionDate();
        LocalDate dateB = right.sessionDate();
        if (dateA == null || dateB == null) {
            if (dateA == null && dateB == null) {
                return Long.compare(idOf(left), idOf(right));
            }
            return dateA == null ? 1 : -1;
        }
        int byDate = dateA.compareTo(dateB);
        if (byDate != 0) {
            return byDate;
        }
        return Long.compare(idOf(left), idOf(right));
    }

    private static Comparator<ConsultationLogSortRow> comparator(ConsultationLogTimelineSort sort) {
        if (sort == ConsultationLogTimelineSort.SESSION) {
            return ConsultationLogTimelineOrdering::compareSession;
        }
        return ConsultationLogTimelineOrdering::compareRecent;
    }

    private static int compareDateDesc(LocalDate left, LocalDate right) {
        if (left == null || right == null) {
            if (left == null && right == null) {
                return 0;
            }
            return left == null ? 1 : -1;
        }
        return right.compareTo(left);
    }

    private static int sessionRank(Integer sessionNumber) {
        if (sessionNumber == null || sessionNumber <= 0) {
            return MISSING_SESSION_RANK;
        }
        return sessionNumber;
    }

    private static long idOf(ConsultationLogSortRow row) {
        return row.id() == null ? Long.MAX_VALUE : row.id();
    }

    /**
     * @param rows 이 쪽의 행
     * @param preceding 이전 쪽의 마지막 행. 첫 쪽이면 null
     * @param total 정렬 전체 건수
     */
    public record Slice(List<ConsultationLogSortRow> rows, ConsultationLogSortRow preceding, int total) {
    }
}

package com.coresolution.consultation.util;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import org.springframework.util.StringUtils;

/**
 * 쇼핑 체크아웃 — 동일 상담사 다중 매핑 중 장바구니 상품에 맞는 최적 매핑 선택.
 *
 * @author MindGarden
 * @since 2026-09-19
 */
public final class ShopConsultantMappingBindUtil {

    private ShopConsultantMappingBindUtil() {}

    /**
     * 상담사별 eligible 매핑 중 체크아웃에 붙일 최적 행을 고른다.
     * <p>
     * 장바구니 CONSULTATION 제목이 있는데 packageName 매칭 점수가 전부 0 이면
     * 기존 ACTIVE 를 임의 선택하지 않고 {@code null}(fail-closed) —
     * 「테스트 10,000원」이 「테스트 1,000원」매핑에 붙는 회귀 방지.
     * 제목 목록이 비면(옵션 API 등) 기존처럼 assigned/startDate 로 고른다.
     * </p>
     *
     * @param forConsultant 동일 상담사(또는 동일 distinct 키) 매핑만
     * @param cartConsultationTitles CONSULTATION SKU 제목(trim 적용 전 원문)
     * @return 최적 매핑, 목록이 비거나 score0 tie(제목 있음)이면 null
     */
    public static ConsultantClientMapping resolveBestMappingForConsultant(
            List<ConsultantClientMapping> forConsultant, List<String> cartConsultationTitles) {
        if (forConsultant == null || forConsultant.isEmpty()) {
            return null;
        }
        List<String> titles = cartConsultationTitles == null ? List.of() : cartConsultationTitles;
        boolean hasCartTitles = titles.stream().anyMatch(StringUtils::hasText);
        ConsultantClientMapping best = forConsultant.stream()
                .max(Comparator
                        .comparingInt((ConsultantClientMapping m) -> packageTitleMatchScore(m, titles))
                        .thenComparing(m -> MappingAssignmentStatus.isAssigned(m.getStatus()))
                        .thenComparing(
                                ConsultantClientMapping::getStartDate,
                                Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);
        if (best == null) {
            return null;
        }
        if (hasCartTitles && packageTitleMatchScore(best, titles) == 0) {
            return null;
        }
        return best;
    }

    /**
     * eligible 목록에서 자동 preselected 로 표시할 mappingId (없으면 null).
     *
     * @param eligible 쇼핑 체크아웃 eligible 매핑
     * @param cartConsultationTitles 장바구니 CONSULTATION 제목 (옵션 API는 빈 목록 가능)
     * @return preselected mappingId
     */
    public static Long resolveAutoPreselectedMappingId(
            List<ConsultantClientMapping> eligible, List<String> cartConsultationTitles) {
        if (eligible == null || eligible.isEmpty()) {
            return null;
        }
        List<ConsultantClientMapping> assigned = eligible.stream()
                .filter(m -> MappingAssignmentStatus.isAssigned(m.getStatus()))
                .toList();
        long distinctAssignedConsultants = countDistinctConsultantKeys(assigned);
        if (distinctAssignedConsultants > 1L) {
            return null;
        }
        if (distinctAssignedConsultants == 1L || assigned.size() == 1) {
            String key = consultantDistinctKey(assigned.get(0));
            List<ConsultantClientMapping> forConsultant = filterByConsultantDistinctKey(eligible, key);
            ConsultantClientMapping best = resolveBestMappingForConsultant(forConsultant, cartConsultationTitles);
            return best != null ? best.getId() : null;
        }
        if (countDistinctConsultantKeys(eligible) == 1L) {
            String key = consultantDistinctKey(eligible.get(0));
            List<ConsultantClientMapping> forConsultant = filterByConsultantDistinctKey(eligible, key);
            ConsultantClientMapping best = resolveBestMappingForConsultant(forConsultant, cartConsultationTitles);
            return best != null ? best.getId() : null;
        }
        return null;
    }

    /**
     * eligible 매핑의 서로 다른 상담사(또는 fallback 키) 개수.
     *
     * @param eligible 매핑 목록
     * @return distinct count
     */
    public static long countDistinctConsultantKeys(List<ConsultantClientMapping> eligible) {
        if (eligible == null || eligible.isEmpty()) {
            return 0L;
        }
        return eligible.stream().map(ShopConsultantMappingBindUtil::consultantDistinctKey).distinct().count();
    }

    /**
     * @param mapping 매핑
     * @return 그룹 키
     */
    public static String consultantDistinctKey(ConsultantClientMapping mapping) {
        if (mapping == null) {
            return "null";
        }
        if (mapping.getConsultant() != null && mapping.getConsultant().getId() != null) {
            return "c:" + mapping.getConsultant().getId();
        }
        return "m:" + mapping.getId();
    }

    private static List<ConsultantClientMapping> filterByConsultantDistinctKey(
            List<ConsultantClientMapping> eligible, String key) {
        return eligible.stream()
                .filter(m -> Objects.equals(consultantDistinctKey(m), key))
                .toList();
    }

    private static int packageTitleMatchScore(ConsultantClientMapping mapping, List<String> cartTitles) {
        String packageName = mapping.getPackageName();
        if (!StringUtils.hasText(packageName) || cartTitles.isEmpty()) {
            return 0;
        }
        String pkg = packageName.trim();
        int best = 0;
        for (String raw : cartTitles) {
            if (!StringUtils.hasText(raw)) {
                continue;
            }
            String title = raw.trim();
            if (pkg.equalsIgnoreCase(title)) {
                return 3;
            }
            String pkgLower = pkg.toLowerCase(Locale.ROOT);
            String titleLower = title.toLowerCase(Locale.ROOT);
            if (pkgLower.contains(titleLower) || titleLower.contains(pkgLower)) {
                best = Math.max(best, 2);
            }
        }
        return best;
    }
}

package com.coresolution.consultation.util;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.function.ToLongFunction;
import com.coresolution.consultation.entity.ConsultantClientMapping;

/**
 * assignment / remaining / active 목록용 fully-consumed 매핑 필터.
 *
 * <p>{@link MappingSessionConsumptionSsot} 산식을 목록에 적용한다.
 * COMPLETED 건수 조회는 호출부가 주입({@code completedCountResolver})한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-23
 */
public final class MappingRemainingAssignmentFilter {

    private MappingRemainingAssignmentFilter() {
    }

    /**
     * fully consumed 매핑을 목록에서 제외한다 ({@code /mappings/active} 등).
     *
     * @param mappings 후보 매핑
     * @param completedCountResolver 매핑별 상담 COMPLETED 건수
     * @return 제외 후 새 목록 (원본 미변경)
     */
    public static List<ConsultantClientMapping> excludeFullyConsumed(
            List<ConsultantClientMapping> mappings,
            ToLongFunction<ConsultantClientMapping> completedCountResolver) {
        if (mappings == null || mappings.isEmpty()) {
            return mappings == null ? List.of() : mappings;
        }
        Objects.requireNonNull(completedCountResolver, "completedCountResolver");
        List<ConsultantClientMapping> result = new ArrayList<>(mappings.size());
        for (ConsultantClientMapping mapping : mappings) {
            if (mapping == null) {
                continue;
            }
            long completed = completedCountResolver.applyAsLong(mapping);
            if (MappingSessionConsumptionSsot.isFullyConsumedByCompletedSchedules(
                    mapping.getTotalSessions(), completed)) {
                continue;
            }
            result.add(mapping);
        }
        return result;
    }

    /**
     * fully consumed 이면 in-memory {@code remainingSessions=0} 으로 내려
     * FE rem&gt;0 remaining 뷰에서 숨긴다. DB UPDATE/heal 없음.
     *
     * <p><b>호출 전제</b>: 대상 엔티티는 persistence context 에서 detach 된 상태여야 한다.
     * managed 엔티티에 호출하면 Hibernate dirty flush 로 rem=0 이 DB 에 저장될 수 있다.</p>
     *
     * @param mappings 후보 매핑 (엔티티 필드만 조정, 저장하지 않음 — detach 필수)
     * @param completedCountResolver 매핑별 상담 COMPLETED 건수
     */
    public static void applyEffectiveRemainingWhenFullyConsumed(
            List<ConsultantClientMapping> mappings,
            ToLongFunction<ConsultantClientMapping> completedCountResolver) {
        if (mappings == null || mappings.isEmpty()) {
            return;
        }
        Objects.requireNonNull(completedCountResolver, "completedCountResolver");
        for (ConsultantClientMapping mapping : mappings) {
            if (mapping == null) {
                continue;
            }
            long completed = completedCountResolver.applyAsLong(mapping);
            boolean fullyConsumed = MappingSessionConsumptionSsot.isFullyConsumedByCompletedSchedules(
                    mapping.getTotalSessions(), completed);
            if (fullyConsumed) {
                mapping.setRemainingSessions(
                        MappingSessionConsumptionSsot.effectiveRemainingSessions(
                                mapping.getRemainingSessions(), true));
            }
        }
    }
}

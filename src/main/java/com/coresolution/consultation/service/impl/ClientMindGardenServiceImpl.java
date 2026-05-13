package com.coresolution.consultation.service.impl;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import com.coresolution.consultation.constant.GardenGrowthConstants;
import com.coresolution.consultation.constant.GardenGrowthEventType;
import com.coresolution.consultation.dto.MindGardenEventApplyResponse;
import com.coresolution.consultation.dto.MindGardenServerStateResponse;
import com.coresolution.consultation.service.ClientMindGardenService;
import com.coresolution.consultation.util.GardenGrowthWeekKey;
import org.springframework.stereotype.Service;

/**
 * 「마음 정원」MVP — 테넌트·사용자별 인메모리 상태.
 *
 * <p>TODO: Flyway 엔티티 영속화, 멀티 인스턴스 간 Redis/DB 락, occurredAt 기반 재전송·감사 로그.</p>
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Service
public class ClientMindGardenServiceImpl implements ClientMindGardenService {

    private static final int MAX_PROCESSED_DEDUPE_KEYS = 200;

    private final ConcurrentHashMap<String, Object> locks = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, MutableState> store = new ConcurrentHashMap<>();

    @Override
    public MindGardenServerStateResponse getServerState(String tenantId, long userId) {
        String composite = compositeKey(tenantId, userId);
        synchronized (lockFor(composite)) {
            MutableState state = store.computeIfAbsent(composite, k -> seedState());
            rolloverWeekIfNeeded(state);
            state.touchSynced();
            return toResponse(state);
        }
    }

    @Override
    public MindGardenEventApplyResponse applyEvent(
            String tenantId,
            long userId,
            GardenGrowthEventType eventType,
            String sourceId) {

        Integer baseWeight = GardenGrowthConstants.EVENT_WEIGHTS.get(eventType);
        if (baseWeight == null) {
            throw new IllegalArgumentException("지원하지 않는 이벤트 유형입니다.");
        }

        String composite = compositeKey(tenantId, userId);
        synchronized (lockFor(composite)) {
            MutableState state = store.computeIfAbsent(composite, k -> seedState());
            rolloverWeekIfNeeded(state);

            String dedupeKey = buildDedupeKey(eventType, sourceId);
            if (dedupeKey != null && state.processedDedupeKeys.contains(dedupeKey)) {
                int remaining = remainingWeeklyBudget(state.weeklyPointsCredited);
                boolean capReached = state.weeklyPointsCredited >= GardenGrowthConstants.WEEKLY_POINTS_CAP;
                state.touchSynced();
                return new MindGardenEventApplyResponse(
                        0,
                        true,
                        capReached,
                        remaining,
                        toResponse(state));
            }

            int remainingBefore = remainingWeeklyBudget(state.weeklyPointsCredited);
            int earned = Math.min(baseWeight, remainingBefore);
            boolean weeklyCapReached = remainingBefore <= baseWeight && earned < baseWeight;

            if (earned > 0) {
                if (dedupeKey != null) {
                    state.processedDedupeKeys.add(dedupeKey);
                    trimProcessedKeys(state);
                }
                state.totalPoints += earned;
                state.weeklyPointsCredited += earned;
                state.revision++;
            }

            state.touchSynced();
            int remainingAfter = remainingWeeklyBudget(state.weeklyPointsCredited);
            return new MindGardenEventApplyResponse(
                    earned,
                    false,
                    weeklyCapReached,
                    remainingAfter,
                    toResponse(state));
        }
    }

    private static String compositeKey(String tenantId, long userId) {
        return tenantId.trim() + ":" + userId;
    }

    private Object lockFor(String compositeKey) {
        return locks.computeIfAbsent(compositeKey, k -> new Object());
    }

    private static MutableState seedState() {
        MutableState s = new MutableState();
        s.revision = 0;
        s.totalPoints = 0;
        s.weeklyPointsCredited = 0;
        s.weekKey = GardenGrowthWeekKey.currentWeekKey(GardenGrowthConstants.GARDEN_WEEK_ZONE);
        s.processedDedupeKeys = new LinkedHashSet<>();
        s.lastSyncedAt = Instant.now();
        return s;
    }

    private static void rolloverWeekIfNeeded(MutableState state) {
        String current = GardenGrowthWeekKey.currentWeekKey(GardenGrowthConstants.GARDEN_WEEK_ZONE);
        if (!current.equals(state.weekKey)) {
            state.weekKey = current;
            state.weeklyPointsCredited = 0;
            state.processedDedupeKeys.clear();
            state.revision++;
        }
    }

    private static String buildDedupeKey(GardenGrowthEventType eventType, String sourceId) {
        if (sourceId == null || sourceId.isBlank()) {
            return null;
        }
        return eventType.name() + ":" + sourceId.trim();
    }

    private static int remainingWeeklyBudget(int weeklyPointsCredited) {
        return Math.max(0, GardenGrowthConstants.WEEKLY_POINTS_CAP - weeklyPointsCredited);
    }

    private static void trimProcessedKeys(MutableState state) {
        while (state.processedDedupeKeys.size() > MAX_PROCESSED_DEDUPE_KEYS) {
            Iterator<String> it = state.processedDedupeKeys.iterator();
            if (it.hasNext()) {
                it.next();
                it.remove();
            } else {
                break;
            }
        }
    }

    private static int stageIndexFromPoints(int totalPoints) {
        int stage = 0;
        int[] thresholds = GardenGrowthConstants.STAGE_THRESHOLDS;
        for (int i = 0; i < thresholds.length; i++) {
            if (totalPoints >= thresholds[i]) {
                stage = i;
            }
        }
        return Math.min(stage, GardenGrowthConstants.MAX_STAGE_INDEX);
    }

    private static List<String> unlockedIds(int stageIndex) {
        List<String> ids = new ArrayList<>();
        for (GardenGrowthConstants.GardenVisualElement el : GardenGrowthConstants.VISUAL_ELEMENTS) {
            if (el.minStageIndex() <= stageIndex) {
                ids.add(el.id());
            }
        }
        return List.copyOf(ids);
    }

    private static MindGardenServerStateResponse toResponse(MutableState state) {
        int stageIndex = stageIndexFromPoints(state.totalPoints);
        String synced = state.lastSyncedAt == null ? null : state.lastSyncedAt.toString();
        return new MindGardenServerStateResponse(
                state.revision,
                stageIndex,
                state.totalPoints,
                state.weeklyPointsCredited,
                state.weekKey,
                unlockedIds(stageIndex),
                synced);
    }

    private static final class MutableState {
        private long revision;
        private int totalPoints;
        private int weeklyPointsCredited;
        private String weekKey;
        private LinkedHashSet<String> processedDedupeKeys;
        private Instant lastSyncedAt;

        private void touchSynced() {
            this.lastSyncedAt = Instant.now();
        }
    }
}

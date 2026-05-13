package com.coresolution.consultation.constant;

import java.time.ZoneId;
import java.util.List;
import java.util.Map;

/**
 * 「마음 정원」성장 정책 상수 — Expo {@code mindGardenGrowth.ts} 와 수치·요소 ID 를 맞춘다.
 *
 * <p>TODO: 테넌트/표준시간대별 주간 키·캡을 설정으로 분리하고 주말 경계 정책을 운영과 합의한다.</p>
 *
 * @author MindGarden
 * @since 2026-05-13
 */
public final class GardenGrowthConstants {

    private GardenGrowthConstants() {
    }

    /** Expo {@code GARDEN_GROWTH_WEEKLY_POINTS_CAP} 과 동일 */
    public static final int WEEKLY_POINTS_CAP = 60;

    /** 월요일 00:00 기준 주 키 계산 시 사용하는 존 — MVP 는 한국 표준시 고정 */
    public static final ZoneId GARDEN_WEEK_ZONE = ZoneId.of("Asia/Seoul");

    /** Expo {@code GARDEN_STAGE_THRESHOLDS} 과 동일 (누적점 구간) */
    public static final int[] STAGE_THRESHOLDS = {0, 45, 110, 220, 400};

    public static final int MAX_STAGE_INDEX = 4;

    /** Expo {@code GARDEN_EVENT_WEIGHTS} 과 동일 */
    public static final Map<GardenGrowthEventType, Integer> EVENT_WEIGHTS = Map.of(
            GardenGrowthEventType.SESSION_COMPLETED, 18,
            GardenGrowthEventType.HOMEWORK_COMPLETED, 12,
            GardenGrowthEventType.SELF_CARE_COMPLETED, 10);

    public static final List<GardenVisualElement> VISUAL_ELEMENTS = List.of(
            new GardenVisualElement("el-seed", 0),
            new GardenVisualElement("el-sprout", 1),
            new GardenVisualElement("el-stem", 2),
            new GardenVisualElement("el-bud", 3),
            new GardenVisualElement("el-bloom", 4));

    /**
     * 시각 요소 정의 (Expo {@code GARDEN_VISUAL_ELEMENTS}).
     *
     * @param id            요소 ID
     * @param minStageIndex 해금에 필요한 최소 단계 인덱스
     */
    public record GardenVisualElement(String id, int minStageIndex) {
    }
}

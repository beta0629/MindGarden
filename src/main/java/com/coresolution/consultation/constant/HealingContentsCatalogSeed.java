package com.coresolution.consultation.constant;

import com.coresolution.consultation.dto.HealingContentItemResponse;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 테넌트 DB에 일별 힐링 행이 없을 때도 목록이 비지 않도록 하는 MVP 정적 카탈로그.
 * 식별자는 DB PK와 겹치지 않도록 {@value #SEED_ID_BASE} 이상 대역을 사용한다.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
public final class HealingContentsCatalogSeed {

    /**
     * 시드 항목용 ID 하한 (일반 auto_increment PK와 분리).
     */
    public static final long SEED_ID_BASE = 9_000_000L;

    private static final List<HealingContentItemResponse> ITEMS = buildItems();

    private HealingContentsCatalogSeed() {
    }

    /**
     * @return 불변 기본 시드 목록
     */
    public static List<HealingContentItemResponse> defaultItems() {
        return ITEMS;
    }

    private static List<HealingContentItemResponse> buildItems() {
        List<HealingContentItemResponse> list = new ArrayList<>();
        long id = SEED_ID_BASE + 1;
        list.add(HealingContentItemResponse.builder()
            .id(id++)
            .title("호흡과 바디 스캔")
            .description("짧은 가이드 명상으로 긴장을 낮춥니다.")
            .category("RELAXATION")
            .type(HealingContentMediaType.MEDITATION)
            .durationMinutes(5)
            .build());
        list.add(HealingContentItemResponse.builder()
            .id(id++)
            .title("수면 리듬 점검")
            .description("취침 전 루틴을 정리하는 짧은 글 모음입니다.")
            .category("SLEEP")
            .type(HealingContentMediaType.ARTICLE)
            .build());
        list.add(HealingContentItemResponse.builder()
            .id(id++)
            .title("집중을 위한 앰비언트")
            .description("배경 소리로 주의를 한곳에 모아 보세요.")
            .category("FOCUS")
            .type(HealingContentMediaType.AUDIO)
            .durationMinutes(10)
            .build());
        list.add(HealingContentItemResponse.builder()
            .id(id++)
            .title("어깨·목 스트레칭")
            .description("의자에서 할 수 있는 가벼운 영상 가이드입니다.")
            .category("MOVEMENT")
            .type(HealingContentMediaType.VIDEO)
            .durationMinutes(8)
            .build());
        return Collections.unmodifiableList(list);
    }
}

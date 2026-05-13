package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.coresolution.consultation.constant.GardenGrowthConstants;
import com.coresolution.consultation.constant.GardenGrowthEventType;
import com.coresolution.consultation.dto.MindGardenEventApplyResponse;
import com.coresolution.consultation.dto.MindGardenServerStateResponse;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link ClientMindGardenServiceImpl} 멱등·주간 캡·응답 스키마 검증.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@DisplayName("ClientMindGardenServiceImpl")
class ClientMindGardenServiceImplTest {

    private static final String TENANT = "tenant-garden-unit-001";
    private static final long USER = 9001L;

    private ClientMindGardenServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ClientMindGardenServiceImpl();
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("초기 GET은 Expo MindGardenServerState 필드를 채운다")
    void getState_initial_hasExpectedFields() {
        MindGardenServerStateResponse s = service.getServerState(TENANT, USER);
        assertNotNull(s);
        assertEquals(0, s.totalPoints());
        assertEquals(0, s.weeklyPointsCredited());
        assertNotNull(s.weekKey());
        assertFalse(s.weekKey().isBlank());
        assertTrue(s.revision() >= 0);
        assertEquals(0, s.stageIndex());
        assertNotNull(s.unlockedElementIds());
        assertTrue(s.unlockedElementIds().contains("el-seed"));
        assertNotNull(s.lastSyncedAt());
    }

    @Test
    @DisplayName("sourceId 멱등 — 동일 키는 두 번째 earned=0, duplicate=true")
    void applyEvent_sameSourceId_isIdempotent() {
        MindGardenEventApplyResponse first = service.applyEvent(
                TENANT, USER, GardenGrowthEventType.SESSION_COMPLETED, "sch-1");
        assertEquals(18, first.earned());
        assertFalse(first.duplicate());

        MindGardenEventApplyResponse second = service.applyEvent(
                TENANT, USER, GardenGrowthEventType.SESSION_COMPLETED, "sch-1");
        assertEquals(0, second.earned());
        assertTrue(second.duplicate());
        assertEquals(first.state().revision(), second.state().revision());
        assertEquals(18, second.state().totalPoints());
    }

    @Test
    @DisplayName("주간 캡 — 누적이 상한을 넘지 않고 weeklyCapReached 플래그가 켜진다")
    void applyEvent_respectsWeeklyCap() {
        int sum = 0;
        for (int i = 0; i < 10; i++) {
            MindGardenEventApplyResponse r =
                    service.applyEvent(TENANT, USER, GardenGrowthEventType.SELF_CARE_COMPLETED, "sc-" + i);
            sum += r.earned();
        }
        assertEquals(GardenGrowthConstants.WEEKLY_POINTS_CAP, sum);
        MindGardenServerStateResponse last = service.getServerState(TENANT, USER);
        assertEquals(GardenGrowthConstants.WEEKLY_POINTS_CAP, last.weeklyPointsCredited());

        MindGardenEventApplyResponse over =
                service.applyEvent(TENANT, USER, GardenGrowthEventType.SESSION_COMPLETED, "extra-1");
        assertEquals(0, over.earned());
        assertTrue(over.weeklyCapReached());
        assertEquals(0, over.remainingWeeklyBudget());
    }

    @Test
    @DisplayName("sourceId 없으면 멱등 없이 각 호출이 누적된다")
    void applyEvent_withoutSourceId_noDedupe() {
        service.applyEvent(TENANT, USER, GardenGrowthEventType.HOMEWORK_COMPLETED, null);
        service.applyEvent(TENANT, USER, GardenGrowthEventType.HOMEWORK_COMPLETED, null);
        MindGardenServerStateResponse s = service.getServerState(TENANT, USER);
        assertEquals(24, s.totalPoints());
    }
}

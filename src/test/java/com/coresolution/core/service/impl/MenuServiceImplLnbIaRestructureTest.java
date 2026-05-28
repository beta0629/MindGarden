package com.coresolution.core.service.impl;

import com.coresolution.core.dto.MenuDTO;
import com.coresolution.core.entity.Menu;
import com.coresolution.core.repository.MenuRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * MenuServiceImpl — LNB IA 재배치 (V20260606_008, 2026-05-28) 트리 구조 단위 테스트.
 *
 * 검증 항목 (designer §6 권한 매트릭스 + planner §2.3 트리):
 *   - STAFF 역할: 1차 8개 (단독 3 + 그룹 5)
 *     · ADM_DASHBOARD / ADM_INTEGRATED_SCHEDULE / ADM_NOTIFICATIONS (단독)
 *     · ADM_MATCHING_PAYMENT_REFUND / ADM_USERS / ADM_CONTENT_COMMUNITY / ADM_SHOP / ADM_SETTINGS (그룹)
 *     · ADM_ERP 는 ERP_ACCESS 권한 미보유 시 제외
 *   - sort_order 정렬: 10/15/20/25/30/35/40/45/50 순
 *   - ADM_MAPPING / ADM_BILLING 이 ADM_MATCHING_PAYMENT_REFUND 자식으로 강등 (Q9)
 *   - 콘텐츠·커뮤니티 그룹 자식 5종 (DUP-3 fix)
 *
 * @see docs/project-management/2026-05-28/ADMIN_LNB_IA_RESTRUCTURE_PLAN.md
 * @see src/main/resources/db/migration/V20260606_008__lnb_ia_restructure.sql
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MenuServiceImpl — LNB IA 재배치 (V20260606_008)")
class MenuServiceImplLnbIaRestructureTest {

    @Mock
    private MenuRepository menuRepository;

    @InjectMocks
    private MenuServiceImpl menuService;

    private static long idCounter = 1;

    private static Menu menu(String code, String name, Long parentId, int depth, int sort, String role) {
        return Menu.builder()
                .id(idCounter++)
                .menuCode(code)
                .menuName(name)
                .menuPath("/admin/" + code.toLowerCase())
                .parentMenuId(parentId)
                .depth(depth)
                .requiredRole(role)
                .minRequiredRole(role)
                .isAdminOnly(true)
                .menuLocation("ADMIN_ONLY")
                .sortOrder(sort)
                .isActive(true)
                .build();
        }

    /** 본 테스트가 시뮬레이트하는 IA 재배치 후 menus 테이블 row 셋. */
    private List<Menu> buildLnbIaMenus() {
        idCounter = 1;
        // 1차 단독 3 + 그룹 5 + 운영·재무 그룹 1 = 9 (ERP 는 ADMIN 만)
        Menu dashboard = menu("ADM_DASHBOARD", "대시보드", null, 0, 10, "STAFF");
        Menu integrated = menu("ADM_INTEGRATED_SCHEDULE", "통합 스케줄", null, 0, 15, "STAFF");
        Menu notif = menu("ADM_NOTIFICATIONS", "알림·메시지", null, 0, 20, "STAFF");
        Menu matching = menu("ADM_MATCHING_PAYMENT_REFUND", "매칭·결제·환불", null, 0, 25, "STAFF");
        Menu users = menu("ADM_USERS", "사용자 관리", null, 0, 30, "STAFF");
        Menu content = menu("ADM_CONTENT_COMMUNITY", "콘텐츠·커뮤니티", null, 0, 35, "STAFF");
        Menu shop = menu("ADM_SHOP", "쇼핑·리워드", null, 0, 40, "STAFF");
        Menu erp = menu("ADM_ERP", "운영·재무", null, 0, 45, "ADMIN");
        Menu settings = menu("ADM_SETTINGS", "시스템·설정", null, 0, 50, "STAFF");

        // 강등된 자식: ADM_MAPPING / ADM_BILLING → ADM_MATCHING_PAYMENT_REFUND 하위
        Menu mapping = menu("ADM_MAPPING", "매칭 관리(환불·취소)", matching.getId(), 1, 1, "STAFF");
        Menu billing = menu("ADM_BILLING", "결제/구독", matching.getId(), 1, 2, "ADMIN");
        Menu pgOps = menu("ADM_PG_OPS_APPROVAL", "PG 승인(운영)", matching.getId(), 1, 3, "ADMIN");

        // ADM_NOTIFICATIONS 하위: 상담일지
        Menu consultLogs = menu("ADM_CONSULTATION_LOGS", "상담일지", notif.getId(), 1, 1, "STAFF");

        // ADM_CONTENT_COMMUNITY 하위: 5종
        Menu communityMod = menu("ADM_COMMUNITY_MODERATION", "커뮤니티 검수큐", content.getId(), 1, 1, "STAFF");
        Menu contentMaster = menu("ADM_CONTENT_MASTER", "심리교육·힐링 마스터", content.getId(), 1, 2, "STAFF");
        Menu mindWeather = menu("ADM_MIND_WEATHER_OBSERVABILITY", "마음 날씨 관측", content.getId(), 1, 3, "STAFF");
        Menu mindGarden = menu("ADM_MIND_GARDEN_OBSERVABILITY", "마음 정원 관측", content.getId(), 1, 4, "STAFF");
        Menu pushMon = menu("ADM_PUSH_MONITORING", "푸시 설정 모니터링", content.getId(), 1, 5, "STAFF");

        return Arrays.asList(
                dashboard, integrated, notif, matching, users, content, shop, erp, settings,
                mapping, billing, pgOps, consultLogs,
                communityMod, contentMaster, mindWeather, mindGarden, pushMon);
    }

    @Test
    @DisplayName("STAFF (ERP_ACCESS 미보유): 1차 8개 — ADM_ERP 자동 제외 + sort_order 정렬 확인")
    void getLnbMenus_staffWithoutErpAccess_returnsEightFirstLevel() {
        when(menuRepository.findByMenuLocationAndRequiredRoleIn(
                eq("ADMIN_ONLY"),
                org.mockito.ArgumentMatchers.anySet()))
                .thenReturn(buildLnbIaMenus());

        List<MenuDTO> tree = menuService.getLnbMenus("STAFF", Set.of());

        assertThat(tree).extracting(MenuDTO::getMenuCode).containsExactly(
                "ADM_DASHBOARD",
                "ADM_INTEGRATED_SCHEDULE",
                "ADM_NOTIFICATIONS",
                "ADM_MATCHING_PAYMENT_REFUND",
                "ADM_USERS",
                "ADM_CONTENT_COMMUNITY",
                "ADM_SHOP",
                "ADM_SETTINGS"
        );
        assertThat(tree).hasSize(8);
    }

    @Test
    @DisplayName("STAFF (ERP_ACCESS 보유): 1차 9개 — ADM_ERP 포함")
    void getLnbMenus_staffWithErpAccess_includesErp() {
        when(menuRepository.findByMenuLocationAndRequiredRoleIn(
                eq("ADMIN_ONLY"),
                org.mockito.ArgumentMatchers.anySet()))
                .thenReturn(buildLnbIaMenus());

        List<MenuDTO> tree = menuService.getLnbMenus("STAFF", Set.of("ERP_ACCESS"));

        assertThat(tree).extracting(MenuDTO::getMenuCode).contains("ADM_ERP");
        assertThat(tree).hasSize(9);
    }

    @Test
    @DisplayName("ADMIN: 1차 9개 + ADM_MATCHING_PAYMENT_REFUND 그룹 자식 3종 (Q9 강등 확인)")
    void getLnbMenus_admin_matchingGroupContainsMappingAndBilling() {
        when(menuRepository.findByMenuLocationAndRequiredRoleIn(
                eq("ADMIN_ONLY"),
                org.mockito.ArgumentMatchers.anySet()))
                .thenReturn(buildLnbIaMenus());

        List<MenuDTO> tree = menuService.getLnbMenus("ADMIN", null);

        MenuDTO matching = tree.stream()
                .filter(m -> "ADM_MATCHING_PAYMENT_REFUND".equals(m.getMenuCode()))
                .findFirst()
                .orElseThrow();
        assertThat(matching.getChildren())
                .extracting(MenuDTO::getMenuCode)
                .containsExactly("ADM_MAPPING", "ADM_BILLING", "ADM_PG_OPS_APPROVAL");
    }

    @Test
    @DisplayName("ADMIN: ADM_CONTENT_COMMUNITY 그룹 자식 5종 (DUP-3 fix 확인)")
    void getLnbMenus_admin_contentCommunityGroupHasFiveChildren() {
        when(menuRepository.findByMenuLocationAndRequiredRoleIn(
                eq("ADMIN_ONLY"),
                org.mockito.ArgumentMatchers.anySet()))
                .thenReturn(buildLnbIaMenus());

        List<MenuDTO> tree = menuService.getLnbMenus("ADMIN", null);

        MenuDTO content = tree.stream()
                .filter(m -> "ADM_CONTENT_COMMUNITY".equals(m.getMenuCode()))
                .findFirst()
                .orElseThrow();
        assertThat(content.getChildren())
                .extracting(MenuDTO::getMenuCode)
                .containsExactly(
                        "ADM_COMMUNITY_MODERATION",
                        "ADM_CONTENT_MASTER",
                        "ADM_MIND_WEATHER_OBSERVABILITY",
                        "ADM_MIND_GARDEN_OBSERVABILITY",
                        "ADM_PUSH_MONITORING");
    }

    @Test
    @DisplayName("STAFF: ADM_NOTIFICATIONS 하위 ADM_CONSULTATION_LOGS 1건 (DUP-3 fix 확인)")
    void getLnbMenus_staff_notificationsHasConsultationLogsChild() {
        when(menuRepository.findByMenuLocationAndRequiredRoleIn(
                eq("ADMIN_ONLY"),
                org.mockito.ArgumentMatchers.anySet()))
                .thenReturn(buildLnbIaMenus());

        List<MenuDTO> tree = menuService.getLnbMenus("STAFF", Set.of());

        MenuDTO notif = tree.stream()
                .filter(m -> "ADM_NOTIFICATIONS".equals(m.getMenuCode()))
                .findFirst()
                .orElseThrow();
        assertThat(notif.getChildren())
                .extracting(MenuDTO::getMenuCode)
                .containsExactly("ADM_CONSULTATION_LOGS");
    }

    @Test
    @DisplayName("빈 role → 빈 트리")
    void getLnbMenus_emptyRole_returnsEmptyTree() {
        assertThat(menuService.getLnbMenus("", null)).isEmpty();
        assertThat(menuService.getLnbMenus(null, null)).isEmpty();
    }
}

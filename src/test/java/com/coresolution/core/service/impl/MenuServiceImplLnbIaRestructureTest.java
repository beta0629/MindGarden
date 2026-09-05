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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * MenuServiceImpl — LNB IA (V20260606_008 + V20260905_001 P0/P1) 트리 구조 단위 테스트.
 *
 * 검증 항목:
 *   - STAFF 1차: 대시보드·통합스케줄·사용자관리·상담·기록·알림·매칭·계정·권한·콘텐츠·쇼핑·설정
 *     (ADM_ERP 제외)
 *   - matching: ADM_MAPPING / ADM_BILLING / ADM_MAPPINGS_PENDING_PAYMENT_CLEANUP (PG ops 제외)
 *   - notifications: ADM_PUSH_MONITORING (상담일지 없음)
 *   - consultation records: ADM_CONSULTATION_LOGS
 *   - ADM_USERS 라벨 「계정·권한」, ADM_USERS_LIST / P0 항목 미포함
 *
 * @author CoreSolution
 * @since 2026-05-28
 * @see src/main/resources/db/migration/V20260606_008__lnb_ia_restructure.sql
 * @see src/main/resources/db/migration/V20260905_001__lnb_center_admin_cleanup_p0_p1.sql
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MenuServiceImpl — LNB IA 재배치 (V20260606_008 + V20260905_001)")
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

    /**
     * V20260905_001 적용 후 active menus fixture.
     * P0 비활성(ADM_PG_OPS_APPROVAL / ADM_SETTINGS_CODES / ADM_SETTINGS_TEST_NOTIFICATION /
     * ADM_USERS_LIST) 은 repo 가 is_active=true 만 조회하므로 fixture 에서 제외.
     */
    private List<Menu> buildLnbIaMenus() {
        idCounter = 1;
        Menu dashboard = menu("ADM_DASHBOARD", "대시보드", null, 0, 10, "STAFF");
        Menu integrated = menu("ADM_INTEGRATED_SCHEDULE", "통합 스케줄", null, 0, 15, "STAFF");
        Menu userMgmt = menu("ADM_USER_MANAGEMENT", "사용자 관리", null, 0, 17, "STAFF");
        Menu consultRecords = menu("ADM_CONSULTATION_RECORDS", "상담·기록", null, 0, 18, "STAFF");
        Menu notif = menu("ADM_NOTIFICATIONS", "알림·메시지", null, 0, 20, "STAFF");
        Menu matching = menu("ADM_MATCHING_PAYMENT_REFUND", "매칭·결제·환불", null, 0, 25, "STAFF");
        Menu users = menu("ADM_USERS", "계정·권한", null, 0, 30, "STAFF");
        Menu content = menu("ADM_CONTENT_COMMUNITY", "콘텐츠·커뮤니티", null, 0, 35, "STAFF");
        Menu shop = menu("ADM_SHOP", "쇼핑·리워드", null, 0, 40, "STAFF");
        Menu erp = menu("ADM_ERP", "운영·재무", null, 0, 45, "ADMIN");
        Menu settings = menu("ADM_SETTINGS", "시스템·설정", null, 0, 50, "STAFF");

        Menu mapping = menu("ADM_MAPPING", "매칭 관리(환불·취소)", matching.getId(), 1, 1, "STAFF");
        Menu billing = menu("ADM_BILLING", "결제/구독", matching.getId(), 1, 2, "ADMIN");
        Menu dirtyCleanup = menu(
                "ADM_MAPPINGS_PENDING_PAYMENT_CLEANUP",
                "디러티 매칭 정리",
                matching.getId(),
                1,
                4,
                "STAFF");

        Menu consultLogs = menu("ADM_CONSULTATION_LOGS", "상담일지", consultRecords.getId(), 1, 1, "STAFF");
        Menu pushMon = menu("ADM_PUSH_MONITORING", "메시지 발송", notif.getId(), 1, 1, "STAFF");

        Menu accounts = menu("ADM_ACCOUNTS", "계좌 관리", users.getId(), 1, 3, "ADMIN");
        Menu dormant = menu("ADM_DORMANT_USERS", "휴면 사용자", users.getId(), 1, 4, "ADMIN");

        Menu communityMod = menu("ADM_COMMUNITY_MODERATION", "커뮤니티 검수큐", content.getId(), 1, 1, "STAFF");
        Menu contentMaster = menu("ADM_CONTENT_MASTER", "심리교육·힐링 마스터", content.getId(), 1, 2, "STAFF");
        Menu mindWeather = menu("ADM_MIND_WEATHER_OBSERVABILITY", "마음 날씨 관측", content.getId(), 1, 3, "STAFF");
        Menu mindGarden = menu("ADM_MIND_GARDEN_OBSERVABILITY", "마음 정원 관측", content.getId(), 1, 4, "STAFF");

        return Arrays.asList(
                dashboard, integrated, userMgmt, consultRecords, notif, matching, users, content, shop, erp, settings,
                mapping, billing, dirtyCleanup, consultLogs, pushMon, accounts, dormant,
                communityMod, contentMaster, mindWeather, mindGarden);
    }

    @Test
    @DisplayName("STAFF (ERP_ACCESS 미보유): 1차 10개 — USER_MANAGEMENT·CONSULTATION_RECORDS 포함, ADM_ERP 제외")
    void getLnbMenus_staffWithoutErpAccess_returnsTenFirstLevel() {
        when(menuRepository.findByMenuLocationAndRequiredRoleIn(
                eq("ADMIN_ONLY"),
                org.mockito.ArgumentMatchers.anySet()))
                .thenReturn(buildLnbIaMenus());

        List<MenuDTO> tree = menuService.getLnbMenus("STAFF", Set.of());

        assertThat(tree).extracting(MenuDTO::getMenuCode).containsExactly(
                "ADM_DASHBOARD",
                "ADM_INTEGRATED_SCHEDULE",
                "ADM_USER_MANAGEMENT",
                "ADM_CONSULTATION_RECORDS",
                "ADM_NOTIFICATIONS",
                "ADM_MATCHING_PAYMENT_REFUND",
                "ADM_USERS",
                "ADM_CONTENT_COMMUNITY",
                "ADM_SHOP",
                "ADM_SETTINGS"
        );
        assertThat(tree).hasSize(10);
    }

    @Test
    @DisplayName("STAFF (ERP_ACCESS 보유해도): ADM_ERP 항상 제외")
    void getLnbMenus_staffWithErpAccess_stillExcludesErp() {
        when(menuRepository.findByMenuLocationAndRequiredRoleIn(
                eq("ADMIN_ONLY"),
                org.mockito.ArgumentMatchers.anySet()))
                .thenReturn(buildLnbIaMenus());

        List<MenuDTO> tree = menuService.getLnbMenus("STAFF", Set.of("ERP_ACCESS"));

        assertThat(tree).extracting(MenuDTO::getMenuCode).doesNotContain("ADM_ERP");
        assertThat(tree).hasSize(10);
    }

    @Test
    @DisplayName("ADMIN: matching 그룹에 cleanup 포함 · PG ops 미포함")
    void getLnbMenus_admin_matchingGroupContainsCleanupWithoutPgOps() {
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
                .containsExactly(
                        "ADM_MAPPING",
                        "ADM_BILLING",
                        "ADM_MAPPINGS_PENDING_PAYMENT_CLEANUP");
        assertThat(matching.getChildren())
                .extracting(MenuDTO::getMenuCode)
                .doesNotContain("ADM_PG_OPS_APPROVAL");
    }

    @Test
    @DisplayName("ADMIN: ADM_CONTENT_COMMUNITY 그룹 자식 4종 (메시지 발송 미포함)")
    void getLnbMenus_admin_contentCommunityGroupHasFourChildren() {
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
                        "ADM_MIND_GARDEN_OBSERVABILITY");
        assertThat(content.getChildren())
                .extracting(MenuDTO::getMenuCode)
                .doesNotContain("ADM_PUSH_MONITORING");
    }

    @Test
    @DisplayName("ADMIN: ADM_NOTIFICATIONS 하위에 ADM_PUSH_MONITORING(메시지 발송), 상담일지 없음")
    void getLnbMenus_admin_notificationsContainsPushMonitoringWithoutConsultationLogs() {
        when(menuRepository.findByMenuLocationAndRequiredRoleIn(
                eq("ADMIN_ONLY"),
                org.mockito.ArgumentMatchers.anySet()))
                .thenReturn(buildLnbIaMenus());

        List<MenuDTO> tree = menuService.getLnbMenus("ADMIN", null);

        MenuDTO notif = tree.stream()
                .filter(m -> "ADM_NOTIFICATIONS".equals(m.getMenuCode()))
                .findFirst()
                .orElseThrow();
        assertThat(notif.getChildren())
                .extracting(MenuDTO::getMenuCode)
                .containsExactly("ADM_PUSH_MONITORING");
        assertThat(notif.getChildren())
                .filteredOn(c -> "ADM_PUSH_MONITORING".equals(c.getMenuCode()))
                .extracting(MenuDTO::getMenuName)
                .containsExactly("메시지 발송");
        assertThat(notif.getChildren())
                .extracting(MenuDTO::getMenuCode)
                .doesNotContain("ADM_CONSULTATION_LOGS");
    }

    @Test
    @DisplayName("STAFF: ADM_CONSULTATION_RECORDS 하위에 ADM_CONSULTATION_LOGS")
    void getLnbMenus_staff_consultationRecordsHasLogsChild() {
        when(menuRepository.findByMenuLocationAndRequiredRoleIn(
                eq("ADMIN_ONLY"),
                org.mockito.ArgumentMatchers.anySet()))
                .thenReturn(buildLnbIaMenus());

        List<MenuDTO> tree = menuService.getLnbMenus("STAFF", Set.of());

        MenuDTO records = tree.stream()
                .filter(m -> "ADM_CONSULTATION_RECORDS".equals(m.getMenuCode()))
                .findFirst()
                .orElseThrow();
        assertThat(records.getMenuName()).isEqualTo("상담·기록");
        assertThat(records.getChildren())
                .extracting(MenuDTO::getMenuCode)
                .containsExactly("ADM_CONSULTATION_LOGS");
    }

    @Test
    @DisplayName("ADMIN: ADM_USERS 라벨 「계정·권한」, USERS_LIST 미포함, 계좌·휴면 포함")
    void getLnbMenus_admin_usersGroupIsAccountsPermissionsWithoutUsersList() {
        when(menuRepository.findByMenuLocationAndRequiredRoleIn(
                eq("ADMIN_ONLY"),
                org.mockito.ArgumentMatchers.anySet()))
                .thenReturn(buildLnbIaMenus());

        List<MenuDTO> tree = menuService.getLnbMenus("ADMIN", null);

        MenuDTO users = tree.stream()
                .filter(m -> "ADM_USERS".equals(m.getMenuCode()))
                .findFirst()
                .orElseThrow();
        assertThat(users.getMenuName()).isEqualTo("계정·권한");
        assertThat(users.getChildren())
                .extracting(MenuDTO::getMenuCode)
                .containsExactly("ADM_ACCOUNTS", "ADM_DORMANT_USERS");
        assertThat(users.getChildren())
                .extracting(MenuDTO::getMenuCode)
                .doesNotContain("ADM_USERS_LIST");
    }

    @Test
    @DisplayName("ADMIN: 설정 그룹에 P0 숨김·메시지 발송 미포함")
    void getLnbMenus_admin_settingsExcludesP0AndPushMonitoring() {
        when(menuRepository.findByMenuLocationAndRequiredRoleIn(
                eq("ADMIN_ONLY"),
                org.mockito.ArgumentMatchers.anySet()))
                .thenReturn(buildLnbIaMenus());

        List<MenuDTO> tree = menuService.getLnbMenus("ADMIN", null);

        MenuDTO settings = tree.stream()
                .filter(m -> "ADM_SETTINGS".equals(m.getMenuCode()))
                .findFirst()
                .orElseThrow();
        assertThat(settings.getChildren())
                .extracting(MenuDTO::getMenuCode)
                .doesNotContain(
                        "ADM_PUSH_MONITORING",
                        "ADM_SETTINGS_CODES",
                        "ADM_SETTINGS_TEST_NOTIFICATION");
    }

    @Test
    @DisplayName("빈 role → 빈 트리")
    void getLnbMenus_emptyRole_returnsEmptyTree() {
        assertThat(menuService.getLnbMenus("", null)).isEmpty();
        assertThat(menuService.getLnbMenus(null, null)).isEmpty();
    }
}

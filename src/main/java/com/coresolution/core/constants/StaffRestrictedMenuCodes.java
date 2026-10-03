package com.coresolution.core.constants;

import java.util.Set;

/**
 * STAFF(사무원) LNB 에 노출하지 않는 메뉴 코드 SSOT.
 *
 * <p>P0 보안(2026-10-03): {@code MenuServiceImpl.getLnbMenus} 가 STAFF 의 가시 역할 집합에
 * {@code ADMIN} 을 포함하고 있어 {@code required_role='ADMIN'} 으로 시드된 결제 연결(PG)·
 * AI 프로바이더·시스템 설정 메뉴까지 사무원 LNB 에 노출됐다. {@code menus} 테이블 데이터를
 * 직접 수정하지 않고 본 상수로 서버 응답에서 제거한다.
 *
 * <p>메뉴 숨김은 보안이 아니다. 아래 메뉴 뒤의 API 는 각각 ADMIN 전용으로 제한되어 있다:
 * <ul>
 *   <li>{@code ADM_SETTINGS_PG} → {@code /api/v1/tenants/{tenantId}/pg-configurations/**}</li>
 *   <li>{@code ADM_SETTINGS_AI_PROVIDER} → {@code /api/v1/admin/system-config/**},
 *       {@code /api/v1/admin/ai/**}</li>
 *   <li>{@code ADM_SETTINGS_SYSTEM} → {@code /api/v1/admin/system-config/**}</li>
 * </ul>
 *
 * <p>프론트 폴백 LNB 의 동일 정책은 {@code frontend/src/utils/lnbMenuUtils.js} 의
 * {@code filterStaffRestrictedLnbItems} 가 담당한다.
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-10-03
 */
public final class StaffRestrictedMenuCodes {

    /** 결제 연결 (PG 설정). */
    public static final String ADM_SETTINGS_PG = "ADM_SETTINGS_PG";

    /** AI 프로바이더 관리. */
    public static final String ADM_SETTINGS_AI_PROVIDER = "ADM_SETTINGS_AI_PROVIDER";

    /** 시스템 설정. */
    public static final String ADM_SETTINGS_SYSTEM = "ADM_SETTINGS_SYSTEM";

    /** STAFF 비노출 메뉴 코드 집합. */
    public static final Set<String> ALL = Set.of(
            ADM_SETTINGS_PG,
            ADM_SETTINGS_AI_PROVIDER,
            ADM_SETTINGS_SYSTEM
    );

    private StaffRestrictedMenuCodes() {
    }

    /**
     * STAFF 에게 숨겨야 하는 메뉴 코드인지 확인.
     *
     * @param menuCode 메뉴 코드 (null 허용)
     * @return 제한 대상이면 true
     */
    public static boolean isRestricted(String menuCode) {
        return menuCode != null && ALL.contains(menuCode);
    }
}

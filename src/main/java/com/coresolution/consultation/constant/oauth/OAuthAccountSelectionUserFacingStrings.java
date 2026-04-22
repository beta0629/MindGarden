package com.coresolution.consultation.constant.oauth;

import com.coresolution.consultation.constant.UserRole;

/**
 * OAuth 전화 계정 선택 UI·API 메시지.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
public final class OAuthAccountSelectionUserFacingStrings {

    public static final String MODAL_TITLE = "연결할 계정을 선택해주세요";

    public static final String MODAL_SUBTITLE =
            "동일한 휴대폰 번호로 등록된 서로 다른 역할의 계정이 여러 개 있습니다.";

    public static final String DASHBOARD_GUIDE_ADMIN = "로그인 시 관리자 대시보드로 이동합니다.";

    public static final String DASHBOARD_GUIDE_CONSULTANT = "로그인 시 상담사 대시보드로 이동합니다.";

    public static final String DASHBOARD_GUIDE_CLIENT = "로그인 시 내담자 대시보드로 이동합니다.";

    public static final String DASHBOARD_GUIDE_STAFF = "로그인 시 스태프 대시보드로 이동합니다.";

    public static final String DASHBOARD_GUIDE_OTHER = "로그인 시 해당 역할 화면으로 이동합니다.";

    public static final String ROLE_LABEL_UNKNOWN = "역할 미지정";

    public static final String CONFIRM_BUTTON = "선택한 계정으로 계속";

    public static final String OPTION_CONSULTANT_FMT = "상담사 계정 (ID: %d)";

    public static final String OPTION_CLIENT_FMT = "내담자 계정 (ID: %d)";

    public static final String OPTION_ADMIN_FMT = "관리자 계정 (ID: %d)";

    public static final String OPTION_STAFF_FMT = "스태프 계정 (ID: %d)";

    public static final String OPTION_OTHER_FMT = "%s 계정 (ID: %d)";

    /**
     * 계정 선택 후보에 표시할 역할 라벨(짧은 형태).
     *
     * @param role 사용자 역할
     * @return 표시용 문자열
     */
    public static String roleDisplayLabel(UserRole role) {
        if (role == null) {
            return ROLE_LABEL_UNKNOWN;
        }
        switch (role) {
            case ADMIN:
                return "관리자";
            case CONSULTANT:
                return "상담사";
            case CLIENT:
                return "내담자";
            case STAFF:
                return "스태프";
            default:
                return role.name();
        }
    }

    /**
     * 계정 선택 후보에 표시할 대시보드 안내 문구.
     *
     * @param role 사용자 역할
     * @return 안내 문구
     */
    public static String dashboardGuideForRole(UserRole role) {
        if (role == null) {
            return DASHBOARD_GUIDE_OTHER;
        }
        switch (role) {
            case ADMIN:
                return DASHBOARD_GUIDE_ADMIN;
            case CONSULTANT:
                return DASHBOARD_GUIDE_CONSULTANT;
            case CLIENT:
                return DASHBOARD_GUIDE_CLIENT;
            case STAFF:
                return DASHBOARD_GUIDE_STAFF;
            default:
                return DASHBOARD_GUIDE_OTHER;
        }
    }

    private OAuthAccountSelectionUserFacingStrings() {
    }
}

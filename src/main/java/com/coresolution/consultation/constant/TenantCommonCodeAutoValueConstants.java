package com.coresolution.consultation.constant;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * 테넌트 공통코드 codeValue 자동 발급 — 그룹별 prefix 상수.
 * <p>카테고리 표시명 하드코딩 리스트 금지. prefix 맵만 확장한다.</p>
 *
 * @author MindGarden
 * @since 2026-08-31
 */
public final class TenantCommonCodeAutoValueConstants {

    /** 시퀀스 자릿수 (PACKAGE_001 과 동일). */
    public static final int CODE_SEQ_WIDTH = ConsultationPackageCodeConstants.CODE_SEQ_WIDTH;

    /** 자동 발급 충돌 시 최대 재시도. */
    public static final int GENERATION_MAX_ATTEMPTS = ConsultationPackageCodeConstants.GENERATION_MAX_ATTEMPTS;

    public static final String CODE_VALUE_REQUIRED_MESSAGE =
            ConsultationPackageCodeConstants.CODE_VALUE_REQUIRED_MESSAGE;

    public static final String AUTO_GENERATION_FAILED_MESSAGE =
            "코드 값 자동 발급에 실패했습니다. 잠시 후 다시 시도해 주세요.";

    public static final String DUPLICATE_CODE_MESSAGE_FMT =
            ConsultationPackageCodeConstants.DUPLICATE_CODE_MESSAGE_FMT;

    private static final Map<String, String> GROUP_TO_PREFIX;

    static {
        Map<String, String> map = new LinkedHashMap<>();
        map.put(ConsultationPackageCodeConstants.CODE_GROUP, ConsultationPackageCodeConstants.CODE_PREFIX);
        map.put("EXPENSE_CATEGORY", "EXP_CAT");
        map.put("EXPENSE_SUBCATEGORY", "EXP_SUB");
        map.put("INCOME_CATEGORY", "INC_CAT");
        map.put("INCOME_SUBCATEGORY", "INC_SUB");
        GROUP_TO_PREFIX = Collections.unmodifiableMap(map);
    }

    private TenantCommonCodeAutoValueConstants() {
    }

    /**
     * @param codeGroup 코드 그룹
     * @return 자동 발급 대상이면 true
     */
    public static boolean supportsAutoCodeValue(String codeGroup) {
        return codeGroup != null && GROUP_TO_PREFIX.containsKey(codeGroup);
    }

    /**
     * @param codeGroup 코드 그룹
     * @return prefix (없으면 null)
     */
    public static String prefixForGroup(String codeGroup) {
        if (codeGroup == null) {
            return null;
        }
        return GROUP_TO_PREFIX.get(codeGroup);
    }

    /**
     * @return 자동 발급 지원 그룹 집합 (읽기 전용)
     */
    public static Set<String> autoValueGroups() {
        return GROUP_TO_PREFIX.keySet();
    }
}

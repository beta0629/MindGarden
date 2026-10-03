package com.coresolution.core.security;

import java.util.Map;
import java.util.regex.Pattern;
import com.coresolution.core.constant.OnboardingConstants;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 온보딩 checklist_json 의 관리자 초기 비밀번호 처리 유틸.
 * <ul>
 *   <li>저장 값이 BCrypt 해시인지 판별 (승인 시 재인코딩 금지 판단)</li>
 *   <li>응답용 checklist_json 에서 비밀번호 키 제거</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
public final class OnboardingAdminPasswordSupport {

    /** BCrypt 모듈러 크립트 형식: $2a$/$2b$/$2y$ + cost 2자리 + salt·hash 53자 */
    private static final Pattern BCRYPT_HASH_PATTERN =
            Pattern.compile("^\\$2[abxy]?\\$\\d{2}\\$[./A-Za-z0-9]{53}$");

    private static final TypeReference<Map<String, Object>> CHECKLIST_TYPE =
            new TypeReference<Map<String, Object>>() {};

    private OnboardingAdminPasswordSupport() {
    }

    /**
     * 값이 BCrypt 해시 형식인지 확인한다.
     *
     * @param value 검사할 문자열
     * @return BCrypt 해시 형식이면 true
     */
    public static boolean isBcryptHash(String value) {
        return value != null && BCRYPT_HASH_PATTERN.matcher(value).matches();
    }

    /**
     * checklist 맵에서 관리자 비밀번호 값을 꺼낸다 (trim, 빈 값은 null).
     *
     * @param checklist 파싱된 checklist
     * @return 저장 값 또는 null
     */
    public static String readStoredValue(Map<String, Object> checklist) {
        if (checklist == null) {
            return null;
        }
        Object raw = checklist.get(OnboardingConstants.CHECKLIST_KEY_ADMIN_PASSWORD);
        if (raw == null) {
            return null;
        }
        String text = String.valueOf(raw).trim();
        return text.isEmpty() ? null : text;
    }

    /**
     * 응답용으로 checklist_json 에서 관리자 비밀번호 키를 제거한다.
     * 파싱 실패 시 원문을 돌려주지 않고 null 을 반환한다 (fail-closed).
     *
     * @param checklistJson 원본 checklist_json
     * @param objectMapper  Jackson ObjectMapper
     * @return 비밀번호 키가 제거된 JSON 또는 null
     */
    public static String stripFromChecklistJson(String checklistJson, ObjectMapper objectMapper) {
        if (checklistJson == null || checklistJson.isBlank()) {
            return checklistJson;
        }
        try {
            Map<String, Object> checklist = objectMapper.readValue(checklistJson, CHECKLIST_TYPE);
            if (checklist == null) {
                return null;
            }
            checklist.remove(OnboardingConstants.CHECKLIST_KEY_ADMIN_PASSWORD);
            return objectMapper.writeValueAsString(checklist);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}

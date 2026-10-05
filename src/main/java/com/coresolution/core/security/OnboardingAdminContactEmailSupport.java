package com.coresolution.core.security;

import java.util.Locale;
import java.util.Map;
import com.coresolution.core.constant.OnboardingConstants;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;

/**
 * 온보딩 checklist_json 의 관리자 연락 이메일.
 * 승인·로그인 계정·승인 메일은 이 값만 쓰고, 신청 휴대폰({@code requestedBy})으로 대체하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public final class OnboardingAdminContactEmailSupport {

    private static final TypeReference<Map<String, Object>> CHECKLIST_TYPE =
            new TypeReference<Map<String, Object>>() {};

    private OnboardingAdminContactEmailSupport() {
    }

    /**
     * checklist_json 에서 관리자 이메일을 읽어 trim·소문자로 정규화한다.
     *
     * @param checklistJson checklist_json 원문
     * @param objectMapper  Jackson ObjectMapper
     * @return 정규화된 이메일. 키가 없거나 형식이 아니면 null
     * @throws JsonProcessingException JSON 을 읽을 수 없을 때
     */
    public static String readNormalized(String checklistJson, ObjectMapper objectMapper)
            throws JsonProcessingException {
        if (checklistJson == null || checklistJson.isBlank() || objectMapper == null) {
            return null;
        }
        Map<String, Object> checklist = objectMapper.readValue(checklistJson, CHECKLIST_TYPE);
        if (checklist == null) {
            return null;
        }
        Object raw = checklist.get(OnboardingConstants.CHECKLIST_KEY_CONTACT_EMAIL);
        if (!(raw instanceof String text)) {
            return null;
        }
        return normalize(text);
    }

    /**
     * 로그인에 쓰는 이메일과 같게 trim·소문자로 맞추고, 주소 형식이 아니면 null.
     * 판정은 {@link InternetAddress#validate()} (기존 회원 이메일 검증과 동일)를 따른다.
     *
     * @param raw 원문
     * @return 정규화된 이메일 또는 null
     */
    public static String normalize(String raw) {
        if (raw == null) {
            return null;
        }
        String normalized = raw.trim().toLowerCase(Locale.ROOT);
        if (normalized.isEmpty()) {
            return null;
        }
        try {
            InternetAddress address = new InternetAddress(normalized);
            address.validate();
            String parsed = address.getAddress();
            if (parsed == null || !parsed.equals(normalized)) {
                return null;
            }
        } catch (AddressException ex) {
            return null;
        }
        int at = normalized.lastIndexOf('@');
        if (at <= 0 || at == normalized.length() - 1) {
            return null;
        }
        String domain = normalized.substring(at + 1);
        if (domain.indexOf('.') <= 0 || domain.startsWith(".") || domain.endsWith(".")) {
            return null;
        }
        return normalized;
    }
}

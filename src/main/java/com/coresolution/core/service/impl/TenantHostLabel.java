package com.coresolution.core.service.impl;

import java.util.Locale;
import java.util.regex.Pattern;
import com.coresolution.core.constant.OnboardingConstants;

/**
 * 테넌트 호스트 레이블. 소문자 영문·숫자·하이픈, 최대 63자, 앞뒤 하이픈 없음.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
public final class TenantHostLabel {

    /** DNS 레이블 최대 길이. */
    public static final int MAX_LENGTH = 63;

    private static final int FALLBACK_ID_LENGTH = 8;

    private static final String FALLBACK_PREFIX = "tenant-";

    private static final Pattern DNS_LABEL = Pattern.compile(
            "^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$");

    private TenantHostLabel() {
    }

    /**
     * @param value 검사할 레이블
     * @return 소문자 영문·숫자·하이픈 DNS 레이블이면 true
     */
    public static boolean isDnsLabel(String value) {
        return value != null && DNS_LABEL.matcher(value).matches();
    }

    /**
     * 신청 값이 비어 있으면 null. 유효하면 소문자 레이블.
     * 한글 등 비레이블이면 승인 차단.
     *
     * @param subdomain 신청 서브도메인
     * @return 소문자 DNS 레이블 또는 null
     * @throws OnboardingApprovalBlockedException 값이 있는데 DNS 레이블이 아닐 때
     */
    public static String explicitDnsLabelOrNull(String subdomain) {
        if (subdomain == null || subdomain.isBlank()) {
            return null;
        }
        String normalized = subdomain.trim().toLowerCase(Locale.ROOT);
        if (!isDnsLabel(normalized)) {
            throw new OnboardingApprovalBlockedException(
                    OnboardingConstants.ERROR_ONBOARDING_SUBDOMAIN_NOT_DNS_LABEL);
        }
        return normalized;
    }

    /**
     * 서브도메인이 비어 있을 때 센터명에서 호스트 레이블을 만든다.
     * 한글만 남으면 테넌트 ID 기반 {@code tenant-} 레이블을 쓰고, 그것도 없으면 승인 차단.
     *
     * @param tenantName 센터명
     * @param tenantId 테넌트 ID
     * @return DNS 레이블
     * @throws OnboardingApprovalBlockedException 레이블을 만들 수 없을 때
     */
    public static String fromCenterName(String tenantName, String tenantId) {
        String fromName = sanitizeCenterName(tenantName);
        if (isDnsLabel(fromName)) {
            return fromName;
        }
        String fromId = fallbackFromTenantId(tenantId);
        if (isDnsLabel(fromId)) {
            return fromId;
        }
        throw new OnboardingApprovalBlockedException(
                OnboardingConstants.ERROR_ONBOARDING_SUBDOMAIN_HOST_UNAVAILABLE);
    }

    /**
     * 기존 행의 정상 레이블은 그대로 둔다.
     * 반환이 null 이면 subdomain 컬럼을 갱신하지 않는다.
     *
     * @param requested 신청에서 온 DNS 레이블. 없으면 null
     * @param current 저장된 subdomain
     * @param tenantName 센터명
     * @param tenantId 테넌트 ID
     * @return 저장할 레이블. null 이면 기존 값을 유지
     * @throws OnboardingApprovalBlockedException 대체 레이블을 만들 수 없을 때
     */
    public static String labelForExistingRow(String requested, String current, String tenantName,
            String tenantId) {
        String currentNormalized = current == null ? "" : current.trim().toLowerCase(Locale.ROOT);
        boolean currentValid = isDnsLabel(currentNormalized);
        if ((requested == null || requested.isEmpty()) && currentValid
                && currentNormalized.equals(current)) {
            return null;
        }
        if (requested != null && !requested.isEmpty()) {
            return requested;
        }
        if (currentValid) {
            return currentNormalized;
        }
        return fromCenterName(tenantName, tenantId);
    }

    /**
     * @param message 프로시저 OUT 메시지
     * @return 호스트 레이블 때문에 테넌트를 커밋하면 안 되는 실패이면 true
     */
    public static boolean isHostLabelBlockedMessage(String message) {
        if (message == null || message.isBlank()) {
            return false;
        }
        return message.contains(OnboardingConstants.ERROR_ONBOARDING_SUBDOMAIN_NOT_DNS_LABEL)
                || message.contains(OnboardingConstants.ERROR_ONBOARDING_SUBDOMAIN_HOST_UNAVAILABLE);
    }

    private static String sanitizeCenterName(String tenantName) {
        if (tenantName == null || tenantName.isBlank()) {
            return "";
        }
        String value = tenantName.trim().toLowerCase(Locale.ROOT);
        value = value.replace(' ', '-').replace('_', '-');
        value = value.replace("가든", "garden");
        value = value.replace("마인드", "mind");
        value = value.replace("상담", "consultation");
        value = value.replace("학원", "academy");
        value = value.replace("센터", "center");
        value = value.replaceAll("[^a-z0-9-]", "");
        value = value.replaceAll("-{2,}", "-");
        value = trimHyphens(value);
        if (value.length() > MAX_LENGTH) {
            value = trimHyphens(value.substring(0, MAX_LENGTH));
        }
        return value;
    }

    private static String fallbackFromTenantId(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return "";
        }
        String id = tenantId.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
        if (id.isEmpty()) {
            return "";
        }
        String prefix = id.length() > FALLBACK_ID_LENGTH ? id.substring(0, FALLBACK_ID_LENGTH) : id;
        return FALLBACK_PREFIX + prefix;
    }

    private static String trimHyphens(String value) {
        int start = 0;
        int end = value.length();
        while (start < end && value.charAt(start) == '-') {
            start++;
        }
        while (end > start && value.charAt(end - 1) == '-') {
            end--;
        }
        return value.substring(start, end);
    }
}

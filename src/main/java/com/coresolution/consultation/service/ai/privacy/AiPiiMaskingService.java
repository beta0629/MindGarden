package com.coresolution.consultation.service.ai.privacy;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import com.coresolution.consultation.constant.AiPrivacyFlagKeys;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * AI 외부 전송 직전 개인식별정보(PII) 마스킹 SSOT.
 *
 * <p>모든 AI 송신 경로(중앙 {@code AiChatCompletionServiceImpl}, {@code AIModelProvider} 구현체)가
 * 이 서비스를 거친다. 테넌트 토글 {@link AiPrivacyFlagKeys#PII_MASKING_ENABLED} 가 꺼진 경우에만
 * 원문을 보낸다(기본 ON, 조회 실패 시에도 ON).
 *
 * <p>패턴 마스킹: 주민등록번호·카드번호·전화번호·이메일. 이름은 호출자가 알고 있는
 * 식별자(내담자·상담사 이름 등)를 넘겨 치환한다.
 *
 * @author MindGarden
 * @since 2026-10-04
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiPiiMaskingService {

    /** 이름 치환 토큰. */
    public static final String TOKEN_NAME = "[이름]";

    /** 주민등록번호 치환 토큰. */
    public static final String TOKEN_RRN = "[주민등록번호]";

    /** 카드번호 치환 토큰. */
    public static final String TOKEN_CARD = "[카드번호]";

    /** 전화번호 치환 토큰. */
    public static final String TOKEN_PHONE = "[전화번호]";

    /** 이메일 치환 토큰. */
    public static final String TOKEN_EMAIL = "[이메일]";

    /** 한 글자 식별자는 일반 단어 오치환 위험이 커서 제외한다. */
    private static final int MIN_IDENTIFIER_LENGTH = 2;

    private static final Pattern RRN_PATTERN = Pattern.compile(
            "(?<!\\d)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\s?-?\\s?[1-8]\\d{6}(?!\\d)");

    private static final Pattern CARD_PATTERN = Pattern.compile(
            "(?<!\\d)\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}(?!\\d)");

    private static final Pattern PHONE_PATTERN = Pattern.compile(
            "(?:\\+82[- ]?(?:0)?|(?<![\\d+])0)(?:1[016789]|2|[3-6][1-5]|70|50\\d?)"
                    + "[- .)]?\\s?\\d{3,4}[- .]?\\d{4}(?!\\d)");

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");

    private final SystemConfigService systemConfigService;
    private final UserRepository userRepository;

    /**
     * 테넌트 마스킹 토글 조회. tenantId 가 없거나 조회 실패면 기본값(ON).
     *
     * @param tenantId 테넌트 ID
     * @return 마스킹 적용 여부
     */
    public boolean isMaskingEnabled(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            return AiPrivacyFlagKeys.DEFAULT_PII_MASKING_ENABLED;
        }
        return systemConfigService.getBooleanForTenant(
                tenantId,
                AiPrivacyFlagKeys.PII_MASKING_ENABLED,
                AiPrivacyFlagKeys.DEFAULT_PII_MASKING_ENABLED);
    }

    /**
     * 패턴 기반 마스킹 (토글 반영).
     *
     * @param tenantId 테넌트 ID
     * @param text     원문
     * @return 마스킹된 문자열
     */
    public String mask(String tenantId, String text) {
        return mask(tenantId, text, null);
    }

    /**
     * 패턴 + 식별자(이름 등) 마스킹 (토글 반영).
     *
     * @param tenantId    테넌트 ID
     * @param text        원문
     * @param identifiers 치환할 식별자 (null 허용)
     * @return 마스킹된 문자열
     */
    public String mask(String tenantId, String text, Collection<String> identifiers) {
        if (!StringUtils.hasText(text)) {
            return text;
        }
        if (!isMaskingEnabled(tenantId)) {
            return text;
        }
        return applyMasking(text, identifiers);
    }

    /**
     * 같은 테넌트 사용자 ID 로 이름·닉네임 식별자 목록을 만든다. 다른 테넌트 사용자는 조회되지 않는다.
     *
     * @param tenantId 테넌트 ID
     * @param userIds  사용자 ID (null 원소 허용)
     * @return 식별자 목록 (없으면 빈 목록)
     */
    public List<String> resolveUserIdentifiers(String tenantId, Long... userIds) {
        if (!StringUtils.hasText(tenantId) || userIds == null || userIds.length == 0) {
            return List.of();
        }
        Set<Long> ids = new LinkedHashSet<>();
        for (Long id : userIds) {
            if (id != null) {
                ids.add(id);
            }
        }
        if (ids.isEmpty()) {
            return List.of();
        }
        try {
            List<String> identifiers = new ArrayList<>();
            for (User user : userRepository.findByTenantIdAndIdInAndIsDeletedFalse(tenantId, ids)) {
                addIfText(identifiers, user.getName());
                addIfText(identifiers, user.getNickname());
            }
            return identifiers;
        } catch (Exception e) {
            log.warn("AI 마스킹 식별자 조회 실패 — 패턴 마스킹만 적용: tenantId={}, userCount={}, error={}",
                    tenantId, ids.size(), e.getClass().getSimpleName());
            return List.of();
        }
    }

    /**
     * 토글과 무관한 순수 마스킹 (테스트·내부용).
     *
     * @param text        원문
     * @param identifiers 치환할 식별자 (null 허용)
     * @return 마스킹된 문자열
     */
    public static String applyMasking(String text, Collection<String> identifiers) {
        if (!StringUtils.hasText(text)) {
            return text;
        }
        String masked = RRN_PATTERN.matcher(text).replaceAll(Matcher.quoteReplacement(TOKEN_RRN));
        masked = CARD_PATTERN.matcher(masked).replaceAll(Matcher.quoteReplacement(TOKEN_CARD));
        masked = PHONE_PATTERN.matcher(masked).replaceAll(Matcher.quoteReplacement(TOKEN_PHONE));
        masked = EMAIL_PATTERN.matcher(masked).replaceAll(Matcher.quoteReplacement(TOKEN_EMAIL));
        return maskIdentifiers(masked, identifiers);
    }

    private static String maskIdentifiers(String text, Collection<String> identifiers) {
        if (identifiers == null || identifiers.isEmpty()) {
            return text;
        }
        List<String> sorted = identifiers.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> value.length() >= MIN_IDENTIFIER_LENGTH)
                .distinct()
                .sorted(Comparator.comparingInt(String::length).reversed())
                .toList();
        String masked = text;
        for (String identifier : sorted) {
            masked = masked.replace(identifier, TOKEN_NAME);
        }
        return masked;
    }

    private static void addIfText(List<String> target, String value) {
        if (StringUtils.hasText(value)) {
            target.add(value.trim());
        }
    }
}

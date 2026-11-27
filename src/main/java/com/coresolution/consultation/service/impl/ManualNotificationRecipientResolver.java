package com.coresolution.consultation.service.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import com.coresolution.consultation.constant.ManualNotificationJobConstants;
import com.coresolution.consultation.constant.ManualNotificationRecipientMode;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserPrivacyConsent;
import com.coresolution.consultation.repository.UserPrivacyConsentRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.util.LoginIdentifierUtils;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 수동 발송 대상 집합을 서버 규칙으로 확정한다. 화면이 보낸 목록은 후보일 뿐 그대로 믿지 않는다.
 *
 * <ul>
 *   <li>공통: 요청 테넌트 소속·미삭제·활성 사용자만. SMS·알림톡은 유효한 휴대전화 필수, 같은 번호는 1회만.</li>
 *   <li>광고성 메시지는 최신 마케팅 수신 동의가 true 인 사용자만(직접 입력 번호는 동의 기록이 없어 제외).</li>
 *   <li>ALL_CLIENTS: 테넌트 활성 내담자 전체에서 제외 id 를 뺀다. 다른 테넌트·대상 밖 id 는 영향이 없다.</li>
 *   <li>SELECTED: 요청 id·번호를 같은 규칙으로 거른다.</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Component
@RequiredArgsConstructor
public class ManualNotificationRecipientResolver {

    private static final String TOKEN_FIELD_SEPARATOR = "|";
    private static final String TOKEN_ENTRY_SEPARATOR = ",";
    private static final String TOKEN_VALUE_SEPARATOR = "=";
    private static final String TOKEN_DIGEST_ALGORITHM = "SHA-256";

    private final UserRepository userRepository;
    private final UserPrivacyConsentRepository consentRepository;
    private final PersonalDataEncryptionUtil encryptionUtil;

    /**
     * 대상 집합 확정.
     *
     * @param tenantId     테넌트 ID
     * @param channel      채널
     * @param mode         수신자 모드
     * @param userIds      SELECTED 사용자 PK
     * @param phoneNumbers SELECTED 직접 입력 번호
     * @param excludeIds   ALL_CLIENTS 제외 PK
     * @param marketing    광고성 여부
     * @return 확정 결과(수신자 순서 고정)
     */
    public Resolution resolve(String tenantId, TestNotificationChannel channel, ManualNotificationRecipientMode mode,
            List<Long> userIds, List<String> phoneNumbers, List<Long> excludeIds, boolean marketing) {
        boolean phoneRequired = channel != TestNotificationChannel.PUSH;
        Map<String, Integer> ineligible = new LinkedHashMap<>();
        List<Candidate> recipients = new ArrayList<>();
        Set<String> seenPhones = new HashSet<>();
        int excludedCount = 0;

        List<User> users;
        if (mode == ManualNotificationRecipientMode.ALL_CLIENTS) {
            Set<Long> excludeSet = excludeIds == null ? Collections.emptySet() : new HashSet<>(excludeIds);
            List<User> clients = new ArrayList<>(userRepository
                .findByTenantIdAndRolesInAndIsActiveTrueAndIsDeletedFalse(tenantId, List.of(UserRole.CLIENT)));
            clients.sort((a, b) -> Long.compare(a.getId(), b.getId()));
            users = new ArrayList<>(clients.size());
            for (User client : clients) {
                if (excludeSet.contains(client.getId())) {
                    excludedCount++;
                } else {
                    users.add(client);
                }
            }
        } else {
            List<Long> ordered = dedupe(userIds);
            Map<Long, User> found = new HashMap<>();
            if (!ordered.isEmpty()) {
                for (User u : userRepository.findByTenantIdAndIdInAndIsDeletedFalse(tenantId, ordered)) {
                    found.put(u.getId(), u);
                }
            }
            users = new ArrayList<>(ordered.size());
            for (Long id : ordered) {
                User u = found.get(id);
                if (u == null || !tenantId.equals(u.getTenantId())) {
                    increment(ineligible, ManualNotificationJobConstants.INELIGIBLE_NOT_FOUND);
                } else if (!Boolean.TRUE.equals(u.getIsActive())) {
                    increment(ineligible, ManualNotificationJobConstants.INELIGIBLE_INACTIVE);
                } else {
                    users.add(u);
                }
            }
        }

        Map<Long, Boolean> consent = marketing ? loadMarketingConsent(tenantId, idsOf(users)) : Map.of();
        for (User u : users) {
            String reason = null;
            String phone = null;
            if (phoneRequired) {
                phone = resolvePhone(u);
                if (phone == null) {
                    reason = ManualNotificationJobConstants.INELIGIBLE_NO_PHONE;
                }
            }
            if (reason == null && marketing && !Boolean.TRUE.equals(consent.get(u.getId()))) {
                reason = ManualNotificationJobConstants.INELIGIBLE_NO_MARKETING_CONSENT;
            }
            if (reason == null && phone != null && !seenPhones.add(phone)) {
                reason = ManualNotificationJobConstants.INELIGIBLE_DUPLICATE_PHONE;
            }
            if (reason != null) {
                increment(ineligible, reason);
                continue;
            }
            recipients.add(new Candidate(ManualNotificationJobConstants.RECIPIENT_KEY_USER_PREFIX + u.getId(),
                u.getId(), u, phone));
        }

        if (mode == ManualNotificationRecipientMode.SELECTED && phoneRequired && phoneNumbers != null) {
            int phoneOrdinal = 0;
            for (String raw : new LinkedHashSet<>(phoneNumbers)) {
                String phone = normalizePhone(raw);
                if (phone == null) {
                    increment(ineligible, ManualNotificationJobConstants.INELIGIBLE_NO_PHONE);
                    continue;
                }
                if (marketing) {
                    increment(ineligible, ManualNotificationJobConstants.INELIGIBLE_NO_MARKETING_CONSENT);
                    continue;
                }
                if (!seenPhones.add(phone)) {
                    increment(ineligible, ManualNotificationJobConstants.INELIGIBLE_DUPLICATE_PHONE);
                    continue;
                }
                phoneOrdinal++;
                recipients.add(new Candidate(ManualNotificationJobConstants.RECIPIENT_KEY_PHONE_PREFIX + phoneOrdinal,
                    null, null, phone));
            }
        }

        int ineligibleCount = ineligible.values().stream().mapToInt(Integer::intValue).sum();
        String token = snapshotToken(tenantId, channel, marketing, recipients);
        return new Resolution(recipients, excludedCount, ineligibleCount, ineligible, token);
    }

    /**
     * 발송 시점 재확인용 — 사용자의 정규화 휴대전화(없거나 형식 오류면 null).
     *
     * @param user 사용자
     * @return 정규화 번호 또는 null
     */
    public String resolvePhone(User user) {
        if (user == null || user.getPhone() == null || user.getPhone().isBlank()) {
            return null;
        }
        return normalizePhone(encryptionUtil.decrypt(user.getPhone()));
    }

    /**
     * 사용자별 최신 마케팅 수신 동의(기록 없으면 키 없음 = 미동의).
     *
     * @param tenantId 테넌트 ID
     * @param userIds  사용자 PK
     * @return userId → 최신 동의값
     */
    public Map<Long, Boolean> loadMarketingConsent(String tenantId, Collection<Long> userIds) {
        Map<Long, Boolean> latest = new HashMap<>();
        if (userIds == null || userIds.isEmpty()) {
            return latest;
        }
        List<Long> ids = new ArrayList<>(userIds);
        int batch = ManualNotificationJobConstants.CONSENT_LOOKUP_BATCH_SIZE;
        for (int from = 0; from < ids.size(); from += batch) {
            List<Long> slice = ids.subList(from, Math.min(ids.size(), from + batch));
            for (UserPrivacyConsent row : consentRepository.findByTenantIdAndUserIdInOrderByConsentDateDesc(
                    tenantId, slice)) {
                latest.putIfAbsent(row.getUserId(), Boolean.TRUE.equals(row.getMarketingConsent()));
            }
        }
        return latest;
    }

    /**
     * 표시용 마스킹 이름(복호화 실패 시 null).
     *
     * @param user 사용자
     * @return 마스킹 이름
     */
    public String maskedName(User user) {
        if (user == null || user.getName() == null) {
            return null;
        }
        return encryptionUtil.maskName(encryptionUtil.decrypt(user.getName()));
    }

    private static String normalizePhone(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return LoginIdentifierUtils.normalizeAndValidateKoreanMobileForSms(raw);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static String snapshotToken(String tenantId, TestNotificationChannel channel, boolean marketing,
            List<Candidate> recipients) {
        StringBuilder sb = new StringBuilder()
            .append(tenantId).append(TOKEN_FIELD_SEPARATOR)
            .append(channel.name()).append(TOKEN_FIELD_SEPARATOR)
            .append(marketing).append(TOKEN_FIELD_SEPARATOR);
        for (Candidate c : recipients) {
            sb.append(c.recipientKey()).append(TOKEN_VALUE_SEPARATOR)
                .append(c.phone() == null ? "" : c.phone()).append(TOKEN_ENTRY_SEPARATOR);
        }
        try {
            MessageDigest digest = MessageDigest.getInstance(TOKEN_DIGEST_ALGORITHM);
            return HexFormat.of().formatHex(digest.digest(sb.toString().getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static List<Long> dedupe(List<Long> ids) {
        if (ids == null) {
            return List.of();
        }
        List<Long> out = new ArrayList<>(new LinkedHashSet<>(ids));
        out.removeIf(id -> id == null);
        return out;
    }

    private static List<Long> idsOf(List<User> users) {
        List<Long> ids = new ArrayList<>(users.size());
        for (User u : users) {
            ids.add(u.getId());
        }
        return ids;
    }

    private static void increment(Map<String, Integer> counts, String key) {
        counts.merge(key, 1, Integer::sum);
    }

    /**
     * 확정 수신자(번호 평문은 메모리에만).
     *
     * @param recipientKey 작업 내 수신자 키
     * @param userId       사용자 PK(직접 입력 번호면 null)
     * @param user         사용자(직접 입력 번호면 null)
     * @param phone        정규화 번호(푸시면 null)
     */
    public record Candidate(String recipientKey, Long userId, User user, String phone) {
    }

    /**
     * 확정 결과.
     *
     * @param recipients        확정 수신자(순서 고정)
     * @param excludedCount     관리자가 제외한 인원(대상 후보 안에서)
     * @param ineligibleCount   규칙으로 빠진 인원
     * @param ineligibleReasons 사유별 인원
     * @param snapshotToken     확정 집합 토큰
     */
    public record Resolution(List<Candidate> recipients, int excludedCount, int ineligibleCount,
            Map<String, Integer> ineligibleReasons, String snapshotToken) {
    }
}

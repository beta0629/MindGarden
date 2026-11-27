package com.coresolution.consultation.service.support;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.MindWeatherConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.NoActiveConsultantMappingException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/**
 * 내담자 콘텐츠 상담사 공유 시 담당 상담사 해석·매칭 검증·표시명 복호화.
 *
 * <p>{@link com.coresolution.consultation.service.impl.MindWeatherServiceImpl}와
 * {@link com.coresolution.consultation.service.impl.MoodJournalServiceImpl} 공통.</p>
 *
 * @author MindGarden
 * @since 2026-05-21
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ConsultantClientShareSupport {

    private final UserRepository userRepository;
    private final ConsultantClientMappingRepository consultantClientMappingRepository;
    private final UserPersonalDataCacheService userPersonalDataCacheService;
    private final PersonalDataEncryptionUtil encryptionUtil;

    /**
     * 공유 대상 상담사 — ACTIVE 매칭 우선, 없으면 비-INACTIVE 첫 매칭.
     *
     * @param tenantId 테넌트 ID
     * @param client 내담자
     * @param requestedConsultantId 명시 상담사 PK(선택)
     * @return 상담사 사용자
     */
    public User resolveTargetConsultant(String tenantId, User client, Long requestedConsultantId) {
        if (requestedConsultantId != null) {
            return userRepository.findById(requestedConsultantId)
                .filter(u -> tenantId.equals(u.getTenantId()))
                .orElseThrow(() -> new IllegalArgumentException("상담사를 찾을 수 없습니다."));
        }
        List<ConsultantClientMapping> mappings = consultantClientMappingRepository.findByClientIdAndStatusNot(
            tenantId, client.getId(), ConsultantClientMapping.MappingStatus.INACTIVE);
        Optional<User> active = mappings.stream()
            .filter(m -> m.getStatus() == ConsultantClientMapping.MappingStatus.ACTIVE)
            .map(ConsultantClientMapping::getConsultant)
            .findFirst();
        return active.orElseGet(() -> mappings.stream()
            .map(ConsultantClientMapping::getConsultant)
            .findFirst()
            .orElseThrow(() -> new NoActiveConsultantMappingException(
                "매칭된 담당 상담사가 없습니다. 먼저 상담을 신청해 주세요.")));
    }

    /**
     * 내담자에게 공유 가능한 매핑 (ACTIVE 또는 SESSIONS_EXHAUSTED) 이 1건 이상 있는지 여부.
     *
     * <p>{@link #resolveTargetConsultant} 가 예외를 던지지 않고 단순 boolean 으로 사전 가드 가능하게 한다.
     * 무드 저널 best-effort 푸시 분기에서 활용.</p>
     *
     * @param tenantId 테넌트 ID
     * @param client 내담자
     * @return 공유 가능한 매핑 존재 여부
     */
    public boolean hasShareableMapping(String tenantId, User client) {
        if (client == null || client.getId() == null) {
            return false;
        }
        List<ConsultantClientMapping> mappings = consultantClientMappingRepository.findByClientIdAndStatusNot(
            tenantId, client.getId(), ConsultantClientMapping.MappingStatus.INACTIVE);
        return mappings.stream().anyMatch(m ->
            m.getStatus() == ConsultantClientMapping.MappingStatus.ACTIVE
                || m.getStatus() == ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED);
    }

    /**
     * 상담사·내담자 ACTIVE(또는 SESSIONS_EXHAUSTED) 매칭 여부 검증.
     *
     * @param tenantId 테넌트 ID
     * @param consultant 상담사
     * @param clientUser 내담자
     */
    public void assertConsultantMappedToClient(String tenantId, User consultant, User clientUser) {
        List<ConsultantClientMapping> mappings = consultantClientMappingRepository.findByTenantIdAndConsultantAndClient(
            tenantId, consultant, clientUser);
        boolean ok = mappings.stream().anyMatch(m ->
            m.getStatus() == ConsultantClientMapping.MappingStatus.ACTIVE
                || m.getStatus() == ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED);
        if (!ok) {
            throw new AccessDeniedException("해당 상담사와 매칭된 내담자만 공유할 수 있습니다.");
        }
    }

    /**
     * 푸시·수신함용 내담자 표시명(복호화·폴백).
     *
     * @param client 내담자
     * @return 표시명
     */
    public String resolveClientDisplayName(User client) {
        if (client == null) {
            return null;
        }
        Long id = client.getId();
        try {
            Map<String, String> decrypted = userPersonalDataCacheService.getDecryptedUserData(client);
            if (decrypted != null) {
                String n = decrypted.get("name");
                if (n != null && !MindWeatherConstants.isGenericClientDisplayLabel(n)) {
                    return n;
                }
                String nick = decrypted.get("nickname");
                if (nick != null && !MindWeatherConstants.isGenericClientDisplayLabel(nick)) {
                    return nick;
                }
            }
        } catch (Exception e) {
            log.warn("내담자명 캐시 복호화 실패: clientId={}, {}", id, e.getMessage());
        }
        String stored = client.getName();
        if (stored != null && !stored.isBlank()) {
            String plain = encryptionUtil.safeDecrypt(stored.trim());
            if (plain != null && !MindWeatherConstants.isGenericClientDisplayLabel(plain)
                && !plain.startsWith("legacy::")) {
                return plain;
            }
        }
        String nickStored = client.getNickname();
        if (nickStored != null && !nickStored.isBlank()) {
            String nickPlain = encryptionUtil.safeDecrypt(nickStored.trim());
            if (nickPlain != null && !MindWeatherConstants.isGenericClientDisplayLabel(nickPlain)
                && !nickPlain.startsWith("legacy::")) {
                return nickPlain;
            }
        }
        if (id != null) {
            return "내담자 #" + id;
        }
        return "내담자";
    }
}

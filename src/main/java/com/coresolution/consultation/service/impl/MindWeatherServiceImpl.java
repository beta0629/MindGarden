package com.coresolution.consultation.service.impl;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.MindWeatherConstants;
import com.coresolution.consultation.dto.mindweather.MindWeatherAnalyzeRequest;
import com.coresolution.consultation.dto.mindweather.MindWeatherCardResponse;
import com.coresolution.consultation.dto.mindweather.MindWeatherShareConsentResponse;
import com.coresolution.consultation.dto.mindweather.MindWeatherShareRequest;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.MindWeatherCard;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.MindWeatherCardRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.MindWeatherService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.mindweather.MindWeatherHeuristicAnalyzer;
import com.coresolution.consultation.service.mindweather.MindWeatherHeuristicAnalyzer.AnalysisResult;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link MindWeatherService} 구현.
 *
 * <p>테넌트는 {@link com.coresolution.core.context.TenantContextHolder}와 세션 사용자의
 * {@code tenantId} 일치를 강제한다.</p>
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MindWeatherServiceImpl implements MindWeatherService {

    private static final ZoneId DISPLAY_ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter ISO_OFFSET = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final MindWeatherCardRepository mindWeatherCardRepository;
    private final MindWeatherHeuristicAnalyzer heuristicAnalyzer;
    private final UserRepository userRepository;
    private final ConsultantClientMappingRepository consultantClientMappingRepository;
    private final UserPersonalDataCacheService userPersonalDataCacheService;
    private final PersonalDataEncryptionUtil encryptionUtil;

    private enum CardViewMode {
        /** 내담자 본인 조회 — 원문 항상 포함 */
        CLIENT_SELF,
        /** 상담사 수신함 — 원문은 {@code shareOriginal} 동의 시에만 */
        CONSULTANT_INBOX
    }

    @Override
    public MindWeatherCardResponse analyze(MindWeatherAnalyzeRequest request, User client) {
        assertTenantMatchesUser(client);
        if (!MindWeatherConstants.isAllowedSource(request.getSource())) {
            throw new IllegalArgumentException("허용되지 않은 source 값입니다.");
        }
        User managedClient = userRepository.findById(client.getId())
            .orElseThrow(() -> new EntityNotFoundException("User", client.getId()));
        AnalysisResult result = heuristicAnalyzer.analyze(request.getText());
        MindWeatherCard card = MindWeatherCard.builder()
            .client(managedClient)
            .source(request.getSource())
            .sourceRefId(request.getSourceRefId())
            .bodyText(request.getText())
            .summary(result.summary())
            .tone(result.tone())
            .keywords(new ArrayList<>(result.keywords()))
            .shareSummary(false)
            .shareOriginal(false)
            .build();
        card.setTenantId(TenantContextHolder.getRequiredTenantId());
        mindWeatherCardRepository.save(card);
        mindWeatherCardRepository.flush();
        MindWeatherCard loaded = mindWeatherCardRepository.findByTenantIdAndIdAndClientId(
            TenantContextHolder.getRequiredTenantId(), card.getId(), client.getId())
            .orElse(card);
        return toResponse(loaded, CardViewMode.CLIENT_SELF);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MindWeatherCardResponse> listMine(User client) {
        assertTenantMatchesUser(client);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return mindWeatherCardRepository.findByTenantIdAndClientIdForList(tenantId, client.getId()).stream()
            .map(c -> toResponse(c, CardViewMode.CLIENT_SELF))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MindWeatherCardResponse getMineById(String idParam, User client) {
        assertTenantMatchesUser(client);
        MindWeatherCard card = loadMineCard(idParam, client);
        return toResponse(card, CardViewMode.CLIENT_SELF);
    }

    @Override
    public MindWeatherCardResponse share(String idParam, MindWeatherShareRequest request, User client) {
        assertTenantMatchesUser(client);
        MindWeatherCard card = loadMineCard(idParam, client);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        if (!request.isShareSummary()) {
            clearSharing(card);
            mindWeatherCardRepository.save(card);
            return toResponse(card, CardViewMode.CLIENT_SELF);
        }
        User targetConsultant = resolveTargetConsultant(tenantId, client, request.getConsultantId());
        assertConsultantMappedToClient(tenantId, targetConsultant, card.getClient());
        card.setShareSummary(true);
        card.setShareOriginal(request.isShareOriginal());
        card.setShareConsultant(targetConsultant);
        card.setConsentUpdatedAt(java.time.LocalDateTime.now());
        mindWeatherCardRepository.save(card);
        return toResponse(card, CardViewMode.CLIENT_SELF);
    }

    @Override
    public MindWeatherCardResponse unshare(String idParam, User client) {
        assertTenantMatchesUser(client);
        MindWeatherCard card = loadMineCard(idParam, client);
        clearSharing(card);
        mindWeatherCardRepository.save(card);
        return toResponse(card, CardViewMode.CLIENT_SELF);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MindWeatherCardResponse> listInboxForConsultant(User consultant) {
        assertTenantMatchesUser(consultant);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return mindWeatherCardRepository.findInboxForConsultant(tenantId, consultant.getId()).stream()
            .map(c -> toResponse(c, CardViewMode.CONSULTANT_INBOX))
            .toList();
    }

    private void clearSharing(MindWeatherCard card) {
        card.setShareSummary(false);
        card.setShareOriginal(false);
        card.setShareConsultant(null);
        card.setConsentUpdatedAt(java.time.LocalDateTime.now());
    }

    private MindWeatherCard loadMineCard(String idParam, User client) {
        long id = parseId(idParam);
        return mindWeatherCardRepository.findByTenantIdAndIdAndClientId(
            TenantContextHolder.getRequiredTenantId(), id, client.getId())
            .orElseThrow(() -> new EntityNotFoundException("MindWeatherCard", id));
    }

    private long parseId(String idParam) {
        try {
            return Long.parseLong(idParam.trim());
        } catch (NumberFormatException e) {
            throw new EntityNotFoundException("MindWeatherCard", idParam);
        }
    }

    private User resolveTargetConsultant(String tenantId, User client, Long requestedConsultantId) {
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
            .orElseThrow(() -> new IllegalArgumentException("담당 상담사를 찾을 수 없습니다. consultantId를 지정해 주세요.")));
    }

    private void assertConsultantMappedToClient(String tenantId, User consultant, User clientUser) {
        List<ConsultantClientMapping> mappings = consultantClientMappingRepository.findByTenantIdAndConsultantAndClient(
            tenantId, consultant, clientUser);
        boolean ok = mappings.stream().anyMatch(m ->
            m.getStatus() == ConsultantClientMapping.MappingStatus.ACTIVE
                || m.getStatus() == ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED);
        if (!ok) {
            throw new AccessDeniedException("해당 상담사와 매칭된 내담자만 공유할 수 있습니다.");
        }
    }

    private void assertTenantMatchesUser(User user) {
        String ctx = TenantContextHolder.getRequiredTenantId();
        if (user.getTenantId() == null || user.getTenantId().isBlank() || !ctx.equals(user.getTenantId())) {
            throw new AccessDeniedException("테넌트 정보가 일치하지 않습니다.");
        }
    }

    private MindWeatherCardResponse toResponse(MindWeatherCard card, CardViewMode mode) {
        boolean maskBody = mode == CardViewMode.CONSULTANT_INBOX && !card.isShareOriginal();
        String textOut = maskBody ? "" : card.getBodyText();
        MindWeatherShareConsentResponse share = null;
        if (card.isShareSummary()) {
            share = MindWeatherShareConsentResponse.builder()
                .summary(true)
                .original(card.isShareOriginal())
                .consultantId(card.getShareConsultant() != null ? card.getShareConsultant().getId() : null)
                .updatedAt(formatOffset(card.getConsentUpdatedAt()))
                .build();
        }
        Long clientIdFromFk = card.getClientUserId();
        Long clientId = null;
        String clientName = null;
        User clientUser = card.getClient();
        if (clientUser != null) {
            Long cid = clientUser.getId();
            if (cid != null) {
                clientUser = userRepository.findById(cid).orElse(clientUser);
            }
            clientId = clientUser.getId();
            clientName = resolveClientDisplayName(clientUser);
        } else {
            log.warn("마음 날씨 카드에 client 연관이 없음: cardId={}, tenantId={}, clientUserIdFk={}",
                card.getId(), card.getTenantId(), clientIdFromFk);
        }
        if (clientId == null) {
            clientId = clientIdFromFk;
        }
        if (clientId != null && clientName == null) {
            clientName = userRepository.findById(clientId)
                .map(this::resolveClientDisplayName)
                .orElse(null);
        }
        if (clientId != null && MindWeatherConstants.isGenericClientDisplayLabel(clientName)) {
            clientName = "내담자 #" + clientId;
        }
        return MindWeatherCardResponse.builder()
            .id(String.valueOf(card.getId()))
            .clientId(clientId)
            .clientName(clientName)
            .source(card.getSource())
            .text(textOut)
            .summary(card.getSummary())
            .tone(card.getTone())
            .keywords(card.getKeywords() != null ? List.copyOf(card.getKeywords()) : List.of())
            .share(share)
            .createdAt(formatOffset(card.getCreatedAt()))
            .build();
    }

    private static String formatOffset(java.time.LocalDateTime t) {
        if (t == null) {
            return null;
        }
        return t.atZone(DISPLAY_ZONE).format(ISO_OFFSET);
    }

    /**
     * 상담사 수신함·내담자 본인 목록 공통 — 저장명이 암호화된 경우 복호화, 불가 시 회원 ID로 식별 가능하게 표시.
     */
    private String resolveClientDisplayName(User client) {
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
            log.warn("마음 날씨 내담자명 캐시 복호화 실패: clientId={}, {}", id, e.getMessage());
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

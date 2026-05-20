package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.MindWeatherConstants;
import com.coresolution.consultation.constant.MoodJournalConstants;
import com.coresolution.consultation.dto.moodjournal.MoodJournalEntryResponse;
import com.coresolution.consultation.dto.moodjournal.MoodJournalInboxItemResponse;
import com.coresolution.consultation.dto.moodjournal.MoodJournalUpsertRequest;
import com.coresolution.consultation.dto.moodjournal.MoodStatRowResponse;
import com.coresolution.consultation.entity.MoodJournalEntry;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.MoodJournalEntryRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.MoodJournalService;
import com.coresolution.consultation.service.support.ConsultantClientShareSupport;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link MoodJournalService} 구현.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Service
@RequiredArgsConstructor
@Transactional
public class MoodJournalServiceImpl implements MoodJournalService {

    private static final ZoneId DISPLAY_ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter ISO_OFFSET = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final MoodJournalEntryRepository moodJournalEntryRepository;
    private final UserRepository userRepository;
    private final ConsultantClientShareSupport consultantClientShareSupport;
    private final MobilePushDispatchService mobilePushDispatchService;

    @Override
    @Transactional(readOnly = true)
    public List<MoodJournalEntryResponse> listMonth(User client, String month) {
        assertTenantMatchesUser(client);
        YearMonth ym = parseYearMonth(month);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();
        return moodJournalEntryRepository.findByTenantClientAndDateRange(tenantId, client.getId(), from, to).stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MoodJournalEntryResponse getByDate(User client, LocalDate date) {
        assertTenantMatchesUser(client);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return moodJournalEntryRepository.findByTenantClientAndDate(tenantId, client.getId(), date)
            .map(this::toResponse)
            .orElse(null);
    }

    @Override
    public MoodJournalEntryResponse createOrReplace(User client, MoodJournalUpsertRequest request) {
        assertTenantMatchesUser(client);
        if (request.getDate() == null || request.getDate().isBlank()) {
            throw new IllegalArgumentException("date는 필수입니다.");
        }
        LocalDate journalDate = LocalDate.parse(request.getDate().trim());
        validatePayload(request);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        MoodJournalEntry entity = moodJournalEntryRepository
            .findByTenantClientAndDate(tenantId, client.getId(), journalDate)
            .orElseGet(() -> newEntry(tenantId, client.getId(), journalDate));
        boolean wasShared = entity.isSharedWithConsultant();
        applyPayload(entity, request);
        moodJournalEntryRepository.save(entity);
        maybeDispatchSharePush(tenantId, client, entity, wasShared);
        return toResponse(entity);
    }

    @Override
    public MoodJournalEntryResponse updateByDate(User client, LocalDate date, MoodJournalUpsertRequest request) {
        assertTenantMatchesUser(client);
        validatePayload(request);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        MoodJournalEntry entity = moodJournalEntryRepository
            .findByTenantClientAndDate(tenantId, client.getId(), date)
            .orElseThrow(() -> new EntityNotFoundException("MoodJournalEntry", date));
        boolean wasShared = entity.isSharedWithConsultant();
        applyPayload(entity, request);
        moodJournalEntryRepository.save(entity);
        maybeDispatchSharePush(tenantId, client, entity, wasShared);
        return toResponse(entity);
    }

    @Override
    public void deleteByDate(User client, LocalDate date) {
        assertTenantMatchesUser(client);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Optional<MoodJournalEntry> opt = moodJournalEntryRepository.findByTenantClientAndDate(
            tenantId, client.getId(), date);
        if (opt.isEmpty()) {
            return;
        }
        MoodJournalEntry e = opt.get();
        e.delete();
        moodJournalEntryRepository.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MoodStatRowResponse> stats(User client, String period) {
        assertTenantMatchesUser(client);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        LocalDate today = LocalDate.now(DISPLAY_ZONE);
        LocalDate start;
        LocalDate end;
        if ("weekly".equalsIgnoreCase(period)) {
            start = today.minusDays(6);
            end = today;
        } else if ("monthly".equalsIgnoreCase(period) || period == null || period.isBlank()) {
            YearMonth ym = YearMonth.from(today);
            start = ym.atDay(1);
            end = ym.atEndOfMonth();
        } else {
            throw new IllegalArgumentException("period는 weekly 또는 monthly 여야 합니다.");
        }
        List<MoodJournalEntry> rows = moodJournalEntryRepository.findByTenantClientAndDateRange(
            tenantId, client.getId(), start, end);
        java.util.Map<LocalDate, Integer> valueByDay = new java.util.HashMap<>();
        for (MoodJournalEntry row : rows) {
            valueByDay.put(row.getJournalDate(), row.getMoodValue());
        }
        List<MoodStatRowResponse> out = new ArrayList<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            int v = valueByDay.getOrDefault(d, 0);
            out.add(MoodStatRowResponse.builder().date(d.toString()).value(v).build());
        }
        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MoodJournalInboxItemResponse> listInboxForConsultant(User consultant) {
        assertTenantMatchesUser(consultant);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return moodJournalEntryRepository.findInboxForConsultant(tenantId, consultant.getId()).stream()
            .map(e -> toInboxItem(tenantId, e))
            .toList();
    }

    private void maybeDispatchSharePush(
            String tenantId,
            User client,
            MoodJournalEntry entity,
            boolean wasShared) {
        if (wasShared || !entity.isSharedWithConsultant()) {
            return;
        }
        User managedClient = userRepository.findByTenantIdAndId(tenantId, client.getId())
            .orElse(client);
        User targetConsultant = consultantClientShareSupport.resolveTargetConsultant(
            tenantId, managedClient, null);
        consultantClientShareSupport.assertConsultantMappedToClient(
            tenantId, targetConsultant, managedClient);
        String clientName = consultantClientShareSupport.resolveClientDisplayName(managedClient);
        mobilePushDispatchService.dispatchMoodJournalShared(
            tenantId,
            managedClient.getId(),
            targetConsultant.getId(),
            clientName,
            entity.getJournalDate().toString(),
            entity.getEmoji(),
            entity.getMemo());
    }

    private MoodJournalInboxItemResponse toInboxItem(String tenantId, MoodJournalEntry e) {
        String emoji = e.getEmoji();
        if (emoji == null || emoji.isBlank()) {
            emoji = MoodJournalConstants.emojiForMoodValue(e.getMoodValue());
        }
        List<String> tags = e.getTags() == null ? List.of() : List.copyOf(e.getTags());
        Long clientId = e.getClientId();
        String clientName = null;
        if (clientId != null) {
            clientName = userRepository.findByTenantIdAndId(tenantId, clientId)
                .map(consultantClientShareSupport::resolveClientDisplayName)
                .orElse(null);
        }
        if (clientId != null && MindWeatherConstants.isGenericClientDisplayLabel(clientName)) {
            clientName = MindWeatherConstants.GENERIC_CLIENT_DISPLAY_LABEL + " #" + clientId;
        }
        return MoodJournalInboxItemResponse.builder()
            .id(e.getId())
            .clientId(clientId)
            .clientName(clientName)
            .date(e.getJournalDate().toString())
            .moodValue(e.getMoodValue())
            .emoji(emoji)
            .tags(tags)
            .memo(e.getMemo())
            .sharedWithConsultant(e.isSharedWithConsultant())
            .createdAt(formatOffset(e.getCreatedAt()))
            .updatedAt(formatOffset(e.getUpdatedAt()))
            .build();
    }

    private MoodJournalEntry newEntry(String tenantId, Long clientId, LocalDate journalDate) {
        MoodJournalEntry e = new MoodJournalEntry();
        e.setTenantId(tenantId);
        e.setClientId(clientId);
        e.setJournalDate(journalDate);
        e.setTags(List.of());
        e.setMemo("");
        e.setMoodValue(MoodJournalConstants.MIN_MOOD_VALUE);
        e.setEmoji(MoodJournalConstants.emojiForMoodValue(MoodJournalConstants.MIN_MOOD_VALUE));
        e.setSharedWithConsultant(false);
        return e;
    }

    private void applyPayload(MoodJournalEntry entity, MoodJournalUpsertRequest request) {
        int mv = request.getMoodValue();
        if (mv < MoodJournalConstants.MIN_MOOD_VALUE || mv > MoodJournalConstants.MAX_MOOD_VALUE) {
            throw new IllegalArgumentException("moodValue는 1~5 범위여야 합니다.");
        }
        entity.setMoodValue(mv);
        entity.setEmoji(MoodJournalConstants.emojiForMoodValue(mv));
        entity.setTags(normalizeTags(request.getTags()));
        entity.setMemo(request.getMemo().trim());
        entity.setSharedWithConsultant(Boolean.TRUE.equals(request.getSharedWithConsultant()));
    }

    private List<String> normalizeTags(List<String> tags) {
        if (tags == null) {
            return List.of();
        }
        List<String> out = tags.stream()
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .limit(MoodJournalConstants.MAX_TAGS + 1L)
            .toList();
        if (out.size() > MoodJournalConstants.MAX_TAGS) {
            throw new IllegalArgumentException("태그는 최대 " + MoodJournalConstants.MAX_TAGS + "개까지입니다.");
        }
        for (String t : out) {
            if (t.length() > MoodJournalConstants.MAX_TAG_LENGTH) {
                throw new IllegalArgumentException("태그 한 줄은 최대 " + MoodJournalConstants.MAX_TAG_LENGTH + "자입니다.");
            }
        }
        return out;
    }

    private void validatePayload(MoodJournalUpsertRequest request) {
        if (request.getMemo() == null) {
            throw new IllegalArgumentException("memo는 필수입니다.");
        }
        if (request.getMemo().length() > MoodJournalConstants.MAX_MEMO_CHARS) {
            throw new IllegalArgumentException("memo는 최대 " + MoodJournalConstants.MAX_MEMO_CHARS + "자입니다.");
        }
        if (request.getSharedWithConsultant() == null) {
            throw new IllegalArgumentException("sharedWithConsultant는 필수입니다.");
        }
        if (request.getMoodValue() == null) {
            throw new IllegalArgumentException("moodValue는 필수입니다.");
        }
    }

    private MoodJournalEntryResponse toResponse(MoodJournalEntry e) {
        String emoji = e.getEmoji();
        if (emoji == null || emoji.isBlank()) {
            emoji = MoodJournalConstants.emojiForMoodValue(e.getMoodValue());
        }
        List<String> tags = e.getTags() == null ? List.of() : List.copyOf(e.getTags());
        return MoodJournalEntryResponse.builder()
            .date(e.getJournalDate().toString())
            .moodValue(e.getMoodValue())
            .emoji(emoji)
            .tags(tags)
            .memo(e.getMemo())
            .sharedWithConsultant(e.isSharedWithConsultant())
            .createdAt(formatOffset(e.getCreatedAt()))
            .build();
    }

    private static String formatOffset(java.time.LocalDateTime t) {
        if (t == null) {
            return null;
        }
        return t.atZone(DISPLAY_ZONE).format(ISO_OFFSET);
    }

    private static YearMonth parseYearMonth(String month) {
        try {
            return YearMonth.parse(month.trim());
        } catch (Exception e) {
            throw new IllegalArgumentException("month는 yyyy-MM 형식이어야 합니다.", e);
        }
    }

    private void assertTenantMatchesUser(User user) {
        String ctx = TenantContextHolder.getRequiredTenantId();
        if (user.getTenantId() == null || user.getTenantId().isBlank() || !ctx.equals(user.getTenantId())) {
            throw new AccessDeniedException("테넌트 정보가 일치하지 않습니다.");
        }
    }
}

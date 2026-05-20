package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.dto.moodjournal.MoodJournalUpsertRequest;
import com.coresolution.consultation.entity.MoodJournalEntry;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.MoodJournalEntryRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.support.ConsultantClientShareSupport;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 감정 일기 공유 푸시 — false→true 전환 시에만 발송.
 *
 * @author MindGarden
 * @since 2026-05-21
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MoodJournalServiceImpl share push")
class MoodJournalServiceImplSharePushTest {

    private static final String TENANT = "tenant-mj-push";

    @Mock
    private MoodJournalEntryRepository moodJournalEntryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ConsultantClientShareSupport consultantClientShareSupport;

    @Mock
    private MobilePushDispatchService mobilePushDispatchService;

    @InjectMocks
    private MoodJournalServiceImpl moodJournalService;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("sharedWithConsultant false→true 시 dispatchMoodJournalShared 1회")
    void dispatchesPushOnShareTransition() {
        User client = clientUser(10L);
        User consultant = consultantUser(20L);
        LocalDate day = LocalDate.of(2026, 5, 20);
        MoodJournalEntry entity = entry(10L, day, false);
        MoodJournalUpsertRequest request = upsert(day.toString(), 4, "메모", true);

        when(moodJournalEntryRepository.findByTenantClientAndDate(TENANT, 10L, day))
            .thenReturn(Optional.of(entity));
        when(userRepository.findByTenantIdAndId(TENANT, 10L)).thenReturn(Optional.of(client));
        when(consultantClientShareSupport.resolveTargetConsultant(TENANT, client, null))
            .thenReturn(consultant);
        when(consultantClientShareSupport.resolveClientDisplayName(client)).thenReturn("김내담");

        moodJournalService.updateByDate(client, day, request);

        verify(mobilePushDispatchService).dispatchMoodJournalShared(
            eq(TENANT),
            eq(10L),
            eq(20L),
            eq("김내담"),
            eq(day.toString()),
            eq("🙂"),
            eq("메모"));
    }

    @Test
    @DisplayName("이미 sharedWithConsultant=true면 푸시 미발송")
    void skipsPushWhenAlreadyShared() {
        User client = clientUser(11L);
        LocalDate day = LocalDate.of(2026, 5, 19);
        MoodJournalEntry entity = entry(11L, day, true);
        MoodJournalUpsertRequest request = upsert(day.toString(), 3, "변경", true);

        when(moodJournalEntryRepository.findByTenantClientAndDate(TENANT, 11L, day))
            .thenReturn(Optional.of(entity));

        moodJournalService.updateByDate(client, day, request);

        verify(mobilePushDispatchService, never()).dispatchMoodJournalShared(
            any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("공유 OFF 유지 시 푸시 미발송")
    void skipsPushWhenShareOff() {
        User client = clientUser(12L);
        LocalDate day = LocalDate.of(2026, 5, 18);
        MoodJournalEntry entity = entry(12L, day, false);
        MoodJournalUpsertRequest request = upsert(day.toString(), 2, "비공유", false);

        when(moodJournalEntryRepository.findByTenantClientAndDate(TENANT, 12L, day))
            .thenReturn(Optional.of(entity));

        moodJournalService.updateByDate(client, day, request);

        verify(mobilePushDispatchService, never()).dispatchMoodJournalShared(
            any(), any(), any(), any(), any(), any(), any());
        verify(consultantClientShareSupport, never()).resolveTargetConsultant(any(), any(), isNull());
    }

    private static User clientUser(long id) {
        User u = new User();
        u.setId(id);
        u.setTenantId(TENANT);
        return u;
    }

    private static User consultantUser(long id) {
        User u = new User();
        u.setId(id);
        u.setTenantId(TENANT);
        return u;
    }

    private static MoodJournalUpsertRequest upsert(
            String date,
            int moodValue,
            String memo,
            boolean shared) {
        MoodJournalUpsertRequest request = new MoodJournalUpsertRequest();
        request.setDate(date);
        request.setMoodValue(moodValue);
        request.setTags(List.of());
        request.setMemo(memo);
        request.setSharedWithConsultant(shared);
        return request;
    }

    private static MoodJournalEntry entry(long clientId, LocalDate day, boolean shared) {
        MoodJournalEntry e = new MoodJournalEntry();
        e.setTenantId(TENANT);
        e.setClientId(clientId);
        e.setJournalDate(day);
        e.setMoodValue(shared ? 4 : 3);
        e.setEmoji(shared ? "🙂" : "😐");
        e.setTags(List.of());
        e.setMemo(shared ? "메모" : "비공유");
        e.setSharedWithConsultant(shared);
        return e;
    }
}

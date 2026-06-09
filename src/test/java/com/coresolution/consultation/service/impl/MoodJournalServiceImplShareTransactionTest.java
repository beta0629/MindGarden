package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.dto.moodjournal.MoodJournalEntryResponse;
import com.coresolution.consultation.dto.moodjournal.MoodJournalUpsertRequest;
import com.coresolution.consultation.entity.MoodJournalEntry;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.NoActiveConsultantMappingException;
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
 * 무드 저널 — 공유 푸시 best-effort 트랜잭션 분리 회귀 테스트.
 *
 * <p>일기 저장은 항상 성공해야 하며, 푸시는 매핑 부재·인프라 오류에도 트랜잭션을 롤백하지 않아야 한다.
 * 응답 DTO 의 {@code consultantSharePending} 필드가 의도와 발송 결과를 정확히 반영하는지 검증.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MoodJournalServiceImpl — 공유 푸시 best-effort 트랜잭션 분리")
class MoodJournalServiceImplShareTransactionTest {

    private static final String TENANT = "tenant-mj-share-tx";

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
    @DisplayName("토글 OFF — 푸시 미발송 + consultantSharePending=false")
    void shareOff_skipPush_pendingFalse() {
        User client = clientUser(101L);
        LocalDate day = LocalDate.of(2026, 6, 1);
        MoodJournalEntry existing = entry(101L, day, false);
        MoodJournalUpsertRequest request = upsert(day.toString(), 3, "비공유", false);

        when(moodJournalEntryRepository.findByTenantClientAndDate(TENANT, 101L, day))
            .thenReturn(Optional.of(existing));

        MoodJournalEntryResponse response = moodJournalService.updateByDate(client, day, request);

        assertThat(response.isConsultantSharePending()).isFalse();
        assertThat(response.isSharedWithConsultant()).isFalse();
        verify(mobilePushDispatchService, never()).dispatchMoodJournalShared(
            any(), any(), any(), any(), any(), any(), any());
        verify(consultantClientShareSupport, never()).resolveTargetConsultant(any(), any(), isNull());
    }

    @Test
    @DisplayName("토글 ON + 매칭 0건 — 일기 저장 성공, 푸시 skip, consultantSharePending=true")
    void shareOnNoMapping_journalSaved_pushSkipped_pendingTrue() {
        User client = clientUser(102L);
        LocalDate day = LocalDate.of(2026, 6, 2);
        MoodJournalEntry existing = entry(102L, day, false);
        MoodJournalUpsertRequest request = upsert(day.toString(), 4, "공유 의도", true);

        when(moodJournalEntryRepository.findByTenantClientAndDate(TENANT, 102L, day))
            .thenReturn(Optional.of(existing));
        when(userRepository.findByTenantIdAndId(TENANT, 102L)).thenReturn(Optional.of(client));
        when(consultantClientShareSupport.hasShareableMapping(TENANT, client)).thenReturn(false);

        MoodJournalEntryResponse response = moodJournalService.updateByDate(client, day, request);

        assertThat(response.isSharedWithConsultant()).isTrue();
        assertThat(response.isConsultantSharePending()).isTrue();
        verify(moodJournalEntryRepository).save(existing);
        verify(mobilePushDispatchService, never()).dispatchMoodJournalShared(
            any(), any(), any(), any(), any(), any(), any());
        verify(consultantClientShareSupport, never()).resolveTargetConsultant(any(), any(), isNull());
    }

    @Test
    @DisplayName("토글 ON + 매칭 ACTIVE — 일기 저장 성공, 푸시 발송, consultantSharePending=false")
    void shareOnActiveMapping_journalSaved_pushDispatched_pendingFalse() {
        User client = clientUser(103L);
        User consultant = consultantUser(203L);
        LocalDate day = LocalDate.of(2026, 6, 3);
        MoodJournalEntry existing = entry(103L, day, false);
        MoodJournalUpsertRequest request = upsert(day.toString(), 4, "공유 정상", true);

        when(moodJournalEntryRepository.findByTenantClientAndDate(TENANT, 103L, day))
            .thenReturn(Optional.of(existing));
        when(userRepository.findByTenantIdAndId(TENANT, 103L)).thenReturn(Optional.of(client));
        when(consultantClientShareSupport.hasShareableMapping(TENANT, client)).thenReturn(true);
        when(consultantClientShareSupport.resolveTargetConsultant(TENANT, client, null))
            .thenReturn(consultant);
        when(consultantClientShareSupport.resolveClientDisplayName(client)).thenReturn("김내담");

        MoodJournalEntryResponse response = moodJournalService.updateByDate(client, day, request);

        assertThat(response.isSharedWithConsultant()).isTrue();
        assertThat(response.isConsultantSharePending()).isFalse();
        verify(moodJournalEntryRepository).save(existing);
        verify(mobilePushDispatchService).dispatchMoodJournalShared(
            eq(TENANT),
            eq(103L),
            eq(203L),
            eq("김내담"),
            eq(day.toString()),
            eq(existing.getEmoji()),
            eq(existing.getMemo()));
    }

    @Test
    @DisplayName("토글 ON + 매핑 동시 INACTIVE 변경 — NoActiveConsultantMappingException 던져도 일기 저장 성공")
    void raceCondition_resolveThrows_journalStillSaved_pendingTrue() {
        User client = clientUser(104L);
        LocalDate day = LocalDate.of(2026, 6, 4);
        MoodJournalEntry existing = entry(104L, day, false);
        MoodJournalUpsertRequest request = upsert(day.toString(), 5, "경쟁 조건", true);

        when(moodJournalEntryRepository.findByTenantClientAndDate(TENANT, 104L, day))
            .thenReturn(Optional.of(existing));
        when(userRepository.findByTenantIdAndId(TENANT, 104L)).thenReturn(Optional.of(client));
        when(consultantClientShareSupport.hasShareableMapping(TENANT, client)).thenReturn(true);
        when(consultantClientShareSupport.resolveTargetConsultant(TENANT, client, null))
            .thenThrow(new NoActiveConsultantMappingException(
                "매칭된 담당 상담사가 없습니다. 먼저 상담을 신청해 주세요."));

        MoodJournalEntryResponse response = moodJournalService.updateByDate(client, day, request);

        assertThat(response.isConsultantSharePending()).isTrue();
        verify(moodJournalEntryRepository).save(existing);
        verify(mobilePushDispatchService, never()).dispatchMoodJournalShared(
            any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("토글 ON + 푸시 인프라 오류 — 일기 저장 성공, consultantSharePending=true")
    void pushInfraFails_journalStillSaved_pendingTrue() {
        User client = clientUser(105L);
        User consultant = consultantUser(205L);
        LocalDate day = LocalDate.of(2026, 6, 5);
        MoodJournalEntry existing = entry(105L, day, false);
        MoodJournalUpsertRequest request = upsert(day.toString(), 4, "푸시 실패", true);

        when(moodJournalEntryRepository.findByTenantClientAndDate(TENANT, 105L, day))
            .thenReturn(Optional.of(existing));
        when(userRepository.findByTenantIdAndId(TENANT, 105L)).thenReturn(Optional.of(client));
        when(consultantClientShareSupport.hasShareableMapping(TENANT, client)).thenReturn(true);
        when(consultantClientShareSupport.resolveTargetConsultant(TENANT, client, null))
            .thenReturn(consultant);
        when(consultantClientShareSupport.resolveClientDisplayName(client)).thenReturn("김내담");
        org.mockito.Mockito.doThrow(new RuntimeException("FCM down"))
            .when(mobilePushDispatchService).dispatchMoodJournalShared(
                any(), any(), any(), any(), any(), any(), any());

        MoodJournalEntryResponse response = moodJournalService.updateByDate(client, day, request);

        assertThat(response.isSharedWithConsultant()).isTrue();
        assertThat(response.isConsultantSharePending()).isTrue();
        verify(moodJournalEntryRepository).save(existing);
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

package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ClientScheduleNoteCreateRequest;
import com.coresolution.consultation.dto.ClientScheduleNoteResponse;
import com.coresolution.consultation.dto.ClientScheduleNoteUpdateRequest;
import com.coresolution.consultation.entity.ClientScheduleNote;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.ClientScheduleNoteRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

/**
 * {@link ClientScheduleNoteServiceImpl} 단위 테스트 — P3·P4·테넌트·목록 쿼리.
 *
 * @author CoreSolution
 * @since 2026-04-29
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientScheduleNoteServiceImpl")
class ClientScheduleNoteServiceImplTest {

    private static final String TENANT_A = "tenant-" + UUID.randomUUID();
    private static final String TENANT_B = "tenant-" + UUID.randomUUID();

    @Mock
    private ClientScheduleNoteRepository clientScheduleNoteRepository;

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private ConsultantClientMappingRepository consultantClientMappingRepository;

    @InjectMocks
    private ClientScheduleNoteServiceImpl service;

    private static User user(Long id, UserRole role) {
        User u = new User();
        u.setId(id);
        u.setRole(role);
        return u;
    }

    @Test
    @DisplayName("clientId·scheduleId·mappingId 모두 없으면 목록 조회 IllegalArgumentException")
    void listNotes_rejectsEmptyQuery() {
        assertThrows(IllegalArgumentException.class,
                () -> service.listNotes(TENANT_A, null, null, null, false, user(1L, UserRole.ADMIN)));
    }

    @Test
    @DisplayName("P4: STAFF는 includeDeleted=true여도 삭제분 조회 플래그가 repository에 전달되지 않음(false)")
    void listNotes_staffCannotForceIncludeDeleted() {
        when(scheduleRepository.findById(10L)).thenReturn(Optional.of(schedule(10L, TENANT_A, 5L)));
        when(clientScheduleNoteRepository.listBySchedule(eq(TENANT_A), eq(10L), eq(false)))
                .thenReturn(List.of());

        service.listNotes(TENANT_A, null, 10L, null, true, user(99L, UserRole.STAFF));

        verify(clientScheduleNoteRepository).listBySchedule(TENANT_A, 10L, false);
    }

    @Test
    @DisplayName("P4: ADMIN은 includeDeleted=true일 때 repository에 true 전달")
    void listNotes_adminIncludeDeleted() {
        when(scheduleRepository.findById(11L)).thenReturn(Optional.of(schedule(11L, TENANT_A, null)));
        when(clientScheduleNoteRepository.listBySchedule(eq(TENANT_A), eq(11L), eq(true)))
                .thenReturn(List.of());

        service.listNotes(TENANT_A, null, 11L, null, true, user(1L, UserRole.ADMIN));

        verify(clientScheduleNoteRepository).listBySchedule(TENANT_A, 11L, true);
    }

    @Test
    @DisplayName("P3: STAFF가 타인 작성 노트 수정 시 AccessDeniedException")
    void update_staffOtherAuthor_forbidden() {
        Long noteId = 700L;
        ClientScheduleNote note = note(noteId, TENANT_A, 1L);
        when(clientScheduleNoteRepository.findById(noteId)).thenReturn(Optional.of(note));

        ClientScheduleNoteUpdateRequest req = ClientScheduleNoteUpdateRequest.builder()
                .title("changed")
                .build();

        assertThrows(AccessDeniedException.class,
                () -> service.update(TENANT_A, noteId, req, user(2L, UserRole.STAFF)));
    }

    @Test
    @DisplayName("P3: STAFF는 본인 작성 노트 수정 가능")
    void update_staffOwnNote_ok() {
        Long noteId = 701L;
        ClientScheduleNote note = note(noteId, TENANT_A, 1L);
        note.setCreatedBy(5L);
        when(clientScheduleNoteRepository.findById(noteId)).thenReturn(Optional.of(note));
        when(clientScheduleNoteRepository.save(any(ClientScheduleNote.class))).thenAnswer(inv -> inv.getArgument(0));

        ClientScheduleNoteUpdateRequest req = ClientScheduleNoteUpdateRequest.builder()
                .title("  mine  ")
                .build();

        var out = service.update(TENANT_A, noteId, req, user(5L, UserRole.STAFF));
        assertThat(out.getTitle()).isEqualTo("mine");
    }

    @Test
    @DisplayName("P3: ADMIN은 타인 작성 노트 삭제 가능")
    void softDelete_adminOtherAuthor_ok() {
        Long noteId = 702L;
        ClientScheduleNote note = note(noteId, TENANT_A, 1L);
        note.setCreatedBy(999L);
        when(clientScheduleNoteRepository.findById(noteId)).thenReturn(Optional.of(note));
        when(clientScheduleNoteRepository.save(any(ClientScheduleNote.class))).thenAnswer(inv -> inv.getArgument(0));

        service.softDelete(TENANT_A, noteId, user(1L, UserRole.ADMIN));

        ArgumentCaptor<ClientScheduleNote> cap = ArgumentCaptor.forClass(ClientScheduleNote.class);
        verify(clientScheduleNoteRepository).save(cap.capture());
        assertThat(cap.getValue().getIsDeleted()).isTrue();
    }

    @Test
    @DisplayName("테넌트 불일치 노트는 EntityNotFoundException (다른 테넌트 ID로 조회)")
    void update_wrongTenant_notFound() {
        Long noteId = 703L;
        ClientScheduleNote note = note(noteId, TENANT_B, 1L);
        when(clientScheduleNoteRepository.findById(noteId)).thenReturn(Optional.of(note));

        assertThrows(EntityNotFoundException.class,
                () -> service.update(TENANT_A, noteId,
                        ClientScheduleNoteUpdateRequest.builder().title("x").build(),
                        user(1L, UserRole.ADMIN)));
    }

    @Test
    @DisplayName("mappingId만으로 목록 조회 시 매핑 테넌트 검증 후 repository 호출")
    void listNotes_mappingOnly() {
        Long mid = 55L;
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setTenantId(TENANT_A);
        when(consultantClientMappingRepository.findById(mid)).thenReturn(Optional.of(m));
        when(clientScheduleNoteRepository.listByMapping(TENANT_A, mid, false)).thenReturn(List.of());

        Map<String, Object> out = service.listNotes(TENANT_A, null, null, mid, false, user(1L, UserRole.ADMIN));

        assertThat(out).containsKeys("notes", "totalCount", "unresolvedCount");
        assertThat(out.get("totalCount")).isEqualTo(0);
        assertThat(out.get("unresolvedCount")).isEqualTo(0L);
        verify(clientScheduleNoteRepository).listByMapping(TENANT_A, mid, false);
    }

    @Test
    @DisplayName("목록: unresolvedCount 및 미해소 우선 정렬")
    void listNotes_unresolvedCount_andOrder() {
        when(scheduleRepository.findById(12L)).thenReturn(Optional.of(schedule(12L, TENANT_A, null)));
        ClientScheduleNote resolvedFirst = note(10L, TENANT_A, 12L);
        resolvedFirst.setResolvedAt(LocalDateTime.of(2026, 4, 1, 12, 0));
        resolvedFirst.setCreatedAt(LocalDateTime.of(2026, 3, 1, 10, 0));
        ClientScheduleNote open = note(11L, TENANT_A, 12L);
        open.setResolvedAt(null);
        open.setCreatedAt(LocalDateTime.of(2026, 3, 2, 10, 0));
        when(clientScheduleNoteRepository.listBySchedule(TENANT_A, 12L, false)).thenReturn(List.of(resolvedFirst, open));

        Map<String, Object> out = service.listNotes(TENANT_A, null, 12L, null, false, user(1L, UserRole.ADMIN));

        assertThat(out.get("unresolvedCount")).isEqualTo(1L);
        assertThat(out.get("totalCount")).isEqualTo(2);
        @SuppressWarnings("unchecked")
        List<ClientScheduleNoteResponse> notes = (List<ClientScheduleNoteResponse>) out.get("notes");
        assertThat(notes.get(0).getId()).isEqualTo("11");
        assertThat(notes.get(1).getId()).isEqualTo("10");
    }

    @Test
    @DisplayName("수정: resolved=true 시 resolvedAt 설정")
    void update_resolvedTrue_setsResolvedAt() {
        Long noteId = 800L;
        ClientScheduleNote row = note(noteId, TENANT_A, 9L);
        row.setCreatedBy(1L);
        row.setResolvedAt(null);
        when(clientScheduleNoteRepository.findById(noteId)).thenReturn(Optional.of(row));
        when(clientScheduleNoteRepository.save(any(ClientScheduleNote.class))).thenAnswer(inv -> inv.getArgument(0));

        service.update(TENANT_A, noteId,
                ClientScheduleNoteUpdateRequest.builder().resolved(true).build(),
                user(1L, UserRole.ADMIN));

        ArgumentCaptor<ClientScheduleNote> cap = ArgumentCaptor.forClass(ClientScheduleNote.class);
        verify(clientScheduleNoteRepository).save(cap.capture());
        assertThat(cap.getValue().getResolvedAt()).isNotNull();
    }

    @Test
    @DisplayName("생성: scheduleId만으로 스케줄 테넌트 검증 후 저장")
    void create_withScheduleId_resolvesTenant() {
        Long sid = 88L;
        when(scheduleRepository.findById(sid)).thenReturn(Optional.of(schedule(sid, TENANT_A, null)));
        when(clientScheduleNoteRepository.save(any(ClientScheduleNote.class))).thenAnswer(inv -> {
            ClientScheduleNote n = inv.getArgument(0);
            n.setId(1001L);
            return n;
        });

        ClientScheduleNoteCreateRequest req = ClientScheduleNoteCreateRequest.builder()
                .scheduleId(sid)
                .noteType("OTHER")
                .title(" t1 ")
                .body("b")
                .build();

        var created = service.create(TENANT_A, req, user(3L, UserRole.STAFF));
        assertThat(created.getId()).isEqualTo("1001");
        ArgumentCaptor<ClientScheduleNote> cap = ArgumentCaptor.forClass(ClientScheduleNote.class);
        verify(clientScheduleNoteRepository).save(cap.capture());
        assertThat(cap.getValue().getTenantId()).isEqualTo(TENANT_A);
        assertThat(cap.getValue().getTitle()).isEqualTo("t1");
        assertThat(cap.getValue().getIsDeleted()).isFalse();
    }

    private static Schedule schedule(Long id, String tenantId, Long clientId) {
        Schedule s = new Schedule();
        s.setId(id);
        s.setTenantId(tenantId);
        s.setClientId(clientId);
        return s;
    }

    private static ClientScheduleNote note(Long id, String tenantId, Long scheduleId) {
        ClientScheduleNote n = new ClientScheduleNote();
        n.setId(id);
        n.setTenantId(tenantId);
        n.setScheduleId(scheduleId);
        n.setNoteType("OTHER");
        n.setTitle("t");
        n.setIsDeleted(false);
        return n;
    }
}

package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
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
import com.coresolution.consultation.service.ClientScheduleNoteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 내담자 스케줄 특이사항 서비스 구현. P3: ADMIN 전체 수정·삭제, STAFF는 본인 작성분만.
 *
 * @author CoreSolution
 * @since 2026-04-29
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClientScheduleNoteServiceImpl implements ClientScheduleNoteService {

    private final ClientScheduleNoteRepository clientScheduleNoteRepository;
    private final ScheduleRepository scheduleRepository;
    private final ConsultantClientMappingRepository consultantClientMappingRepository;

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> listNotes(
            String tenantId,
            Long clientId,
            Long scheduleId,
            Long mappingId,
            boolean includeDeleted,
            User currentUser) {
        Objects.requireNonNull(tenantId, "tenantId");
        if (clientId == null && scheduleId == null && mappingId == null) {
            throw new IllegalArgumentException("clientId, scheduleId, mappingId 중 하나 이상이 필요합니다.");
        }
        boolean showDeleted = includeDeleted && canViewDeletedList(currentUser);
        List<ClientScheduleNote> rows;
        if (scheduleId != null) {
            requireScheduleInTenant(tenantId, scheduleId);
            rows = clientScheduleNoteRepository.listBySchedule(tenantId, scheduleId, showDeleted);
            if (clientId != null) {
                rows = rows.stream()
                        .filter(n -> n.getClientId() == null || clientId.equals(n.getClientId()))
                        .collect(Collectors.toList());
            }
            if (mappingId != null) {
                rows = rows.stream()
                        .filter(n -> n.getMappingId() == null || mappingId.equals(n.getMappingId()))
                        .collect(Collectors.toList());
            }
        } else if (clientId != null) {
            rows = clientScheduleNoteRepository.listByClient(tenantId, clientId, showDeleted);
        } else {
            requireMappingInTenant(tenantId, mappingId);
            rows = clientScheduleNoteRepository.listByMapping(tenantId, mappingId, showDeleted);
        }
        List<ClientScheduleNoteResponse> dtos = rows.stream()
                .map(ClientScheduleNoteResponse::fromEntity)
                .collect(Collectors.toList());
        Map<String, Object> out = new HashMap<>();
        out.put("notes", dtos);
        out.put("totalCount", dtos.size());
        return out;
    }

    @Override
    @Transactional
    public ClientScheduleNoteResponse create(String tenantId, ClientScheduleNoteCreateRequest request, User currentUser) {
        Objects.requireNonNull(tenantId, "tenantId");
        Objects.requireNonNull(request, "request");
        if (request.getClientId() == null && request.getScheduleId() == null && request.getMappingId() == null) {
            throw new IllegalArgumentException("clientId, scheduleId, mappingId 중 하나 이상이 필요합니다.");
        }
        Long resolvedClientId = request.getClientId();
        Long resolvedScheduleId = request.getScheduleId();
        Long resolvedMappingId = request.getMappingId();

        if (resolvedScheduleId != null) {
            Schedule sch = requireScheduleInTenant(tenantId, resolvedScheduleId);
            if (resolvedClientId == null && sch.getClientId() != null) {
                resolvedClientId = sch.getClientId();
            }
        }
        if (resolvedMappingId != null) {
            ConsultantClientMapping m = requireMappingInTenant(tenantId, resolvedMappingId);
            if (resolvedClientId == null && m.getClient() != null) {
                resolvedClientId = m.getClient().getId();
            }
        }

        ClientScheduleNote entity = new ClientScheduleNote();
        entity.setTenantId(tenantId);
        entity.setClientId(resolvedClientId);
        entity.setScheduleId(resolvedScheduleId);
        entity.setMappingId(resolvedMappingId);
        entity.setOccurrenceKey(request.getOccurrenceKey());
        entity.setNoteType(request.getNoteType().trim());
        entity.setTitle(request.getTitle().trim());
        entity.setBody(request.getBody());
        entity.setPromiseDate(parsePromiseDate(request.getPromiseDate()));
        entity.setAmount(request.getAmount());
        entity.setCurrency(request.getCurrency() != null ? request.getCurrency().trim() : null);
        Long uid = currentUser != null ? currentUser.getId() : null;
        entity.setCreatedBy(uid);
        entity.setUpdatedBy(uid);
        entity.setIsDeleted(false);
        entity.setDeletedAt(null);
        ClientScheduleNote saved = clientScheduleNoteRepository.save(entity);
        log.info("특이사항 생성: tenantId={}, id={}, scheduleId={}, clientId={}", tenantId, saved.getId(),
                saved.getScheduleId(), saved.getClientId());
        return ClientScheduleNoteResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public ClientScheduleNoteResponse update(
            String tenantId, Long noteId, ClientScheduleNoteUpdateRequest request, User currentUser) {
        ClientScheduleNote entity = requireNote(tenantId, noteId);
        if (!canModify(currentUser, entity)) {
            throw new AccessDeniedException("이 특이사항을 수정할 권한이 없습니다.");
        }
        if (request.getNoteType() != null && !request.getNoteType().isBlank()) {
            entity.setNoteType(request.getNoteType().trim());
        }
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            entity.setTitle(request.getTitle().trim());
        }
        if (request.getBody() != null) {
            entity.setBody(request.getBody());
        }
        if (request.getPromiseDate() != null) {
            String pd = request.getPromiseDate().trim();
            entity.setPromiseDate(pd.isEmpty() ? null : parsePromiseDate(pd));
        }
        if (request.getAmount() != null) {
            entity.setAmount(request.getAmount());
        }
        if (request.getCurrency() != null) {
            entity.setCurrency(request.getCurrency().trim());
        }
        entity.setUpdatedBy(currentUser != null ? currentUser.getId() : null);
        ClientScheduleNote saved = clientScheduleNoteRepository.save(entity);
        return ClientScheduleNoteResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public void softDelete(String tenantId, Long noteId, User currentUser) {
        ClientScheduleNote entity = requireNote(tenantId, noteId);
        if (!canModify(currentUser, entity)) {
            throw new AccessDeniedException("이 특이사항을 삭제할 권한이 없습니다.");
        }
        entity.delete();
        entity.setUpdatedBy(currentUser != null ? currentUser.getId() : null);
        clientScheduleNoteRepository.save(entity);
        log.info("특이사항 소프트 삭제: tenantId={}, noteId={}", tenantId, noteId);
    }

    private ClientScheduleNote requireNote(String tenantId, Long noteId) {
        ClientScheduleNote n = clientScheduleNoteRepository.findById(noteId)
                .orElseThrow(() -> new EntityNotFoundException("ClientScheduleNote", noteId));
        if (!tenantId.equals(n.getTenantId())) {
            throw new EntityNotFoundException("ClientScheduleNote", noteId);
        }
        return n;
    }

    private Schedule requireScheduleInTenant(String tenantId, Long scheduleId) {
        Schedule s = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("Schedule", scheduleId));
        if (!tenantId.equals(s.getTenantId())) {
            throw new EntityNotFoundException("Schedule", scheduleId);
        }
        return s;
    }

    private ConsultantClientMapping requireMappingInTenant(String tenantId, Long mappingId) {
        ConsultantClientMapping m = consultantClientMappingRepository.findById(mappingId)
                .orElseThrow(() -> new EntityNotFoundException("ConsultantClientMapping", mappingId));
        if (!tenantId.equals(m.getTenantId())) {
            throw new EntityNotFoundException("ConsultantClientMapping", mappingId);
        }
        return m;
    }

    private static LocalDate parsePromiseDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return LocalDate.parse(raw.trim());
    }

    private static boolean canViewDeletedList(User user) {
        return user != null && user.getRole() != null && user.getRole().isAdmin();
    }

    private static boolean canModify(User user, ClientScheduleNote note) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        if (user.getRole().isAdmin()) {
            return true;
        }
        if (user.getRole() == UserRole.STAFF) {
            return note.getCreatedBy() != null && note.getCreatedBy().equals(user.getId());
        }
        return false;
    }
}

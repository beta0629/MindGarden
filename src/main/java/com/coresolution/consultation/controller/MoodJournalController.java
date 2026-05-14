package com.coresolution.consultation.controller;

import java.time.LocalDate;
import java.util.List;
import com.coresolution.consultation.dto.moodjournal.MoodJournalEntryResponse;
import com.coresolution.consultation.dto.moodjournal.MoodJournalUpsertRequest;
import com.coresolution.consultation.dto.moodjournal.MoodStatRowResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.MoodJournalService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Expo {@code MOOD_JOURNAL_API} — 내담자 감정 일기.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@RestController
@RequestMapping("/api/v1/mood-journals")
@RequiredArgsConstructor
public class MoodJournalController extends BaseApiController {

    private final MoodJournalService moodJournalService;

    /**
     * 통계 — 경로 {@code /stats}는 {@code /{date}}보다 먼저 매핑한다.
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<List<MoodStatRowResponse>>> stats(
            HttpSession session,
            @RequestParam String period) {
        User client = requireClient(session);
        String tenantId = requireTenantId(client);
        try {
            TenantContextHolder.setTenantId(tenantId);
            return success(moodJournalService.stats(client, period));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 월별 목록 — 쿼리 {@code month=yyyy-MM}.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MoodJournalEntryResponse>>> listMonth(
            HttpSession session,
            @RequestParam String month) {
        User client = requireClient(session);
        String tenantId = requireTenantId(client);
        try {
            TenantContextHolder.setTenantId(tenantId);
            return success(moodJournalService.listMonth(client, month));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 일자 상세.
     */
    @GetMapping("/{journalDate:\\d{4}-\\d{2}-\\d{2}}")
    public ResponseEntity<ApiResponse<MoodJournalEntryResponse>> getOne(
            HttpSession session,
            @PathVariable("journalDate") String journalDate) {
        User client = requireClient(session);
        String tenantId = requireTenantId(client);
        LocalDate d = LocalDate.parse(journalDate);
        try {
            TenantContextHolder.setTenantId(tenantId);
            MoodJournalEntryResponse data = moodJournalService.getByDate(client, d);
            return success(data);
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 신규 저장(동일 일자면 갱신).
     */
    @PostMapping
    public ResponseEntity<ApiResponse<MoodJournalEntryResponse>> create(
            HttpSession session,
            @Valid @RequestBody MoodJournalUpsertRequest request) {
        User client = requireClient(session);
        String tenantId = requireTenantId(client);
        try {
            TenantContextHolder.setTenantId(tenantId);
            return created(moodJournalService.createOrReplace(client, request));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 일자 기준 수정.
     */
    @PutMapping("/{journalDate:\\d{4}-\\d{2}-\\d{2}}")
    public ResponseEntity<ApiResponse<MoodJournalEntryResponse>> update(
            HttpSession session,
            @PathVariable("journalDate") String journalDate,
            @Valid @RequestBody MoodJournalUpsertRequest request) {
        User client = requireClient(session);
        String tenantId = requireTenantId(client);
        LocalDate d = LocalDate.parse(journalDate);
        try {
            TenantContextHolder.setTenantId(tenantId);
            return updated(moodJournalService.updateByDate(client, d, request));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 일자 기준 삭제(멱등).
     */
    @DeleteMapping("/{journalDate:\\d{4}-\\d{2}-\\d{2}}")
    public ResponseEntity<ApiResponse<Void>> delete(
            HttpSession session,
            @PathVariable("journalDate") String journalDate) {
        User client = requireClient(session);
        String tenantId = requireTenantId(client);
        LocalDate d = LocalDate.parse(journalDate);
        try {
            TenantContextHolder.setTenantId(tenantId);
            moodJournalService.deleteByDate(client, d);
            return deleted();
        } finally {
            TenantContextHolder.clear();
        }
    }

    private static User requireClient(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        if (user.getRole() == null || !user.getRole().isClient()) {
            throw new org.springframework.security.access.AccessDeniedException("내담자만 이용할 수 있습니다.");
        }
        return user;
    }

    private static String requireTenantId(User client) {
        String tenantId = client.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new org.springframework.security.access.AccessDeniedException("테넌트 정보가 없습니다.");
        }
        return tenantId.trim();
    }
}

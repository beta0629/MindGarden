package com.coresolution.core.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.coresolution.consultation.dto.security.PiiRotationProgressResponse;
import com.coresolution.consultation.dto.security.PiiRotationResult;
import com.coresolution.consultation.entity.PiiReencryptionProgress.Status;
import com.coresolution.consultation.service.PersonalDataKeyRotationService;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.util.LogSanitizer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PII KEY/IV 회전 어드민 엔드포인트.
 *
 * <p>운영팀 슈퍼관리자 ({@code HQ_MASTER}) 만 호출 가능. 본 컨트롤러는 회전 메타·진행률만
 * 노출하며, 응답에 평문 / 암호문 PII 를 포함하지 않는다.</p>
 *
 * <h3>엔드포인트</h3>
 * <ul>
 *   <li>{@code POST /api/v1/admin/pii-rotation/start} — 회전 시작 (table, target_key_id, chunk_size)</li>
 *   <li>{@code GET  /api/v1/admin/pii-rotation/progress} — 진행률 조회 (table, target_key_id)</li>
 *   <li>{@code POST /api/v1/admin/pii-rotation/resume} — 실패 chunk 재시도</li>
 *   <li>{@code POST /api/v1/admin/pii-rotation/cancel} — 진행 중 chunk 취소</li>
 * </ul>
 *
 * <h3>관련 표준</h3>
 * <ul>
 *   <li>{@code docs/standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md} §3.2.4</li>
 *   <li>{@code docs/standards/SECRET_ROTATION_POLICY.md} v1.2.0 §3.4</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-15
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/pii-rotation")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HQ_MASTER')")
public class PiiKeyRotationAdminController extends BaseApiController {

    private final PersonalDataKeyRotationService rotationService;

    /**
     * PII 회전 시작.
     *
     * @param table 회전 대상 테이블 (users / clients / accounts / branches / dormant_user_pii_vault)
     * @param targetKeyId 회전 목표 키 ID — 활성 키와 일치해야 한다 (Phase 1 제약)
     * @param chunkSize chunk 크기 (default 100)
     * @return 회전 결과 집계 (평문 PII 비포함)
     */
    @PostMapping("/start")
    public ResponseEntity<ApiResponse<PiiRotationResult>> start(
            @RequestParam String table,
            @RequestParam("target_key_id") String targetKeyId,
            @RequestParam(value = "chunk_size", defaultValue = "100") int chunkSize) {
        log.info("PII 회전 시작 요청 — table={}, targetKeyId={}, chunkSize={}",
            LogSanitizer.forLog(table), LogSanitizer.forLog(targetKeyId), chunkSize);
        PiiRotationResult result = dispatchStart(table, chunkSize, targetKeyId);
        return success("PII 회전이 실행되었습니다.", result);
    }

    /**
     * PII 회전 진행률 조회.
     *
     * <p>chunk 상태별 카운트와 활성·목표 키 ID 만 반환한다.</p>
     */
    @GetMapping("/progress")
    public ResponseEntity<ApiResponse<PiiRotationProgressResponse>> progress(
            @RequestParam String table,
            @RequestParam("target_key_id") String targetKeyId) {
        log.info("PII 회전 진행률 조회 — table={}, targetKeyId={}",
            LogSanitizer.forLog(table), LogSanitizer.forLog(targetKeyId));
        Map<Status, Long> agg = rotationService.aggregateProgress(table, targetKeyId);
        int total = agg.values().stream().mapToInt(Long::intValue).sum();
        PiiRotationProgressResponse body = PiiRotationProgressResponse.builder()
            .table(table)
            .totalChunks(total)
            .done(intCount(agg, Status.DONE))
            .inProgress(intCount(agg, Status.IN_PROGRESS))
            .pending(intCount(agg, Status.PENDING))
            .failed(intCount(agg, Status.FAILED))
            .skipped(intCount(agg, Status.SKIPPED))
            .activeKeyId(rotationService.getActiveKeyId())
            .targetKeyId(targetKeyId)
            .build();
        return success(body);
    }

    /**
     * 실패 chunk 재시도.
     */
    @PostMapping("/resume")
    public ResponseEntity<ApiResponse<PiiRotationResult>> resume(
            @RequestParam String table,
            @RequestParam("target_key_id") String targetKeyId) {
        log.info("PII 회전 재시도 요청 — table={}, targetKeyId={}",
            LogSanitizer.forLog(table), LogSanitizer.forLog(targetKeyId));
        List<String> columns = resolveColumns(table);
        PiiRotationResult result = rotationService.resumeFailedChunks(table, columns, targetKeyId);
        return success("FAILED chunk 재시도를 완료했습니다.", result);
    }

    /**
     * 진행 중 chunk (PENDING / IN_PROGRESS) 를 SKIPPED 로 마킹하여 취소한다.
     */
    @PostMapping("/cancel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancel(
            @RequestParam String table,
            @RequestParam("target_key_id") String targetKeyId) {
        log.info("PII 회전 취소 요청 — table={}, targetKeyId={}",
            LogSanitizer.forLog(table), LogSanitizer.forLog(targetKeyId));
        int cancelled = rotationService.cancelPendingChunks(table, targetKeyId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("table", table);
        body.put("target_key_id", targetKeyId);
        body.put("cancelled_chunks", cancelled);
        return success("진행 중 chunk 가 취소되었습니다.", body);
    }

    // ------------------------------------------------------------------
    // Internal — 테이블별 dispatch
    // ------------------------------------------------------------------

    private PiiRotationResult dispatchStart(String table, int chunkSize, String targetKeyId) {
        if (Objects.equals(table, "users")) {
            return rotationService.rotateUserPersonalData(chunkSize, targetKeyId);
        }
        if (Objects.equals(table, "clients")) {
            return rotationService.rotateClientPersonalData(chunkSize, targetKeyId);
        }
        if (Objects.equals(table, "accounts")) {
            return rotationService.rotateAccountPersonalData(chunkSize, targetKeyId);
        }
        if (Objects.equals(table, "branches")) {
            return rotationService.rotateBranchPersonalData(chunkSize, targetKeyId);
        }
        if (Objects.equals(table, PersonalDataKeyRotationService.DORMANT_VAULT_TABLE)) {
            return rotationService.rotateDormantPiiVault(chunkSize, targetKeyId);
        }
        throw new IllegalArgumentException(
            "unsupported table: " + LogSanitizer.forLog(table)
                + ". supported: " + PersonalDataKeyRotationService.SUPPORTED_TABLES.keySet());
    }

    private List<String> resolveColumns(String table) {
        List<String> columns = PersonalDataKeyRotationService.SUPPORTED_TABLES.get(table);
        if (columns == null) {
            throw new IllegalArgumentException(
                "unsupported table: " + LogSanitizer.forLog(table)
                    + ". supported: " + PersonalDataKeyRotationService.SUPPORTED_TABLES.keySet());
        }
        return columns;
    }

    private int intCount(Map<Status, Long> aggregate, Status status) {
        Long value = aggregate.get(status);
        return value == null ? 0 : value.intValue();
    }
}

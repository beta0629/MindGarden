package com.coresolution.consultation.assessment.controller;

import com.coresolution.consultation.assessment.dto.PsychAssessmentUploadResponse;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import com.coresolution.consultation.assessment.service.PsychAssessmentIngestService;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.context.TenantContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/v1/assessments/psych")
@RequiredArgsConstructor
@Tag(name = "PsychAssessment", description = "TCI/MMPI 심리검사 리포트 AI 분석")
public class PsychAssessmentController extends BaseApiController {

    private final PsychAssessmentIngestService ingestService;
    private final com.coresolution.consultation.assessment.service.PsychAssessmentReportService reportService;
    private final com.coresolution.consultation.assessment.service.PsychAssessmentStatsService statsService;

    @PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "심리검사 리포트 업로드(스캔 PDF)", description = "TCI/MMPI 스캔 PDF를 업로드하고 OCR/추출 파이프라인을 시작합니다.")
    public ResponseEntity<ApiResponse<PsychAssessmentUploadResponse>> upload(
            @RequestParam("type") @NotNull PsychAssessmentType type,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "clientId", required = false) Long clientId) {

        String tenantId = TenantContextHolder.getRequiredTenantId();
        // createdBy는 기존 세션 유저에서 가져오는 것이 표준이나, 본 MVP에서는 null 허용
        PsychAssessmentUploadResponse response = ingestService.uploadScannedPdf(type, file, clientId, null);
        log.info("Psych assessment uploaded: tenantId={}, type={}, documentId={}", tenantId, type,
                response.getDocumentId());
        return success(response);
    }

    @PostMapping("/documents/{documentId}/report")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "최신 리포트 생성", description = "추출된 지표를 기반으로 최신 리포트를 생성합니다(MVP).")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> generateReport(
            @PathVariable Long documentId) {
        Long reportId = reportService.generateLatestReport(documentId);
        return success(java.util.Map.of("reportId", reportId));
    }

    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "심리검사 분석 통계(MVP)", description = "테넌트 단위 업로드/추출/리포트 생성 통계를 제공합니다.")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> stats() {
        return success(statsService.getTenantStats());
    }
}



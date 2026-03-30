package com.coresolution.consultation.controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.coresolution.consultation.entity.AudioTranscription;
import com.coresolution.consultation.entity.ClinicalReport;
import com.coresolution.consultation.entity.ConsultationAudioFile;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.ConsultationRecordAlert;
import com.coresolution.consultation.repository.AudioTranscriptionRepository;
import com.coresolution.consultation.repository.ClinicalReportRepository;
import com.coresolution.consultation.repository.ConsultationAudioFileRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.service.ClinicalDocumentService;
import com.coresolution.consultation.service.RiskDetectionService;
import com.coresolution.consultation.service.SpeechToTextService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 임상 문서 자동화 API 컨트롤러 음성 파일 업로드, STT, SOAP/DAP 노트 자동 생성
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/clinical-automation")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ClinicalAutomationController {

    private final ConsultationAudioFileRepository audioFileRepository;
    private final AudioTranscriptionRepository transcriptionRepository;
    private final ClinicalReportRepository clinicalReportRepository;
    private final ConsultationRecordRepository consultationRecordRepository;
    private final SpeechToTextService speechToTextService;
    private final ClinicalDocumentService clinicalDocumentService;
    private final RiskDetectionService riskDetectionService;

    // 파일 저장 경로 설정
    private static final String AUDIO_STORAGE_PATH = "./uploads/consultation-audio";
    private static final long MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    private static final List<String> ALLOWED_MIME_TYPES =
            Arrays.asList("audio/wav", "audio/mpeg", "audio/mp3", "audio/m4a", "audio/x-m4a");

    /**
     * 1. 음성 파일 업로드 및 전사 시작 POST /api/v1/clinical-automation/consultations/{id}/upload-audio
     */
    @PostMapping("/consultations/{id}/upload-audio")
    public ResponseEntity<Map<String, Object>> uploadAudioFile(@PathVariable Long id,
            @RequestParam("file") MultipartFile audioFile,
            @RequestParam(value = "consultationRecordId",
                    required = false) Long consultationRecordId) {

        log.info("🎤 음성 파일 업로드 요청: consultationId={}, fileName={}, size={}MB", id,
                audioFile.getOriginalFilename(), audioFile.getSize() / (1024.0 * 1024.0));

        try {
            // 파일 크기 검증
            if (audioFile.getSize() > MAX_FILE_SIZE) {
                return createErrorResponse("파일 크기가 너무 큽니다. 최대 100MB까지 업로드 가능합니다.",
                        HttpStatus.BAD_REQUEST);
            }

            // MIME 타입 검증
            String mimeType = audioFile.getContentType();
            if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType)) {
                return createErrorResponse("지원하지 않는 파일 형식입니다. (wav, mp3, m4a만 가능)",
                        HttpStatus.BAD_REQUEST);
            }

            // 저장 디렉토리 생성
            String tenantId = TenantContextHolder.getTenantId();
            Path uploadDir = Paths.get(AUDIO_STORAGE_PATH, tenantId);
            Files.createDirectories(uploadDir);

            // 파일명 생성 (중복 방지)
            String originalFilename = audioFile.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String filename = "consultation_" + id + "_" + System.currentTimeMillis() + extension;
            Path filePath = uploadDir.resolve(filename);

            // 파일 저장
            Files.copy(audioFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // 데이터베이스에 메타데이터 저장
            ConsultationAudioFile audioFileEntity = ConsultationAudioFile.builder()
                    .consultationId(id).consultationRecordId(consultationRecordId)
                    .fileName(originalFilename).filePath(filePath.toString())
                    .fileSizeBytes(audioFile.getSize()).mimeType(mimeType).uploadStatus("UPLOADED")
                    .transcriptionStatus("PENDING").tenantId(tenantId).build();

            audioFileEntity = audioFileRepository.save(audioFileEntity);

            // 비동기 전사 시작
            speechToTextService.transcribeAudioAsync(audioFileEntity.getId());

            log.info("✅ 음성 파일 업로드 완료: audioFileId={}", audioFileEntity.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "음성 파일이 업로드되었습니다. 전사가 시작됩니다.");
            response.put("audioFileId", audioFileEntity.getId());
            response.put("fileName", originalFilename);
            response.put("fileSize", audioFile.getSize());
            response.put("transcriptionStatus", "PENDING");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 음성 파일 업로드 실패: consultationId={}, error={}", id, e.getMessage(), e);
            return createErrorResponse("음성 파일 업로드 실패: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 2. 전사 상태 확인 GET /api/v1/clinical-automation/audio-files/{id}/transcription-status
     */
    @GetMapping("/audio-files/{id}/transcription-status")
    public ResponseEntity<Map<String, Object>> getTranscriptionStatus(@PathVariable Long id) {
        log.info("📊 전사 상태 조회: audioFileId={}", id);

        try {
            ConsultationAudioFile audioFile = audioFileRepository.findByIdAndIsDeletedFalse(id)
                    .orElseThrow(() -> new IllegalArgumentException("음성 파일을 찾을 수 없습니다."));

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("audioFileId", audioFile.getId());
            response.put("fileName", audioFile.getFileName());
            response.put("transcriptionStatus", audioFile.getTranscriptionStatus());
            response.put("uploadStatus", audioFile.getUploadStatus());

            // 전사 완료 시 전사 결과 포함
            if ("COMPLETED".equals(audioFile.getTranscriptionStatus())) {
                transcriptionRepository.findByAudioFileId(audioFile.getId())
                        .ifPresent(transcription -> {
                            response.put("transcription", Map.of("id", transcription.getId(),
                                    "text", transcription.getTranscriptionText(), "confidenceScore",
                                    transcription.getConfidenceScorePercentage(), "wordCount",
                                    transcription.getWordCount(), "processingTime",
                                    transcription.getProcessingTimeInSeconds() + "초"));
                        });
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 전사 상태 조회 실패: audioFileId={}, error={}", id, e.getMessage(), e);
            return createErrorResponse("전사 상태 조회 실패: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 3. SOAP 노트 자동 생성 POST /api/v1/clinical-automation/consultation-records/{id}/generate-soap
     */
    @PostMapping("/consultation-records/{id}/generate-soap")
    public ResponseEntity<Map<String, Object>> generateSOAPNote(@PathVariable Long id) {
        log.info("📝 SOAP 노트 생성 요청: consultationRecordId={}", id);

        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            ConsultationRecord record = consultationRecordRepository.findByTenantIdAndId(tenantId, id)
                    .orElseThrow(() -> new IllegalArgumentException("상담 기록을 찾을 수 없습니다."));

            // 음성 전사 결과 조회
            ConsultationAudioFile audioFile = audioFileRepository
                    .findByConsultationRecordIdAndIsDeletedFalse(id).stream().findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("음성 파일을 찾을 수 없습니다."));

            AudioTranscription transcription =
                    transcriptionRepository.findByAudioFileId(audioFile.getId())
                            .orElseThrow(() -> new IllegalArgumentException("전사 결과를 찾을 수 없습니다."));

            // SOAP 노트 생성
            ClinicalReport report = clinicalDocumentService.generateSOAPNote(transcription, record);

            log.info("✅ SOAP 노트 생성 완료: reportId={}", report.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "SOAP 노트가 생성되었습니다.");
            response.put("report", convertReportToMap(report));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ SOAP 노트 생성 실패: recordId={}, error={}", id, e.getMessage(), e);
            return createErrorResponse("SOAP 노트 생성 실패: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 4. DAP 노트 자동 생성 POST /api/v1/clinical-automation/consultation-records/{id}/generate-dap
     */
    @PostMapping("/consultation-records/{id}/generate-dap")
    public ResponseEntity<Map<String, Object>> generateDAPNote(@PathVariable Long id) {
        log.info("📝 DAP 노트 생성 요청: consultationRecordId={}", id);

        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            ConsultationRecord record = consultationRecordRepository.findByTenantIdAndId(tenantId, id)
                    .orElseThrow(() -> new IllegalArgumentException("상담 기록을 찾을 수 없습니다."));

            ConsultationAudioFile audioFile = audioFileRepository
                    .findByConsultationRecordIdAndIsDeletedFalse(id).stream().findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("음성 파일을 찾을 수 없습니다."));

            AudioTranscription transcription =
                    transcriptionRepository.findByAudioFileId(audioFile.getId())
                            .orElseThrow(() -> new IllegalArgumentException("전사 결과를 찾을 수 없습니다."));

            ClinicalReport report = clinicalDocumentService.generateDAPNote(transcription, record);

            log.info("✅ DAP 노트 생성 완료: reportId={}", report.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "DAP 노트가 생성되었습니다.");
            response.put("report", convertReportToMap(report));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ DAP 노트 생성 실패: recordId={}, error={}", id, e.getMessage(), e);
            return createErrorResponse("DAP 노트 생성 실패: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 5. 진단 보고서 초안 생성 POST
     * /api/v1/clinical-automation/consultation-records/{id}/generate-diagnostic-report
     */
    @PostMapping("/consultation-records/{id}/generate-diagnostic-report")
    public ResponseEntity<Map<String, Object>> generateDiagnosticReport(@PathVariable Long id) {
        log.info("📋 진단 보고서 생성 요청: consultationRecordId={}", id);

        try {
            ClinicalReport report = clinicalDocumentService.generateDiagnosticReport(id);

            log.info("✅ 진단 보고서 생성 완료: reportId={}", report.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "진단 보고서가 생성되었습니다.");
            response.put("report", convertReportToMap(report));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 진단 보고서 생성 실패: recordId={}, error={}", id, e.getMessage(), e);
            return createErrorResponse("진단 보고서 생성 실패: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 6. 위험 징후 수동 분석 POST /api/v1/clinical-automation/consultation-records/{id}/analyze-risks
     */
    @PostMapping("/consultation-records/{id}/analyze-risks")
    public ResponseEntity<Map<String, Object>> analyzeRisks(@PathVariable Long id) {
        log.info("🔍 위험 징후 분석 요청: consultationRecordId={}", id);

        try {
            // 음성 전사 결과 조회
            ConsultationAudioFile audioFile = audioFileRepository
                    .findByConsultationRecordIdAndIsDeletedFalse(id).stream().findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("음성 파일을 찾을 수 없습니다."));

            AudioTranscription transcription =
                    transcriptionRepository.findByAudioFileId(audioFile.getId())
                            .orElseThrow(() -> new IllegalArgumentException("전사 결과를 찾을 수 없습니다."));

            // 위험 분석 실행
            ConsultationRecordAlert alert =
                    riskDetectionService.analyzeTranscriptionForRisks(transcription);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);

            if (alert != null) {
                response.put("riskDetected", true);
                response.put("alert",
                        Map.of("id", alert.getId(), "severity", alert.getAlertType().name(),
                                "message", alert.getMessage() != null ? alert.getMessage() : "",
                                "status", alert.getStatus()));
                log.warn("⚠️ 위험 징후 발견: alertId={}, severity={}", alert.getId(),
                        alert.getAlertType());
            } else {
                response.put("riskDetected", false);
                response.put("message", "위험 징후가 발견되지 않았습니다.");
                log.info("✅ 위험 징후 없음");
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 위험 분석 실패: recordId={}, error={}", id, e.getMessage(), e);
            return createErrorResponse("위험 분석 실패: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 7. 생성된 보고서 조회 GET /api/v1/clinical-automation/clinical-reports/{id}
     */
    @GetMapping("/clinical-reports/{id}")
    public ResponseEntity<Map<String, Object>> getClinicalReport(@PathVariable Long id) {
        log.info("📄 임상 보고서 조회: reportId={}", id);

        try {
            ClinicalReport report = clinicalDocumentService.getClinicalReport(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("report", convertReportToMap(report));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 임상 보고서 조회 실패: reportId={}, error={}", id, e.getMessage(), e);
            return createErrorResponse("임상 보고서 조회 실패: " + e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    /**
     * 8. 보고서 수정 PUT /api/v1/clinical-automation/clinical-reports/{id}
     */
    @PutMapping("/clinical-reports/{id}")
    public ResponseEntity<Map<String, Object>> updateClinicalReport(@PathVariable Long id,
            @RequestBody ClinicalReport updatedReport) {

        log.info("✏️ 임상 보고서 수정 요청: reportId={}", id);

        try {
            ClinicalReport report = clinicalDocumentService.updateClinicalReport(id, updatedReport);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "임상 보고서가 수정되었습니다.");
            response.put("report", convertReportToMap(report));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 임상 보고서 수정 실패: reportId={}, error={}", id, e.getMessage(), e);
            return createErrorResponse("임상 보고서 수정 실패: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 9. 보고서 검토 승인 POST /api/v1/clinical-automation/clinical-reports/{id}/approve
     */
    @PostMapping("/clinical-reports/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveClinicalReport(@PathVariable Long id,
            @RequestParam Long reviewerUserId) {

        log.info("✅ 임상 보고서 승인 요청: reportId={}, reviewerId={}", id, reviewerUserId);

        try {
            ClinicalReport report =
                    clinicalDocumentService.approveClinicalReport(id, reviewerUserId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "임상 보고서가 승인되었습니다.");
            response.put("report", convertReportToMap(report));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 임상 보고서 승인 실패: reportId={}, error={}", id, e.getMessage(), e);
            return createErrorResponse("임상 보고서 승인 실패: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 10. 상담 기록의 모든 임상 보고서 조회 GET /api/v1/clinical-automation/consultation-records/{id}/reports
     */
    @GetMapping("/consultation-records/{id}/reports")
    public ResponseEntity<Map<String, Object>> getReportsByConsultationRecord(
            @PathVariable Long id) {
        log.info("📚 상담 기록의 보고서 목록 조회: consultationRecordId={}", id);

        try {
            List<ClinicalReport> reports =
                    clinicalReportRepository.findByConsultationRecordIdAndIsDeletedFalse(id);

            List<Map<String, Object>> reportMaps =
                    reports.stream().map(this::convertReportToMap).toList();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("reports", reportMaps);
            response.put("totalCount", reports.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 보고서 목록 조회 실패: recordId={}, error={}", id, e.getMessage(), e);
            return createErrorResponse("보고서 목록 조회 실패: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ==================== Helper Methods ====================

    /**
     * ClinicalReport 엔티티를 Map으로 변환
     */
    private Map<String, Object> convertReportToMap(ClinicalReport report) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", report.getId());
        map.put("consultationRecordId", report.getConsultationRecordId());
        map.put("reportType", report.getReportType());
        map.put("reportFormat", report.getReportFormat());

        // SOAP 섹션
        if (report.isSOAPFormat()) {
            map.put("subjective", report.getSubjectiveText());
            map.put("objective", report.getObjectiveText());
            map.put("assessment", report.getAssessmentText());
            map.put("plan", report.getPlanText());
            map.put("completionPercentage", report.getCompletionPercentage());
        }

        // DAP 섹션
        if (report.isDAPFormat()) {
            map.put("data", report.getDataText());
            map.put("assessment", report.getAssessmentText());
            map.put("plan", report.getPlanText());
            map.put("completionPercentage", report.getCompletionPercentage());
        }

        // 진단 섹션
        if (report.isDiagnosticReport()) {
            map.put("diagnosisSummary", report.getDiagnosisSummary());
            map.put("diagnosticImpressions", report.getDiagnosticImpressions());
            map.put("treatmentRecommendations", report.getTreatmentRecommendations());
        }

        // 메타 정보
        map.put("autoGenerated", report.getAutoGenerated());
        map.put("humanReviewed", report.getHumanReviewed());
        map.put("aiModelUsed", report.getAiModelUsed());
        map.put("generationTimeMs", report.getGenerationTimeMs());
        map.put("confidenceScore", report.getConfidenceScorePercentage());
        map.put("createdAt", report.getCreatedAt());
        map.put("updatedAt", report.getUpdatedAt());

        if (report.getHumanReviewed()) {
            map.put("reviewedBy", report.getReviewedByUserId());
            map.put("reviewedAt", report.getReviewedAt());
        }

        return map;
    }

    /**
     * 에러 응답 생성
     */
    private ResponseEntity<Map<String, Object>> createErrorResponse(String message,
            HttpStatus status) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return ResponseEntity.status(status).body(response);
    }
}

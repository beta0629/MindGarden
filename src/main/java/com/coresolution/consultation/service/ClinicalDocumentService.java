package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.AudioTranscription;
import com.coresolution.consultation.entity.ClinicalReport;
import com.coresolution.consultation.entity.ConsultationRecord;

/**
 * 임상 문서 자동 생성 서비스 인터페이스
 * SOAP/DAP 형식 임상 노트 및 진단 보고서 생성
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
public interface ClinicalDocumentService {

    /**
     * SOAP 형식 임상 노트 생성
     *
     * @param transcription 음성 전사 결과
     * @param record 상담 기록
     * @return 생성된 SOAP 노트
     */
    ClinicalReport generateSOAPNote(AudioTranscription transcription, ConsultationRecord record);

    /**
     * DAP 형식 임상 노트 생성
     *
     * @param transcription 음성 전사 결과
     * @param record 상담 기록
     * @return 생성된 DAP 노트
     */
    ClinicalReport generateDAPNote(AudioTranscription transcription, ConsultationRecord record);

    /**
     * 진단 보고서 초안 생성
     * 상담 기록 + 심리 검사 결과 통합
     *
     * @param consultationRecordId 상담 기록 ID
     * @return 생성된 진단 보고서
     */
    ClinicalReport generateDiagnosticReport(Long consultationRecordId);

    /**
     * 임상 보고서 조회
     *
     * @param reportId 보고서 ID
     * @return 임상 보고서
     */
    ClinicalReport getClinicalReport(Long reportId);

    /**
     * 임상 보고서 수정
     *
     * @param reportId 보고서 ID
     * @param report 수정할 보고서 내용
     * @return 수정된 보고서
     */
    ClinicalReport updateClinicalReport(Long reportId, ClinicalReport report);

    /**
     * 임상 보고서 검토 승인
     *
     * @param reportId 보고서 ID
     * @param reviewerUserId 검토자 ID
     * @return 승인된 보고서
     */
    ClinicalReport approveClinicalReport(Long reportId, Long reviewerUserId);
}

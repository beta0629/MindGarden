/**
 * 임상 문서 자동화 CSS 클래스명 상수
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */

export const CLINICAL_CSS = {
    // AudioRecorder
    AUDIO_RECORDER: 'audio-recorder',
    AUDIO_RECORDER_HEADER: 'audio-recorder-header',
    RECORDING_TIME: 'recording-time',
    RECORDING_INDICATOR: 'recording-indicator',
    WAVEFORM_CONTAINER: 'waveform-container',
    WAVEFORM_CANVAS: 'waveform-canvas',
    AUDIO_RECORDER_CONTROLS: 'audio-recorder-controls',

    // SmartNoteTab
    SMART_NOTE_TAB: 'smart-note-tab',
    SECTION_AUDIO_RECORDING: 'section-audio-recording',
    SECTION_TRANSCRIPTION: 'section-transcription',
    SECTION_CLINICAL_NOTES: 'section-clinical-notes',
    TRANSCRIPTION_RESULT: 'transcription-result',
    TRANSCRIPTION_INFO: 'transcription-info',
    FORMAT_SELECTOR: 'format-selector',

    // SOAPNoteEditor
    SOAP_NOTE_EDITOR: 'soap-note-editor',
    SOAP_SECTION: 'soap-section',
    SECTION_TITLE: 'section-title',
    SECTION_LETTER: 'section-letter',
    SOAP_TEXTAREA: 'soap-textarea',

    // DiagnosticReportEditor
    DIAGNOSTIC_REPORT_EDITOR: 'diagnostic-report-editor',
    REPORT_CONTENT: 'report-content',
    REPORT_SECTION: 'report-section',
    REPORT_META: 'report-meta',
    REPORT_TEXTAREA: 'report-textarea',

    // RiskAlertBadge
    RISK_ALERT_BADGE_CONTAINER: 'risk-alert-badge-container',
    RISK_ALERT_BUTTON: 'risk-alert-button',
    ALERT_COUNT_BADGE: 'alert-count-badge',
    ALERT_DROPDOWN: 'alert-dropdown',
    ALERT_ITEM: 'alert-item',
    SEVERITY_BADGE: 'severity-badge',

    // 공통 상태
    STATUS: {
        PENDING: 'status-pending',
        PROCESSING: 'status-processing',
        COMPLETED: 'status-completed',
        FAILED: 'status-failed',
    },

    // 심각도
    SEVERITY: {
        CRITICAL: 'severity-critical',
        HIGH: 'severity-high',
        MEDIUM: 'severity-medium',
        LOW: 'severity-low',
    },

    // 버튼
    BTN: {
        PRIMARY: 'btn btn-primary',
        SECONDARY: 'btn btn-secondary',
        SUCCESS: 'btn btn-success',
        DANGER: 'btn btn-danger',
        WARNING: 'btn btn-warning',
    },
};

export default CLINICAL_CSS;

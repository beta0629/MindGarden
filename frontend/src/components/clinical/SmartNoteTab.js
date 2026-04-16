import React, { useState, useEffect } from 'react';
import AudioRecorder from './AudioRecorder';
import SOAPNoteEditor from './SOAPNoteEditor';
import { apiGet, apiPost } from '../../utils/ajax';
import { CLINICAL_API } from '../../constants/clinicalApi';
import { CLINICAL_CSS } from '../../constants/clinicalCss';
import notificationManager from '../../utils/notification';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import './SmartNoteTab.css';

/**
 * 스마트 노트 생성 탭 컴포넌트
 * 음성 녹음 → 전사 → SOAP/DAP 노트 자동 생성
 *
 * @param {Object} props
 * @param {number} props.consultationRecordId - 상담 기록 ID
 * @param {number} props.consultationId - 상담 ID
 */
const SmartNoteTab = ({ consultationRecordId, consultationId }) => {
    const [audioFileId, setAudioFileId] = useState(null);
    const [transcription, setTranscription] = useState(null);
    const [transcriptionStatus, setTranscriptionStatus] = useState('');
    const [soapNote, setSoapNote] = useState(null);
    const [dapNote, setDapNote] = useState(null);
    const [selectedFormat, setSelectedFormat] = useState('SOAP');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);

    // 전사 상태 폴링
    useEffect(() => {
        if (!audioFileId) return;

        const pollInterval = setInterval(async() => {
            try {
                const data = await apiGet(CLINICAL_API.TRANSCRIPTION_STATUS(audioFileId));

                if (!data) {
                    clearInterval(pollInterval);
                    return;
                }

                setTranscriptionStatus(data.transcriptionStatus);

                if (data.transcriptionStatus === 'COMPLETED' && data.transcription) {
                    setTranscription(data.transcription);
                    clearInterval(pollInterval);
                } else if (data.transcriptionStatus === 'FAILED') {
                    setError('음성 전사에 실패했습니다.');
                    clearInterval(pollInterval);
                }
            } catch (error) {
                console.error('전사 상태 확인 실패:', error);
            }
        }, 3000); // 3초마다 확인

        return () => clearInterval(pollInterval);
    }, [audioFileId]);

    /**
     * 녹음 완료 핸들러
     */
    const handleRecordingComplete = (data) => {
        console.log('녹음 완료:', data);
        setAudioFileId(data.audioFileId);
        setTranscriptionStatus('PENDING');
        setError(null);
    };

    /**
     * SOAP 노트 생성
     */
    const generateSOAPNote = async() => {
        setIsGenerating(true);
        setError(null);

        try {
            const data = await apiPost(CLINICAL_API.GENERATE_SOAP(consultationRecordId));

            if (!data || !data.success) {
                throw new Error(data?.message || 'SOAP 노트 생성 실패');
            }

            setSoapNote(data.report);
            setSelectedFormat('SOAP');

            console.log('✅ SOAP 노트 생성 완료');

        } catch (error) {
            console.error('❌ SOAP 노트 생성 실패:', error);
            setError('SOAP 노트 생성에 실패했습니다.');
        } finally {
            setIsGenerating(false);
        }
    };

    /**
     * DAP 노트 생성
     */
    const generateDAPNote = async() => {
        setIsGenerating(true);
        setError(null);

        try {
            const data = await apiPost(CLINICAL_API.GENERATE_DAP(consultationRecordId));

            if (!data || !data.success) {
                throw new Error(data?.message || 'DAP 노트 생성 실패');
            }

            setDapNote(data.report);
            setSelectedFormat('DAP');

            console.log('✅ DAP 노트 생성 완료');

        } catch (error) {
            console.error('❌ DAP 노트 생성 실패:', error);
            setError('DAP 노트 생성에 실패했습니다.');
        } finally {
            setIsGenerating(false);
        }
    };

    /**
     * 위험 징후 분석
     */
    const analyzeRisks = async() => {
        try {
            const data = await apiPost(CLINICAL_API.ANALYZE_RISKS(consultationRecordId));

            if (data.riskDetected && data.alert) {
                notificationManager.show(
                    `위험 징후가 감지되었습니다. 위험도: ${data.alert.severity || '-'}\n내용: ${data.alert.message || '-'}`,
                    'warning',
                    4000
                );
            } else {
                notificationManager.success('위험 징후가 발견되지 않았습니다.');
            }

        } catch (error) {
            console.error('위험 분석 실패:', error);
            setError('위험 징후 분석에 실패했습니다.');
            notificationManager.error('위험 징후 분석에 실패했습니다.');
        }
    };

    return (
        <div className={CLINICAL_CSS.SMART_NOTE_TAB}>
            {/* 음성 녹음 섹션 */}
            <section className="section-audio-recording">
                <AudioRecorder
                    consultationId={consultationId}
                    consultationRecordId={consultationRecordId}
                    onRecordingComplete={handleRecordingComplete}
                />
            </section>

            {/* 전사 결과 섹션 */}
            {audioFileId && (
                <section className="section-transcription">
                    <div className="section-header">
                        <h3>📝 전사 결과</h3>
                        <span className={`status-badge status-${transcriptionStatus.toLowerCase()}`}>
                            {getStatusLabel(transcriptionStatus)}
                        </span>
                    </div>

                    {transcriptionStatus === 'PROCESSING' && (
                        <div className="loading-transcription">
                            <div className="spinner" />
                            <p>음성을 텍스트로 변환하는 중입니다...</p>
                        </div>
                    )}

                    {transcription && (
                        <div className="transcription-result">
                            <div className="transcription-info">
                                <span>📊 신뢰도: {transcription.confidenceScore}</span>
                                <span>📏 단어 수: {transcription.wordCount}개</span>
                                <span>⏱️ 처리 시간: {transcription.processingTime}</span>
                            </div>
                            <textarea
                                className="transcription-text"
                                value={transcription.text}
                                readOnly
                                rows="10"
                            />

                            {/* 위험 징후 분석 버튼 */}
                            <MGButton
                                className={buildErpMgButtonClassName({
                                    variant: 'warning',
                                    size: 'md',
                                    loading: false,
                                    className: 'btn btn-warning btn-analyze-risk'
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                onClick={analyzeRisks}
                                variant="warning"
                            >
                                🔍 위험 징후 분석
                            </MGButton>
                        </div>
                    )}
                </section>
            )}

            {/* 임상 노트 생성 섹션 */}
            {transcription && (
                <section className="section-clinical-notes">
                    <div className="section-header">
                        <h3>🏥 임상 노트 자동 생성</h3>
                    </div>

                    {/* 형식 선택 */}
                    <div className="format-selector">
                        <label>
                            <input
                                type="radio"
                                name="format"
                                value="SOAP"
                                checked={selectedFormat === 'SOAP'}
                                onChange={(e) => setSelectedFormat(e.target.value)}
                            />
                            <span>SOAP (Subjective, Objective, Assessment, Plan)</span>
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="format"
                                value="DAP"
                                checked={selectedFormat === 'DAP'}
                                onChange={(e) => setSelectedFormat(e.target.value)}
                            />
                            <span>DAP (Data, Assessment, Plan)</span>
                        </label>
                    </div>

                    {/* 생성 버튼 */}
                    <div className="generation-controls">
                        {selectedFormat === 'SOAP' && (
                            <MGButton
                                className={buildErpMgButtonClassName({
                                    variant: 'primary',
                                    size: 'md',
                                    loading: isGenerating,
                                    className: 'btn btn-primary btn-generate'
                                })}
                                onClick={generateSOAPNote}
                                disabled={isGenerating}
                                loading={isGenerating}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                variant="primary"
                            >
                                🤖 SOAP 노트 자동 생성
                            </MGButton>
                        )}

                        {selectedFormat === 'DAP' && (
                            <MGButton
                                className={buildErpMgButtonClassName({
                                    variant: 'primary',
                                    size: 'md',
                                    loading: isGenerating,
                                    className: 'btn btn-primary btn-generate'
                                })}
                                onClick={generateDAPNote}
                                disabled={isGenerating}
                                loading={isGenerating}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                variant="primary"
                            >
                                🤖 DAP 노트 자동 생성
                            </MGButton>
                        )}
                    </div>

                    {/* 에러 메시지 */}
                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* SOAP 노트 에디터 */}
                    {soapNote && selectedFormat === 'SOAP' && (
                        <SOAPNoteEditor
                            report={soapNote}
                            onSave={(updatedReport) => setSoapNote(updatedReport)}
                        />
                    )}

                    {/* DAP 노트 에디터 */}
                    {dapNote && selectedFormat === 'DAP' && (
                        <div className="dap-note-editor">
                            <h4>DAP 노트</h4>
                            <div className="note-section">
                                <label><strong>D - Data (데이터)</strong></label>
                                <textarea
                                    value={dapNote.data || ''}
                                    onChange={(e) => setDapNote({ ...dapNote, data: e.target.value })}
                                    rows="5"
                                />
                            </div>
                            <div className="note-section">
                                <label><strong>A - Assessment (평가)</strong></label>
                                <textarea
                                    value={dapNote.assessment || ''}
                                    onChange={(e) => setDapNote({ ...dapNote, assessment: e.target.value })}
                                    rows="5"
                                />
                            </div>
                            <div className="note-section">
                                <label><strong>P - Plan (계획)</strong></label>
                                <textarea
                                    value={dapNote.plan || ''}
                                    onChange={(e) => setDapNote({ ...dapNote, plan: e.target.value })}
                                    rows="5"
                                />
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* 안내 메시지 */}
            {!audioFileId && (
                <div className="guide-message">
                    <h4>💡 사용 방법</h4>
                    <ol>
                        <li>상담 중 음성을 녹음합니다</li>
                        <li>녹음이 완료되면 자동으로 텍스트로 변환됩니다</li>
                        <li>전사가 완료되면 SOAP 또는 DAP 노트를 자동 생성할 수 있습니다</li>
                        <li>생성된 노트를 검토하고 필요시 수정합니다</li>
                        <li>최종 승인하여 상담 기록에 저장합니다</li>
                    </ol>
                </div>
            )}
        </div>
    );
};

/**
 * 상태 레이블 변환
 */
function getStatusLabel(status) {
    const labels = {
        'PENDING': '대기 중',
        'PROCESSING': '처리 중',
        'COMPLETED': '완료',
        'FAILED': '실패'
    };
    return labels[status] || status;
}

export default SmartNoteTab;

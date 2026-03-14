import React, { useState } from 'react';
import { apiPut, apiPost } from '../../utils/ajax';
import { CLINICAL_API } from '../../constants/clinicalApi';
import { CLINICAL_CSS } from '../../constants/clinicalCss';
import notificationManager from '../../utils/notification';
import './SOAPNoteEditor.css';

/**
 * SOAP 노트 에디터 컴포넌트
 * AI 생성된 SOAP 노트를 검토하고 수정
 *
 * @param {Object} props
 * @param {Object} props.report - SOAP 보고서 객체
 * @param {Function} props.onSave - 저장 콜백
 */
const SOAPNoteEditor = ({ report, onSave }) => {
    const [editedReport, setEditedReport] = useState(report);
    const [isSaving, setIsSaving] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    /**
     * 섹션 내용 변경 핸들러
     */
    const handleSectionChange = (section, value) => {
        setEditedReport(prev => ({
            ...prev,
            [section]: value
        }));
    };

    /**
     * 보고서 저장
     */
    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage('');

        try {
            const data = await apiPut(
                CLINICAL_API.UPDATE_REPORT(report.id),
                editedReport
            );

            if (!data || !data.success) {
                throw new Error(data?.message || '저장 실패');
            }

            if (onSave) {
                onSave(data.report);
            }

            setSaveMessage('✅ 저장되었습니다.');
            setTimeout(() => setSaveMessage(''), 3000);

        } catch (error) {
            console.error('저장 실패:', error);
            setSaveMessage('❌ 저장에 실패했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * 보고서 승인
     */
    const handleApprove = async () => {
        const confirmed = window.confirm(
            '이 SOAP 노트를 최종 승인하시겠습니까?\n승인 후에는 공식 상담 기록으로 저장됩니다.'
        );

        if (!confirmed) return;

        setIsApproving(true);

        try {
            // TODO: 현재 사용자 ID 가져오기 (세션에서)
            const reviewerUserId = 1; // 임시값

            const data = await apiPost(
                `${CLINICAL_API.APPROVE_REPORT(report.id)}?reviewerUserId=${reviewerUserId}`
            );

            if (!data || !data.success) {
                throw new Error(data?.message || '승인 실패');
            }

            notificationManager.success('SOAP 노트가 승인되었습니다.');

            if (onSave) {
                onSave(data.report);
            }

        } catch (error) {
            console.error('승인 실패:', error);
            notificationManager.error('승인에 실패했습니다.');
        } finally {
            setIsApproving(false);
        }
    };

    return (
        <div className={CLINICAL_CSS.SOAP_NOTE_EDITOR}>
            <div className="editor-header">
                <h4>SOAP 노트 편집</h4>
                <div className="editor-info">
                    <span className="ai-badge">🤖 AI 생성</span>
                    {editedReport.aiModelUsed && (
                        <span className="model-badge">{editedReport.aiModelUsed}</span>
                    )}
                    {editedReport.confidenceScore && (
                        <span className="confidence-badge">
                            신뢰도: {editedReport.confidenceScore}
                        </span>
                    )}
                    {editedReport.completionPercentage !== undefined && (
                        <span className="completion-badge">
                            완성도: {editedReport.completionPercentage}%
                        </span>
                    )}
                </div>
            </div>

            {editedReport.humanReviewed && (
                <div className="approved-badge">
                    ✅ 검토 완료 (승인일: {new Date(editedReport.reviewedAt).toLocaleString('ko-KR')})
                </div>
            )}

            {/* S - Subjective */}
            <div className="soap-section">
                <div className="section-title">
                    <span className="section-letter">S</span>
                    <strong>Subjective (주관적 정보)</strong>
                    <span className="section-desc">내담자가 보고한 증상, 감정, 생각</span>
                </div>
                <textarea
                    className="soap-textarea"
                    value={editedReport.subjective || ''}
                    onChange={(e) => handleSectionChange('subjective', e.target.value)}
                    placeholder="내담자가 직접 말한 내용을 기록합니다..."
                    rows="6"
                />
            </div>

            {/* O - Objective */}
            <div className="soap-section">
                <div className="section-title">
                    <span className="section-letter">O</span>
                    <strong>Objective (객관적 정보)</strong>
                    <span className="section-desc">상담사가 관찰한 행동, 외모, 태도</span>
                </div>
                <textarea
                    className="soap-textarea"
                    value={editedReport.objective || ''}
                    onChange={(e) => handleSectionChange('objective', e.target.value)}
                    placeholder="관찰된 내용을 기록합니다..."
                    rows="5"
                />
            </div>

            {/* A - Assessment */}
            <div className="soap-section">
                <div className="section-title">
                    <span className="section-letter">A</span>
                    <strong>Assessment (평가)</strong>
                    <span className="section-desc">임상적 인상 및 진단적 고려사항</span>
                </div>
                <textarea
                    className="soap-textarea"
                    value={editedReport.assessment || ''}
                    onChange={(e) => handleSectionChange('assessment', e.target.value)}
                    placeholder="임상적 평가를 기록합니다..."
                    rows="6"
                />
            </div>

            {/* P - Plan */}
            <div className="soap-section">
                <div className="section-title">
                    <span className="section-letter">P</span>
                    <strong>Plan (계획)</strong>
                    <span className="section-desc">치료 계획 및 다음 세션 목표</span>
                </div>
                <textarea
                    className="soap-textarea"
                    value={editedReport.plan || ''}
                    onChange={(e) => handleSectionChange('plan', e.target.value)}
                    placeholder="치료 계획과 목표를 기록합니다..."
                    rows="5"
                />
            </div>

            {/* 저장 메시지 */}
            {saveMessage && (
                <div className={`save-message ${saveMessage.includes('✅') ? 'success' : 'error'}`}>
                    {saveMessage}
                </div>
            )}

            {/* 액션 버튼 */}
            <div className="editor-actions">
                <button
                    className="btn btn-secondary btn-save"
                    onClick={handleSave}
                    disabled={isSaving || editedReport.humanReviewed}
                >
                    {isSaving ? '💾 저장 중...' : '💾 저장'}
                </button>

                <button
                    className="btn btn-success btn-approve"
                    onClick={handleApprove}
                    disabled={isApproving || editedReport.humanReviewed}
                >
                    {isApproving ? '⏳ 승인 중...' : '✅ 최종 승인'}
                </button>

                {editedReport.humanReviewed && (
                    <span className="approval-notice">
                        이미 승인된 문서입니다
                    </span>
                )}
            </div>
        </div>
    );
};

export default SOAPNoteEditor;

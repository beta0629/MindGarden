import React from 'react';
import './SimilarCasesPanel.css';

/**
 * 유사 케이스 패널 컴포넌트
 *
 * @param {Object} props
 * @param {Array} props.cases - 유사 케이스 목록
 */
const SimilarCasesPanel = ({ cases }) => {
    const getOutcomeColor = (outcome) => {
        const colors = {
            'EXCELLENT': 'var(--mg-success-500)',
            'GOOD': '#84cc16',
            'MODERATE': 'var(--mg-warning-500)',
            'POOR': '#dc2626'
        };
        return colors[outcome] || '#6b7280';
    };

    return (
        <div className="similar-cases-panel">
            <h3>🔍 유사 케이스 ({cases.length}개)</h3>
            <p className="panel-description">
                비슷한 증상과 상황을 가진 내담자들의 치료 결과를 참고하세요
            </p>

            <div className="cases-list">
                {cases.map((caseItem, index) => (
                    <div key={index} className="case-card">
                        <div className="case-header">
                            <span className="case-id">케이스 #{caseItem.matchedClientId}</span>
                            <span className="similarity-badge">
                                유사도: {(caseItem.similarityScore * 100).toFixed(0)}%
                            </span>
                        </div>

                        <div className="case-outcome">
                            <span
                                className="outcome-badge"
                                style={{ backgroundColor: getOutcomeColor(caseItem.outcome) }}
                            >
                                {caseItem.outcome}
                            </span>
                            <span className="improvement-rate">
                                개선률: {caseItem.improvementRate}%
                            </span>
                        </div>

                        <div className="case-details">
                            <div className="detail-item">
                                <span>총 회기 수:</span>
                                <strong>{caseItem.sessionCount}회기</strong>
                            </div>

                            {caseItem.similarFactors && caseItem.similarFactors.length > 0 && (
                                <div className="similar-factors">
                                    <span>유사 요인:</span>
                                    <div className="factors-tags">
                                        {caseItem.similarFactors.map((factor, i) => (
                                            <span key={i} className="factor-tag">{factor}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {caseItem.lessonsLearned && (
                                <div className="lessons-learned">
                                    <strong>학습 포인트:</strong>
                                    <p>{caseItem.lessonsLearned}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {cases.length === 0 && (
                <div className="no-cases">
                    아직 유사 케이스가 없습니다.
                </div>
            )}
        </div>
    );
};

export default SimilarCasesPanel;

/**
 * 테넌트 공통코드 관리 UI (Presentational Component)
 * 
 * 순수 UI 컴포넌트 - 비즈니스 로직 없음
 * Props를 통해 데이터와 이벤트 핸들러를 받아 렌더링만 수행
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */

import React from 'react';
import './TenantCommonCodeManagerUI.css';

const TenantCommonCodeManagerUI = ({
    // 데이터
    codeGroups,
    selectedGroup,
    codes,
    loading,
    error,
    showModal,
    modalMode,
    formData,
    
    // 이벤트 핸들러
    onGroupSelect,
    onCreateCode,
    onEditCode,
    onDeleteCode,
    onToggleActive,
    onQuickCreatePackage,
    onFormChange,
    onFormSubmit,
    onModalClose
}) => {
    /**
     * extra_data 파싱 (금액 표시용)
     */
    const parseExtraData = (extraDataStr) => {
        if (!extraDataStr) return null;
        try {
            return JSON.parse(extraDataStr);
        } catch {
            return null;
        }
    };

    return (
        <div className="mg-tenant-code-manager">
            {/* Header */}
            <div className="mg-manager-header">
                <h2>테넌트 공통코드 관리</h2>
                <p className="mg-manager-description">
                    테넌트 전용 공통코드를 관리합니다. 상담 패키지, 결제 방법, 전문 분야 등을 설정할 수 있습니다.
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mg-error-message">
                    <span className="mg-error-icon">⚠️</span>
                    {error}
                </div>
            )}

            {/* Content */}
            <div className="mg-manager-content">
                {/* 좌측: 코드 그룹 목록 */}
                <div className="mg-code-groups-panel">
                    <h3>코드 그룹</h3>
                    {loading && !selectedGroup ? (
                        <div className="mg-loading">로딩 중...</div>
                    ) : (
                        <ul className="mg-code-groups-list">
                            {codeGroups.map(group => (
                                <li
                                    key={group.groupName}
                                    className={selectedGroup?.groupName === group.groupName ? 'mg-active' : ''}
                                    onClick={() => onGroupSelect(group)}
                                >
                                    <span className="mg-group-icon">{group.icon || '📁'}</span>
                                    <div className="mg-group-info">
                                        <div className="mg-group-name">{group.koreanName}</div>
                                        <div className="mg-group-code">{group.groupName}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* 우측: 선택된 그룹의 코드 목록 */}
                <div className="mg-codes-panel">
                    {selectedGroup ? (
                        <>
                            <div className="mg-codes-header">
                                <div>
                                    <h3>{selectedGroup.koreanName}</h3>
                                    <p className="mg-codes-description">{selectedGroup.description}</p>
                                </div>
                                <div className="mg-codes-actions">
                                    {selectedGroup.groupName === 'CONSULTATION_PACKAGE' && (
                                        <button
                                            className="mg-btn mg-btn-secondary"
                                            onClick={onQuickCreatePackage}
                                        >
                                            빠른 패키지 생성
                                        </button>
                                    )}
                                    <button
                                        className="mg-btn mg-btn-primary"
                                        onClick={onCreateCode}
                                    >
                                        + 코드 추가
                                    </button>
                                </div>
                            </div>

                            {loading ? (
                                <div className="mg-loading">로딩 중...</div>
                            ) : codes.length === 0 ? (
                                <div className="mg-empty-state">
                                    <p>등록된 코드가 없습니다.</p>
                                    <button className="mg-btn mg-btn-primary" onClick={onCreateCode}>
                                        첫 코드 추가하기
                                    </button>
                                </div>
                            ) : (
                                <table className="mg-codes-table">
                                    <thead>
                                        <tr>
                                            <th>코드 값</th>
                                            <th>코드명</th>
                                            <th>설명</th>
                                            {(selectedGroup.groupName === 'CONSULTATION_PACKAGE' || 
                                              selectedGroup.groupName === 'ASSESSMENT_TYPE') && (
                                                <th>금액</th>
                                            )}
                                            <th>상태</th>
                                            <th>순서</th>
                                            <th>작업</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {codes.map(code => {
                                            const extraData = parseExtraData(code.extraData);
                                            return (
                                                <tr key={code.id}>
                                                    <td><code>{code.codeValue}</code></td>
                                                    <td>{code.koreanName || code.codeLabel}</td>
                                                    <td>{code.codeDescription}</td>
                                                    {(selectedGroup.groupName === 'CONSULTATION_PACKAGE' || 
                                                      selectedGroup.groupName === 'ASSESSMENT_TYPE') && (
                                                        <td>
                                                            {extraData?.price ? 
                                                                `${extraData.price.toLocaleString()}원` : 
                                                                '-'
                                                            }
                                                        </td>
                                                    )}
                                                    <td>
                                                        <button
                                                            className={`mg-status-badge ${code.isActive ? 'mg-active' : 'mg-inactive'}`}
                                                            onClick={() => onToggleActive(code.id, code.isActive)}
                                                        >
                                                            {code.isActive ? '활성' : '비활성'}
                                                        </button>
                                                    </td>
                                                    <td>{code.sortOrder}</td>
                                                    <td className="mg-actions-cell">
                                                        <button
                                                            className="mg-btn-icon"
                                                            onClick={() => onEditCode(code)}
                                                            title="수정"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className="mg-btn-icon"
                                                            onClick={() => onDeleteCode(code.id)}
                                                            title="삭제"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </>
                    ) : (
                        <div className="mg-empty-state">
                            <p>좌측에서 코드 그룹을 선택하세요.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 코드 생성/수정 모달 */}
            {showModal && (
                <div className="mg-modal-overlay" onClick={onModalClose}>
                    <div className="mg-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="mg-modal-header">
                            <h3>{modalMode === 'create' ? '코드 추가' : '코드 수정'}</h3>
                            <button className="mg-modal-close" onClick={onModalClose}>×</button>
                        </div>
                        <form onSubmit={onFormSubmit}>
                            <div className="mg-form-group">
                                <label>코드 그룹</label>
                                <input
                                    type="text"
                                    value={formData.codeGroup}
                                    disabled
                                    className="mg-form-control"
                                />
                            </div>
                            <div className="mg-form-group">
                                <label>코드 값 *</label>
                                <input
                                    type="text"
                                    value={formData.codeValue}
                                    onChange={(e) => onFormChange({ ...formData, codeValue: e.target.value })}
                                    disabled={modalMode === 'edit'}
                                    required
                                    className="mg-form-control"
                                    placeholder="예: PACKAGE_001"
                                />
                            </div>
                            <div className="mg-form-group">
                                <label>코드명 *</label>
                                <input
                                    type="text"
                                    value={formData.codeLabel}
                                    onChange={(e) => onFormChange({ ...formData, codeLabel: e.target.value })}
                                    required
                                    className="mg-form-control"
                                    placeholder="예: 기본 10회기 패키지"
                                />
                            </div>
                            <div className="mg-form-group">
                                <label>한글명</label>
                                <input
                                    type="text"
                                    value={formData.koreanName}
                                    onChange={(e) => onFormChange({ ...formData, koreanName: e.target.value })}
                                    className="mg-form-control"
                                    placeholder="코드명과 동일하게 입력 (선택)"
                                />
                            </div>
                            <div className="mg-form-group">
                                <label>설명</label>
                                <textarea
                                    value={formData.codeDescription}
                                    onChange={(e) => onFormChange({ ...formData, codeDescription: e.target.value })}
                                    className="mg-form-control"
                                    rows="3"
                                    placeholder="코드에 대한 설명을 입력하세요"
                                />
                            </div>
                            <div className="mg-form-row">
                                <div className="mg-form-group">
                                    <label>정렬 순서</label>
                                    <input
                                        type="number"
                                        value={formData.sortOrder}
                                        onChange={(e) => onFormChange({ ...formData, sortOrder: parseInt(e.target.value, 10) })}
                                        className="mg-form-control"
                                    />
                                </div>
                                <div className="mg-form-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => onFormChange({ ...formData, isActive: e.target.checked })}
                                        />
                                        {' '}활성 상태
                                    </label>
                                </div>
                            </div>
                            <div className="mg-form-group">
                                <label>추가 데이터 (JSON)</label>
                                <textarea
                                    value={formData.extraData}
                                    onChange={(e) => onFormChange({ ...formData, extraData: e.target.value })}
                                    className="mg-form-control"
                                    rows="3"
                                    placeholder='{"price": 100000, "duration": 50, "sessions": 10}'
                                />
                                <small className="mg-form-text">
                                    상담 패키지/평가 유형의 경우 금액(price), 기간(duration), 회기(sessions) 등을 JSON 형식으로 입력하세요.
                                </small>
                            </div>
                            <div className="mg-modal-actions">
                                <button type="button" className="mg-btn mg-btn-secondary" onClick={onModalClose}>
                                    취소
                                </button>
                                <button type="submit" className="mg-btn mg-btn-primary" disabled={loading}>
                                    {loading ? '처리 중...' : (modalMode === 'create' ? '생성' : '수정')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantCommonCodeManagerUI;


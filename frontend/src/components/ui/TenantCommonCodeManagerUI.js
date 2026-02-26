/**
 * 테넌트 공통코드 관리 UI (Presentational Component)
/**
 * 
/**
 * 순수 UI 컴포넌트 - 비즈니스 로직 없음
/**
 * Props를 통해 데이터와 이벤트 핸들러를 받아 렌더링만 수행
/**
 * 
/**
 * @author Core Solution
/**
 * @version 2.0.0
/**
 * @since 2025-12-03
 */

import React from 'react';
import MGCard from '../common/MGCard';
import Button from '../ui/Button/Button';
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
                                        <Button
                                            variant="secondary"
                                            onClick={onQuickCreatePackage}
                                            preventDoubleClick={true}
                                        >
                                            빠른 패키지 생성
                                        </Button>
                                    )}
                                    <Button
                                        variant="primary"
                                        onClick={onCreateCode}
                                        preventDoubleClick={true}
                                    >
                                        + 코드 추가
                                    </Button>
                                </div>
                            </div>

                            {loading ? (
                                <div className="mg-loading">로딩 중...</div>
                            ) : codes.length === 0 ? (
                                <div className="mg-empty-state">
                                    <p>등록된 코드가 없습니다.</p>
                                    <Button 
                                        variant="primary" 
                                        onClick={onCreateCode}
                                        preventDoubleClick={true}
                                    >
                                        첫 코드 추가하기
                                    </Button>
                                </div>
                            ) : (
                                <div className="mg-codes-cards-grid">
                                    {codes.map(code => {
                                        const extraData = parseExtraData(code.extraData);
                                        return (
                                            <MGCard key={code.id} variant="default" className="mg-code-card">
                                                {/* 카드 헤더 */}
                                                <div className="mg-code-card__header">
                                                    <div className="mg-code-card__title-section">
                                                        <code className="mg-code-value">{code.codeValue}</code>
                                                        <h4 className="mg-code-name">{code.koreanName || code.codeLabel}</h4>
                                                    </div>
                                                    <button
                                                        className={`mg-status-badge ${code.isActive ? 'mg-active' : 'mg-inactive'}`}
                                                        onClick={() => onToggleActive(code.id, code.isActive)}
                                                    >
                                                        {code.isActive ? '활성' : '비활성'}
                                                    </button>
                                                </div>
                                                
                                                {/* 카드 본문 */}
                                                <div className="mg-code-card__content">
                                                    {code.codeDescription && (
                                                        <div className="mg-code-card__field">
                                                            <span className="mg-code-card__label">설명</span>
                                                            <p className="mg-code-card__value">{code.codeDescription}</p>
                                                        </div>
                                                    )}
                                                    
                                                    {(selectedGroup.groupName === 'CONSULTATION_PACKAGE' || 
                                                      selectedGroup.groupName === 'ASSESSMENT_TYPE') && (
                                                        <div className="mg-code-card__field">
                                                            <span className="mg-code-card__label">금액</span>
                                                            <span className="mg-code-card__value">
                                                                {extraData?.price ? 
                                                                    `${extraData.price.toLocaleString()}원` : 
                                                                    '-'
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="mg-code-card__field">
                                                        <span className="mg-code-card__label">순서</span>
                                                        <span className="mg-code-card__value">{code.sortOrder}</span>
                                                    </div>
                                                </div>
                                                
                                                {/* 카드 액션 */}
                                                <div className="mg-code-card__actions">
                                                    <Button
                                                        variant="secondary"
                                                        size="small"
                                                        onClick={() => onEditCode(code)}
                                                        preventDoubleClick={true}
                                                    >
                                                        수정
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="small"
                                                        onClick={() => onDeleteCode(code.id)}
                                                        preventDoubleClick={true}
                                                    >
                                                        삭제
                                                    </Button>
                                                </div>
                                            </MGCard>
                                        );
                                    })}
                                </div>
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
                                <Button 
                                    type="button" 
                                    variant="secondary" 
                                    onClick={onModalClose}
                                    preventDoubleClick={true}
                                >
                                    취소
                                </Button>
                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    disabled={loading}
                                    loading={loading}
                                    loadingText="처리 중..."
                                    preventDoubleClick={true}
                                >
                                    {modalMode === 'create' ? '생성' : '수정'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantCommonCodeManagerUI;


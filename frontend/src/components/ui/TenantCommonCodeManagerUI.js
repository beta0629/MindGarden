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
import UnifiedModal from '../common/modals/UnifiedModal';
import CustomSelect from '../common/CustomSelect';
import {
    getParentCodeGroupForSubcategory,
    isSubcategoryCodeGroup
} from '../../utils/commonCodeParentGroups';
import { toDisplayString } from '../../utils/safeDisplay';
import './TenantCommonCodeManagerUI.css';

const TENANT_COMMON_CODE_FORM_ID = 'tenant-common-code-manager-form';

const TenantCommonCodeManagerUI = ({
    // 데이터
    codeGroups,
    selectedGroup,
    searchTerm,
    codes,
    loading,
    error,
    showModal,
    modalMode,
    formData,
    parentCategoryOptions = [],
    parentOptionsLoading = false,
    
    // 이벤트 핸들러
    onSearchChange,
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

    const selectedGroupName = selectedGroup ? (selectedGroup.groupName || selectedGroup) : '';
    const showSubcategoryParent = isSubcategoryCodeGroup(selectedGroupName);
    const showParentInModal = isSubcategoryCodeGroup(formData.codeGroup || '');

    const resolveParentLabel = (code) => {
        if (!code?.parentCodeValue) {
            return '—';
        }
        const opt = parentCategoryOptions.find((o) => o.value === code.parentCodeValue);
        if (opt) {
            return toDisplayString(opt.label, '—');
        }
        return toDisplayString(code.parentCodeValue, '—');
    };

    return (
        <div className="mg-tenant-code-manager">
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
                    <div className="mg-panel-header" style={{ marginBottom: '16px' }}>
                        <h3 style={{ marginBottom: '12px' }}>코드 그룹</h3>
                        <div className="mg-search-container">
                            <input
                                type="text"
                                placeholder="코드 그룹 검색..."
                                value={searchTerm || ''}
                                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                                className="mg-form-control"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                    {loading && !selectedGroup ? (
                        <div className="mg-loading">로딩 중...</div>
                    ) : (
                        <ul className="mg-code-groups-list">
                            {codeGroups.map(group => {
                                const groupName = group.groupName || group;
                                const isSelected = selectedGroup && (selectedGroup.groupName || selectedGroup) === groupName;
                                return (
                                <li
                                    key={groupName}
                                    className={isSelected ? 'mg-active' : ''}
                                    onClick={() => onGroupSelect(group)}
                                >
                                    <span className="mg-group-icon">{group.icon || '📁'}</span>
                                    <div className="mg-group-info">
                                        <div className="mg-group-name">{group.displayKoreanName || group.koreanName || groupName}</div>
                                        <div className="mg-group-code">{groupName}</div>
                                    </div>
                                </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* 우측: 선택된 그룹의 코드 목록 */}
                <div className="mg-codes-panel">
                    {selectedGroup ? (
                        <>
                            <div className="mg-codes-header">
                                <div>
                                    <h3>{selectedGroup.displayKoreanName || selectedGroup.koreanName || selectedGroup.groupName || selectedGroup}</h3>
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
                                                        <code className="mg-code-value">{toDisplayString(code.codeValue, '—')}</code>
                                                        <h4 className="mg-code-name">{toDisplayString(code.koreanName || code.codeLabel, '—')}</h4>
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
                                                    {showSubcategoryParent && (
                                                        <div className="mg-code-card__field">
                                                            <span className="mg-code-card__label">상위 카테고리</span>
                                                            <span className="mg-code-card__value">{resolveParentLabel(code)}</span>
                                                        </div>
                                                    )}
                                                    {code.codeDescription && (
                                                        <div className="mg-code-card__field">
                                                            <span className="mg-code-card__label">설명</span>
                                                            <p className="mg-code-card__value">{toDisplayString(code.codeDescription, '—')}</p>
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

            <UnifiedModal
                isOpen={!!showModal}
                onClose={onModalClose}
                title={modalMode === 'create' ? '코드 추가' : '코드 수정'}
                size="large"
                variant="form"
                className="mg-v2-ad-b0kla"
                backdropClick
                showCloseButton
                actions={(
                    <>
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
                            form={TENANT_COMMON_CODE_FORM_ID}
                            variant="primary"
                            disabled={loading}
                            loading={loading}
                            loadingText="처리 중..."
                            preventDoubleClick={true}
                        >
                            {modalMode === 'create' ? '생성' : '수정'}
                        </Button>
                    </>
                )}
            >
                        <form id={TENANT_COMMON_CODE_FORM_ID} onSubmit={onFormSubmit}>
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
                            {showParentInModal && (
                                <div className="mg-form-group">
                                    <label htmlFor="tenant-parent-category">상위 카테고리 *</label>
                                    <CustomSelect
                                        options={parentCategoryOptions}
                                        value={formData.parentCodeValue || ''}
                                        onChange={(v) => onFormChange({
                                            ...formData,
                                            parentCodeGroup: getParentCodeGroupForSubcategory(formData.codeGroup) || '',
                                            parentCodeValue: v
                                        })}
                                        placeholder="상위 카테고리를 선택하세요"
                                        disabled={parentOptionsLoading || parentCategoryOptions.length === 0}
                                        loading={parentOptionsLoading}
                                    />
                                </div>
                            )}
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
                        </form>
            </UnifiedModal>
        </div>
    );
};

export default TenantCommonCodeManagerUI;


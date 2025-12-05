import React from 'react';
import UnifiedLoading from '../../common/UnifiedLoading';
import './CommonCodeList.css';

/**
 * 공통코드 목록 컴포넌트
 * - 공통코드 목록을 테이블 형태로 표시
 * - 편집, 삭제, 상태 토글 기능 제공
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const CommonCodeList = ({ 
    commonCodes, 
    loading, 
    onEdit, 
    onDelete, 
    onToggleStatus 
}) => {
    if (loading) {
        return (
            <div className="common-code-list">
                <UnifiedLoading 
                    type="inline"
                    text="공통코드를 불러오는 중..."
                    variant="pulse"
                />
            </div>
        );
    }

    if (commonCodes.length === 0) {
        return (
            <div className="common-code-list">
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>공통코드가 없습니다</h3>
                    <p>새로운 공통코드를 추가해보세요.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="common-code-list">
            <div className="list-header">
                <h3>공통코드 목록 ({commonCodes.length}개)</h3>
            </div>
            
            <div className="cards-container">
                {commonCodes.map((code) => (
                    <div key={code.id} className={`code-card ${!code.isActive ? 'inactive' : ''}`}>
                        <div className="card-header">
                            <div className="card-title">
                                <span className="code-group-badge">
                                    {code.codeGroup}
                                </span>
                                <h4 className="code-label">
                                    {/* 표준화 2025-12-05: CSS 변수 사용 */}
                                    {code.icon && <span className="code-icon" style={{ color: code.colorCode || 'var(--mg-gray-500)' }}>{code.icon}</span>}
                                    {code.codeLabel}
                                </h4>
                            </div>
                            <div className="card-status">
                                <span 
                                    className={`status-badge ${code.isActive ? 'active' : 'inactive'}`}
                                    onClick={() => onToggleStatus(code.id)}
                                    title={code.isActive ? '클릭하여 비활성화' : '클릭하여 활성화'}
                                >
                                    {code.isActive ? '활성' : '비활성'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="card-body">
                            <div className="code-info">
                                <div className="info-item">
                                    <label>코드 값:</label>
                                    <code className="code-value">{code.codeValue}</code>
                                </div>
                                
                                {code.codeDescription && (
                                    <div className="info-item">
                                        <label>설명:</label>
                                        <p className="code-description">{code.codeDescription}</p>
                                    </div>
                                )}
                                
                                <div className="info-row">
                                    <div className="info-item">
                                        <label>정렬 순서:</label>
                                        <span className="sort-order">{code.sortOrder || 0}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>생성일:</label>
                                        <span className="created-date">
                                            {new Date(code.createdAt).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                </div>
                                
                                {(code.icon || code.colorCode) && (
                                    <div className="info-row">
                                        {code.icon && (
                                            <div className="info-item">
                                                <label>아이콘:</label>
                                                {/* 표준화 2025-12-05: CSS 변수 사용 */}
                                                <span className="code-icon-display" style={{ color: code.colorCode || 'var(--mg-gray-500)' }}>
                                                    {code.icon}
                                                </span>
                                            </div>
                                        )}
                                        {code.colorCode && (
                                            <div className="info-item">
                                                <label>색상:</label>
                                                <div className="color-display">
                                                    <span 
                                                        className="color-swatch" 
                                                        style={{ backgroundColor: code.colorCode }}
                                                        title={code.colorCode}
                                                    ></span>
                                                    <span className="color-code">{code.colorCode}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {code.updatedAt && code.updatedAt !== code.createdAt && (
                                    <div className="info-item">
                                        <label>수정일:</label>
                                        <span className="updated-date">
                                            {new Date(code.updatedAt).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                )}
                                
                                {code.parentCodeGroup && (
                                    <div className="info-item">
                                        <label>상위 코드 그룹:</label>
                                        <span className="parent-code-group">{code.parentCodeGroup}</span>
                                    </div>
                                )}
                                
                                {code.parentCodeValue && (
                                    <div className="info-item">
                                        <label>상위 코드 값:</label>
                                        <span className="parent-code-value">{code.parentCodeValue}</span>
                                    </div>
                                )}
                                
                                {code.extraData && (
                                    <div className="info-item">
                                        <label>추가 데이터:</label>
                                        <span className="extra-data">{code.extraData}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="card-footer">
                            <div className="action-buttons">
                                <button 
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => onEdit(code)}
                                    title="편집"
                                >
                                    <i className="bi bi-pencil"></i>
                                    <span>편집</span>
                                </button>
                                <button 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => onDelete(code.id)}
                                    title="삭제"
                                >
                                    <i className="bi bi-trash"></i>
                                    <span>삭제</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CommonCodeList;

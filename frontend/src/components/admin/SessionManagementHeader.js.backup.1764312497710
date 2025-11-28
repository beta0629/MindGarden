import React from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import './SessionManagementHeader.css';

/**
 * 세션 관리 페이지 헤더 컴포넌트
 * - 타이틀, 부제목, 액션 버튼들을 포함
 * - 아이폰 스타일과 글래스모피즘 효과 적용
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const SessionManagementHeader = ({ 
    activeTab, 
    onTabChange, 
    onAddSession 
}) => {
    return (
        <div className="session-mgmt-header">
            <div className="header-content">
                <div className="header-text">
                    <h1 className="page-title">
                        <i className="bi bi-calendar-check"></i>
                        내담자 회기 관리
                    </h1>
                    <p className="page-subtitle">
                        내담자의 상담 회기를 등록하고 관리할 수 있습니다
                    </p>
                </div>
                
                <div className="header-actions">
                    <button 
                        className="add-session-btn"
                        onClick={onAddSession}
                    >
                        <i className="bi bi-plus-circle"></i>
                        회기 추가 요청
                    </button>
                </div>
            </div>
            
            <div className="tab-navigation">
                <button 
                    className={`tab-btn ${activeTab === 'mappings' ? 'active' : ''}`}
                    onClick={() => onTabChange('mappings')}
                >
                    <i className="bi bi-diagram-3"></i>
                    회기 관리
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
                    onClick={() => onTabChange('sessions')}
                >
                    <i className="bi bi-clock-history"></i>
                    세션 이력
                </button>
            </div>
        </div>
    );
};

export default SessionManagementHeader;

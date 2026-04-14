// import React from 'react';
import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import MGButton from '../../components/common/MGButton';

/**
 * 세션 관리 페이지 헤더 컴포넌트
/**
 * - 타이틀, 부제목, 액션 버튼들을 포함
/**
 * - 아이폰 스타일과 글래스모피즘 효과 적용
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
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
                        <i className="bi bi-calendar-check" />
                        내담자 회기 관리
                    </h1>
                    <p className="page-subtitle">
                        내담자의 상담 회기를 등록하고 관리할 수 있습니다
                    </p>
                </div>
                
                <div className="header-actions">
                    <MGButton
                        type="button"
                        variant="primary"
                        className="add-session-btn"
                        onClick={onAddSession}
                    >
                        회기 추가 요청
                    </MGButton>
                </div>
            </div>
            
            <div className="tab-navigation">
                <MGButton
                    type="button"
                    variant="outline"
                    className={`tab-btn ${activeTab === 'mappings' ? 'active' : ''}`}
                    onClick={() => onTabChange('mappings')}
                    preventDoubleClick={false}
                >
                    회기 관리
                </MGButton>
                <MGButton
                    type="button"
                    variant="outline"
                    className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
                    onClick={() => onTabChange('sessions')}
                    preventDoubleClick={false}
                >
                    세션 이력
                </MGButton>
            </div>
        </div>
    );
};

export default SessionManagementHeader;

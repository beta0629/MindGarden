import React from 'react';
import { FaSync, FaFileAlt, FaTrash, FaDownload } from 'react-icons/fa';

const SystemTools = ({ 
    onRefresh, 
    onViewLogs, 
    onClearCache, 
    onCreateBackup, 
    loading 
}) => {
    const tools = [
        {
            id: 'refresh',
            label: '새로고침',
            icon: FaSync,
            variant: 'outline-secondary',
            onClick: onRefresh,
            description: '통계 데이터를 새로고침합니다'
        },
        {
            id: 'logs',
            label: '로그 보기',
            icon: FaFileAlt,
            variant: 'outline-warning',
            onClick: onViewLogs,
            description: '시스템 로그를 확인합니다'
        },
        {
            id: 'cache',
            label: '캐시 초기화',
            icon: FaTrash,
            variant: 'outline-danger',
            onClick: onClearCache,
            description: '시스템 캐시를 초기화합니다'
        },
        {
            id: 'backup',
            label: '백업 생성',
            icon: FaDownload,
            variant: 'outline-success',
            onClick: onCreateBackup,
            description: '데이터베이스 백업을 생성합니다'
        }
    ];

    return (
        <div className="system-tools-container">
            <div className="tools-grid">
                {tools.map((tool) => {
                    const IconComponent = tool.icon;
                    
                    // 각 도구별 스타일 정의
                    const getToolStyles = (toolId) => {
                        const baseStyles = {
                            width: '100%',
                            padding: '16px 20px',
                            fontWeight: '500',
                            borderRadius: '8px',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden'
                        };

                        switch (toolId) {
                            case 'refresh':
                                return {
                                    ...baseStyles,
                                    color: '#6B73FF',
                                    background: 'linear-gradient(135deg, #F0F2FF 0%, #E8EBFF 100%)'
                                };
                            case 'logs':
                                return {
                                    ...baseStyles,
                                    color: '#FF9F43',
                                    background: 'linear-gradient(135deg, #FFF5E6 0%, #FFE8CC 100%)'
                                };
                            case 'cache':
                                return {
                                    ...baseStyles,
                                    color: '#FF6B9D',
                                    background: 'linear-gradient(135deg, #FFE8F0 0%, #FFD6E8 100%)'
                                };
                            case 'backup':
                                return {
                                    ...baseStyles,
                                    color: '#4ECDC4',
                                    background: 'linear-gradient(135deg, #E8F8F7 0%, #D6F2F0 100%)'
                                };
                            default:
                                return baseStyles;
                        }
                    };

                    const getCardStyles = (toolId) => {
                        return {
                            background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFBFF 100%)',
                            border: '1px solid #E8EBFF',
                            borderRadius: '12px',
                            padding: '20px',
                            boxShadow: '0 2px 8px rgba(107, 115, 255, 0.08)',
                            transition: 'all 0.3s ease',
                            textAlign: 'center'
                        };
                    };

                    const getDescriptionStyles = (toolId) => {
                        const baseDescStyles = {
                            marginTop: '8px',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '500',
                            lineHeight: '1.4',
                            textAlign: 'center',
                            opacity: '0.8'
                        };

                        switch (toolId) {
                            case 'refresh':
                                return { ...baseDescStyles, color: '#6B73FF' };
                            case 'logs':
                                return { ...baseDescStyles, color: '#FF9F43' };
                            case 'cache':
                                return { ...baseDescStyles, color: '#FF6B9D' };
                            case 'backup':
                                return { ...baseDescStyles, color: '#4ECDC4' };
                            default:
                                return { ...baseDescStyles, color: '#6B73FF' };
                        }
                    };

                    return (
                        <div key={tool.id} className={`system-tool-card system-tool-card--${tool.id}`}>
                            <button 
                                className={`system-tool-btn system-tool-btn--${tool.id}`}
                                onClick={tool.onClick}
                                disabled={loading}
                                title={tool.description}
                                onMouseEnter={(e) => {
                                    if (!loading) {
                                        switch (tool.id) {
                                            case 'refresh':
                                                e.target.style.background = 'linear-gradient(135deg, #6B73FF 0%, #5A63E8 100%)';
                                                e.target.style.color = '#FFFFFF';
                                                break;
                                            case 'logs':
                                                e.target.style.background = 'linear-gradient(135deg, #FF9F43 0%, #FF8C2B 100%)';
                                                e.target.style.color = '#FFFFFF';
                                                break;
                                            case 'cache':
                                                e.target.style.background = 'linear-gradient(135deg, #FF6B9D 0%, #FF5A8A 100%)';
                                                e.target.style.color = '#FFFFFF';
                                                break;
                                            case 'backup':
                                                e.target.style.background = 'linear-gradient(135deg, #4ECDC4 0%, #3BB5AC 100%)';
                                                e.target.style.color = '#FFFFFF';
                                                break;
                                        }
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!loading) {
                                        const originalStyles = getToolStyles(tool.id);
                                        e.target.style.background = originalStyles.background;
                                        e.target.style.color = originalStyles.color;
                                    }
                                }}
                            >
                                <IconComponent 
                                    style={{ 
                                        fontSize: 'var(--font-size-xxl)',
                                        transition: 'transform 0.3s ease',
                                        animation: loading ? 'spin 1s linear infinite' : 'none'
                                    }} 
                                />
                                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600' }}>{tool.label}</span>
                            </button>
                            <div style={getDescriptionStyles(tool.id)}>
                                {tool.description}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SystemTools;

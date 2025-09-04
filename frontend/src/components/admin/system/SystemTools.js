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
                    return (
                        <div key={tool.id} className="tool-card">
                            <button 
                                className={`btn ${tool.variant} tool-button`}
                                onClick={tool.onClick}
                                disabled={loading}
                                title={tool.description}
                            >
                                <IconComponent className={loading ? 'spinning' : ''} />
                                <span>{tool.label}</span>
                            </button>
                            <div className="tool-description">
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

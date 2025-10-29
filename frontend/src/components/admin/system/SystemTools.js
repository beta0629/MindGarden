import React from 'react';
import { RefreshCw, FileText, Trash2, Download } from 'lucide-react';
import MGButton from '../../common/MGButton';

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
            icon: <RefreshCw />,
            variant: 'secondary',
            onClick: onRefresh,
            description: '통계 데이터를 새로고침합니다'
        },
        {
            id: 'logs',
            label: '로그 보기',
            icon: <FileText />,
            variant: 'warning',
            onClick: onViewLogs,
            description: '시스템 로그를 확인합니다'
        },
        {
            id: 'cache',
            label: '캐시 초기화',
            icon: <Trash2 />,
            variant: 'danger',
            onClick: onClearCache,
            description: '시스템 캐시를 초기화합니다'
        },
        {
            id: 'backup',
            label: '백업 생성',
            icon: <Download />,
            variant: 'success',
            onClick: onCreateBackup,
            description: '데이터베이스 백업을 생성합니다'
        }
    ];

    return (
        <div className="mg-v2-stats-grid">
            {tools.map((tool) => (
                <div key={tool.id} className="mg-v2-dashboard-stat-card mg-system-tool-card">
                    <MGButton 
                        variant={tool.variant}
                        onClick={tool.onClick}
                        disabled={loading}
                        className="mg-system-tool-button"
                        title={tool.description}
                        fullWidth
                    >
                        <div className="mg-v2-system-tool-icon">
                            {tool.icon}
                        </div>
                        <div className="mg-v2-system-tool-content">
                            <span className="mg-v2-system-tool-label">{tool.label}</span>
                            <div className="mg-v2-system-tool-description">{tool.description}</div>
                        </div>
                    </MGButton>
                </div>
            ))}
        </div>
    );
};

export default SystemTools;

import React from 'react';
import MGButton from '../../common/MGButton';
import { toDisplayString } from '../../../utils/safeDisplay';

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
            shortLabel: '\uC0C8',
            variant: 'secondary',
            onClick: onRefresh,
            description: '통계 데이터를 새로고침합니다'
        },
        {
            id: 'logs',
            label: '로그 보기',
            shortLabel: '로',
            variant: 'warning',
            onClick: onViewLogs,
            description: '시스템 로그를 확인합니다'
        },
        {
            id: 'cache',
            label: '캐시 초기화',
            shortLabel: '\uCE90',
            variant: 'danger',
            onClick: onClearCache,
            description: '시스템 캐시를 초기화합니다'
        },
        {
            id: 'backup',
            label: '백업 생성',
            shortLabel: '\uBC31',
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
                        size="medium"
                        fullWidth
                        className="mg-system-tool-button"
                        onClick={tool.onClick}
                        disabled={loading}
                        title={tool.description}
                    >
                        <div className="mg-v2-system-tool-icon" aria-hidden="true">
                            {tool.shortLabel}
                        </div>
                        <div className="mg-v2-system-tool-content">
                            <span className="mg-v2-system-tool-label">{toDisplayString(tool.label)}</span>
                            <div className="mg-v2-system-tool-description">{toDisplayString(tool.description)}</div>
                        </div>
                    </MGButton>
                </div>
            ))}
        </div>
    );
};

export default SystemTools;

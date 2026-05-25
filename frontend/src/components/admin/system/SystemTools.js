import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../utils/safeDisplay';
import { useSession } from '../../../contexts/SessionContext';
import { USER_ROLES, RoleUtils } from '../../../constants/roles';
import TestNotificationForm from './TestNotificationForm';
import TestNotificationHistory from './TestNotificationHistory';

const TEST_NOTIFICATION_TOOL_ID = 'test-notification';
const TEST_NOTIFICATION_ALLOWED_ROLES = [USER_ROLES.ADMIN, USER_ROLES.STAFF];

const SystemTools = ({
    onRefresh,
    onViewLogs,
    onClearCache,
    onCreateBackup,
    loading
}) => {
    const { t } = useTranslation('admin');
    const { user } = useSession();

    const [expandedTool, setExpandedTool] = useState(null);
    const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

    const hasTestNotificationAccess = RoleUtils.hasAnyRole(user, TEST_NOTIFICATION_ALLOWED_ROLES);

    const handleToggleTestNotification = useCallback(() => {
        setExpandedTool((prev) => (prev === TEST_NOTIFICATION_TOOL_ID ? null : TEST_NOTIFICATION_TOOL_ID));
    }, []);

    const handleTestNotificationSentSuccess = useCallback(() => {
        setHistoryRefreshKey((prev) => prev + 1);
    }, []);

    const baseTools = [
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

    const testNotificationTool = hasTestNotificationAccess
        ? {
            id: TEST_NOTIFICATION_TOOL_ID,
            label: t('testNotification.card.label'),
            shortLabel: t('testNotification.card.shortLabel'),
            variant: 'primary',
            onClick: handleToggleTestNotification,
            description: t('testNotification.card.description'),
            active: expandedTool === TEST_NOTIFICATION_TOOL_ID,
            preventDoubleClick: false
        }
        : null;

    const tools = testNotificationTool
        ? [...baseTools, testNotificationTool]
        : baseTools;

    return (
        <>
            <div className="mg-v2-stats-grid">
                {tools.map((tool) => (
                    <div key={tool.id} className="mg-v2-dashboard-stat-card mg-system-tool-card">
                        <MGButton
                            variant={tool.variant}
                            size="medium"
                            fullWidth
                            className={buildErpMgButtonClassName({
                                variant: tool.variant,
                                size: 'md',
                                loading,
                                className: `mg-system-tool-button${tool.active ? ' mg-system-tool-button--active' : ''}`
                            })}
                            loading={tool.id === TEST_NOTIFICATION_TOOL_ID ? false : loading}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={tool.onClick}
                            disabled={tool.id === TEST_NOTIFICATION_TOOL_ID ? false : loading}
                            title={tool.description}
                            preventDoubleClick={tool.preventDoubleClick !== false}
                            aria-pressed={tool.id === TEST_NOTIFICATION_TOOL_ID ? Boolean(tool.active) : undefined}
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

            {hasTestNotificationAccess && expandedTool === TEST_NOTIFICATION_TOOL_ID && (
                <section
                    className="mg-system-tool-panel"
                    aria-label={t('testNotification.panel.title')}
                >
                    <div className="mg-system-tool-panel__grid">
                        <div className="mg-system-tool-panel__form">
                            <TestNotificationForm onSentSuccess={handleTestNotificationSentSuccess} />
                        </div>
                        <div className="mg-system-tool-panel__history">
                            <TestNotificationHistory refreshKey={historyRefreshKey} />
                        </div>
                    </div>
                </section>
            )}
        </>
    );
};

export default SystemTools;

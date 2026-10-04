import React, { useState, useEffect, useCallback } from 'react';
import StandardizedApi from '../../utils/standardizedApi';
import { SCHEDULE_API } from '../../constants/api';
import { useSession } from '../../contexts/SessionContext';
import UnifiedLoading from '../common/UnifiedLoading';
import { ContentKpiRow } from '../dashboard-v2/content';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { ICONS } from '../../constants/icons';

const CalendarIcon = ICONS.CALENDAR;
const CheckCircle2Icon = ICONS.CHECK_CIRCLE_2;
const ClockIcon = ICONS.CLOCK;
const XCircleIcon = ICONS.X_CIRCLE;
import './TodayStats.css';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

const TODAY_STATS_REFRESH_MS = 30000;

/**
 * 오늘의 통계 컴포넌트 (아토믹 디자인 적용)
 *
 * @author Core Solution
 * @version 2.0.0
 * @since 2024-12-19
 */
const TodayStats = () => {
    const { t } = useTranslation();
    const { user } = useSession();
    const userRole = user?.role;
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        cancelled: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /** 오늘 통계는 서버가 세션 사용자·테넌트 기준으로 집계한다 (일정 전체 목록을 받아 세지 않는다). */
    const loadTodayStats = useCallback(async() => {
        if (!userRole) {
            return;
        }
        try {
            setLoading(true);
            const data = await StandardizedApi.get(SCHEDULE_API.TODAY_STATISTICS, { userRole });
            if (!data || typeof data !== 'object') {
                throw new Error(i18n.t('error:schedule.TodayStats.t_52590b31'));
            }
            setStats({
                total: Number(data.totalToday) || 0,
                completed: Number(data.completedToday) || 0,
                inProgress: Number(data.inProgressToday) || 0,
                cancelled: Number(data.cancelledToday) || 0
            });
            setError(null);
        } catch (loadError) {
            setError(i18n.t('error:schedule.TodayStats.t_52590b31'));
        } finally {
            setLoading(false);
        }
    }, [userRole]);

    useEffect(() => {
        loadTodayStats();
        const interval = setInterval(loadTodayStats, TODAY_STATS_REFRESH_MS);
        return () => clearInterval(interval);
    }, [loadTodayStats]);

    if (loading) return <UnifiedLoading type="inline" text="통계를 불러오는 중..." />;
    if (error) return <div className="mg-v2-text-danger">{error}</div>;

    const kpiItems = [
        {
            id: 'total',
            icon: <CalendarIcon size={24} />,
            label: '총 예약',
            value: stats.total,
            iconVariant: 'blue'
        },
        {
            id: 'completed',
            icon: <CheckCircle2Icon size={24} />,
            label: '상담 완료',
            value: stats.completed,
            iconVariant: 'green'
        },
        {
            id: 'inProgress',
            icon: <ClockIcon size={24} />,
            label: '진행/대기중',
            value: stats.inProgress,
            iconVariant: 'orange'
        },
        {
            id: 'cancelled',
            icon: <XCircleIcon size={24} />,
            label: '취소',
            value: stats.cancelled,
            iconVariant: 'gray'
        }
    ];

    return (
        <div className="today-stats-wrapper">
            <div className="mg-v2-flex mg-v2-justify-end mg-v2-mb-md">
                <MGButton
                    variant="outline"
                    size="small"
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'sm',
                      loading: false,
                      className: 'today-stats-refresh mg-v2-btn-icon mg-v2-text-secondary'
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={loadTodayStats}
                    title={t('common.actions.refresh')}
                    preventDoubleClick={false}
                >
                    🔄 새로고침
                </MGButton>
            </div>
            <ContentKpiRow items={kpiItems} />
        </div>
    );
};

export default TodayStats;

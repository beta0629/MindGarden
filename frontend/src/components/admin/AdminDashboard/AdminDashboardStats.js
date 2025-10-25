import React from 'react';
import StatCard from '../../ui/Card/StatCard';
import { FaUsers, FaUserTie, FaLink, FaCalendarAlt, FaCalendarCheck, FaDollarSign, FaChartLine, FaCheckCircle, FaWallet, FaTruck, FaExclamationTriangle } from 'react-icons/fa';
import { Users, User, Link2, Calendar, CalendarCheck, DollarSign, TrendingUp, CheckCircle, Wallet, Truck, AlertTriangle } from 'lucide-react';

/**
 * AdminDashboard 통계 카드 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const AdminDashboardStats = ({
    stats,
    loading,
    onNavigate
}) => {
    const statCards = [
        {
            title: '총 상담사',
            value: stats.totalConsultants,
            icon: <User className="mg-v2-icon" />,
            color: 'blue',
            onClick: () => onNavigate('/admin/consultants'),
            description: '등록된 상담사 수'
        },
        {
            title: '총 내담자',
            value: stats.totalClients,
            icon: <Users className="mg-v2-icon" />,
            color: 'green',
            onClick: () => onNavigate('/admin/clients'),
            description: '등록된 내담자 수'
        },
        {
            title: '총 매칭',
            value: stats.totalMappings,
            icon: <Link2 className="mg-v2-icon" />,
            color: 'purple',
            onClick: () => onNavigate('/admin/mappings'),
            description: '전체 매칭 건수'
        },
        {
            title: '활성 매칭',
            value: stats.activeMappings,
            icon: <CheckCircle className="mg-v2-icon" />,
            color: 'green',
            onClick: () => onNavigate('/admin/mappings'),
            description: '현재 활성 매칭'
        },
        {
            title: '오늘 일정',
            value: stats.todaySchedules,
            icon: <Calendar className="mg-v2-icon" />,
            color: 'orange',
            onClick: () => onNavigate('/admin/schedules'),
            description: '오늘 예정된 일정'
        },
        {
            title: '완료된 일정',
            value: stats.completedSchedules,
            icon: <CalendarCheck className="mg-v2-icon" />,
            color: 'green',
            onClick: () => onNavigate('/admin/schedules'),
            description: '오늘 완료된 일정'
        },
        {
            title: '총 매출',
            value: stats.totalRevenue,
            icon: <DollarSign className="mg-v2-icon" />,
            color: 'green',
            onClick: () => onNavigate('/admin/erp/financial'),
            description: '전체 매출액'
        },
        {
            title: '환불 요청',
            value: stats.pendingRefunds,
            icon: <Wallet className="mg-v2-icon" />,
            color: 'red',
            onClick: () => onNavigate('/admin/refunds'),
            description: '대기 중인 환불'
        },
        {
            title: '입금 대기',
            value: stats.pendingDeposits,
            icon: <Truck className="mg-v2-icon" />,
            color: 'yellow',
            onClick: () => onNavigate('/admin/deposits'),
            description: '대기 중인 입금'
        },
        {
            title: '평균 평점',
            value: stats.consultantRatingStats?.averageScore?.toFixed(1) || '0.0',
            icon: <TrendingUp className="mg-v2-icon" />,
            color: 'blue',
            onClick: () => onNavigate('/admin/statistics'),
            description: '상담사 평균 평점'
        },
        {
            title: '시스템 알림',
            value: stats.systemNotifications,
            icon: <AlertTriangle className="mg-v2-icon" />,
            color: 'red',
            onClick: () => onNavigate('/admin/system-notifications'),
            description: '미확인 시스템 알림'
        },
        {
            title: '오늘 방문자',
            value: stats.todayVisitors,
            icon: <Users className="mg-v2-icon" />,
            color: 'purple',
            onClick: () => onNavigate('/admin/statistics'),
            description: '오늘 사이트 방문자'
        }
    ];

    return (
        <div className="mg-v2-admin-dashboard-stats">
            <div className="mg-v2-admin-dashboard-stats-grid">
                {statCards.map((card, index) => (
                    <StatCard
                        key={index}
                        title={card.title}
                        value={card.value}
                        icon={card.icon}
                        color={card.color}
                        onClick={card.onClick}
                        description={card.description}
                        loading={loading}
                        className="mg-v2-admin-dashboard-stat-card"
                    />
                ))}
            </div>
        </div>
    );
};

export default AdminDashboardStats;

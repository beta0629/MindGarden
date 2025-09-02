import React, { useState, useEffect, useCallback } from 'react';
import { Button, Alert } from 'react-bootstrap';
import { FaUsers, FaUserTie, FaLink, FaSync, FaCalendarAlt, FaCalendarCheck, FaCog } from 'react-icons/fa';
import TodayStatistics from './TodayStatistics';
import { COMPONENT_CSS, ICONS } from '../../constants/css-variables';
import './AdminDashboard.css';

const AdminDashboard = ({ user }) => {
    const [stats, setStats] = useState({
        totalConsultants: 0,
        totalClients: 0,
        totalMappings: 0,
        activeMappings: 0
    });
    
    const [loading, setLoading] = useState(false);
    const [showToastState, setShowToastState] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    const showToast = useCallback((message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToastState(true);
        setTimeout(() => setShowToastState(false), 3000);
    }, []);



    const loadStats = useCallback(async () => {
        setLoading(true);
        try {
            const [consultantsRes, clientsRes, mappingsRes] = await Promise.all([
                fetch('/api/admin/consultants'),
                fetch('/api/admin/clients'),
                fetch('/api/admin/mappings')
            ]);

            let totalConsultants = 0;
            let totalClients = 0;
            let totalMappings = 0;
            let activeMappings = 0;

            if (consultantsRes.ok) {
                const consultantsData = await consultantsRes.json();
                totalConsultants = consultantsData.count || 0;
            }

            if (clientsRes.ok) {
                const clientsData = await clientsRes.json();
                totalClients = clientsData.count || 0;
            }

            if (mappingsRes.ok) {
                const mappingsData = await mappingsRes.json();
                totalMappings = mappingsData.count || 0;
                activeMappings = (mappingsData.data || []).filter(m => m.status === 'ACTIVE').length;
            }

            setStats({
                totalConsultants,
                totalClients,
                totalMappings,
                activeMappings
            });
        } catch (error) {
            console.error('통계 데이터 로드 실패:', error);
            showToast('통계 데이터 로드에 실패했습니다.', 'danger');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const createTestData = async () => {
        try {
            const response = await fetch('/api/test/create-test-data', {
                method: 'POST'
            });

            if (response.ok) {
                showToast('테스트 데이터가 성공적으로 생성되었습니다.');
                loadStats();
            } else {
                const error = await response.json();
                showToast(error.message || '테스트 데이터 생성에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('테스트 데이터 생성 실패:', error);
            showToast('테스트 데이터 생성에 실패했습니다.', 'danger');
        }
    };

    return (
        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CONTAINER}>
            {/* 오늘의 통계 */}
            {user && user.id && user.role && (
                <TodayStatistics 
                    userId={user.id} 
                    userRole={user.role} 
                />
            )}

            {/* 시스템 개요 */}
            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                    <i className={ICONS.BI.SPEEDOMETER}></i>
                    시스템 개요
                </h2>
                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARDS}>
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARD}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.CARD_ICON} consultants`}>
                            <FaUserTie />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_CONTENT}>
                            <h3>상담사</h3>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_VALUE}>{stats.totalConsultants}명</div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_DESCRIPTION}>등록된 상담사</div>
                        </div>
                    </div>
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARD}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.CARD_ICON} clients`}>
                            <FaUsers />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_CONTENT}>
                            <h3>내담자</h3>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_VALUE}>{stats.totalClients}명</div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_DESCRIPTION}>등록된 내담자</div>
                        </div>
                    </div>
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARD}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.CARD_ICON} mappings`}>
                            <FaLink />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_CONTENT}>
                            <h3>매핑</h3>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_VALUE}>{stats.totalMappings}개</div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_DESCRIPTION}>생성된 매핑</div>
                        </div>
                    </div>
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARD}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.CARD_ICON} active`}>
                            <FaLink />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_CONTENT}>
                            <h3>활성 매핑</h3>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_VALUE}>{stats.activeMappings}개</div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_DESCRIPTION}>활성 상태</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 관리 기능 */}
            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                    <i className={ICONS.BI.GEAR}></i>
                    관리 기능
                </h2>
                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_GRID}>
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => window.location.href = '/admin/schedule'}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} schedule`}>
                            <FaCalendarAlt />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                            <h3>스케줄 관리</h3>
                            <p>상담 일정을 관리하고 조정합니다</p>
                        </div>
                    </div>
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => window.location.href = '/admin/sessions'}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} sessions`}>
                            <FaCalendarCheck />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                            <h3>회기 관리</h3>
                            <p>상담 회기를 등록하고 관리합니다</p>
                        </div>
                    </div>
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => window.location.href = '/admin/consultant-comprehensive'}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} consultants`}>
                            <FaUserTie />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                            <h3>상담사 관리</h3>
                            <p>상담사 정보를 관리합니다</p>
                        </div>
                    </div>
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => window.location.href = '/admin/client-comprehensive'}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} clients`}>
                            <FaUsers />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                            <h3>내담자 관리</h3>
                            <p>내담자 정보를 관리합니다</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 시스템 도구 */}
            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                    <i className={ICONS.BI.TOOLS}></i>
                    시스템 도구
                </h2>
                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.TOOL_BUTTONS}>
                    <Button variant="outline-secondary" onClick={loadStats} disabled={loading}>
                        <FaSync /> 새로고침
                    </Button>
                </div>
            </div>

            {/* 토스트 알림 */}
            {showToastState && (
                <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.TOAST} toast-${toastType}`} style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.TOAST_HEADER}>
                        <strong className="me-auto">알림</strong>
                        <button type="button" className="btn-close" onClick={() => setShowToastState(false)}></button>
                    </div>
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.TOAST_BODY}>{toastMessage}</div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;

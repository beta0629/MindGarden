// import React from 'react';
import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import { Link } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { DEFAULT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import './ComplianceMenu.css';

/**
 * 컴플라이언스 메뉴 컴포넌트
/**
 * 
/**
 * @author MindGarden
/**
 * @version 1.0.0
/**
 * @since 2024-12-19
 */
const ComplianceMenu = () => {
    const complianceMenuItems = [
        {
            id: 'dashboard',
            title: '컴플라이언스 대시보드',
            description: '종합 모니터링 현황',
            icon: '📊',
            path: '/admin/compliance/dashboard',
            color: 'primary'
        },
        {
            id: 'personal-data-processing',
            title: '개인정보 처리 현황',
            description: '처리 현황 및 통계',
            icon: '👥',
            path: '/admin/compliance/personal-data-processing',
            color: 'secondary'
        },
        {
            id: 'impact-assessment',
            title: '개인정보 영향평가',
            description: '위험도 분석 및 평가',
            icon: '📋',
            path: '/admin/compliance/impact-assessment',
            color: 'tertiary'
        },
        {
            id: 'breach-response',
            title: '침해사고 대응',
            description: '대응 절차 및 팀 구성',
            icon: '🚨',
            path: '/admin/compliance/breach-response',
            color: 'danger'
        },
        {
            id: 'education',
            title: '개인정보보호 교육',
            description: '교육 프로그램 및 이수 현황',
            icon: '🎓',
            path: '/admin/compliance/education',
            color: 'info'
        },
        {
            id: 'policy',
            title: '개인정보 처리방침',
            description: '처리방침 관리 및 업데이트',
            icon: '📄',
            path: '/admin/compliance/policy',
            color: 'success'
        },
        {
            id: 'destruction',
            title: '개인정보 파기 관리',
            description: '파기 현황 및 자동화',
            icon: '🗑️',
            path: '/admin/compliance/destruction',
            color: 'warning'
        },
        {
            id: 'audit',
            title: '컴플라이언스 감사',
            description: '감사 로그 및 보고서',
            icon: '🔍',
            path: '/admin/compliance/audit',
            color: 'dark'
        }
    ];

    return (
        <AdminCommonLayout menuItems={DEFAULT_MENU_ITEMS} title="컴플라이언스 관리">
            <div className="compliance-menu">
            <div className="menu-header">
                <h1>⚖️ 컴플라이언스 관리</h1>
                <p>개인정보보호법 및 관련 법령 준수를 위한 통합 관리 시스템</p>
            </div>

            <div className="menu-grid">
                {complianceMenuItems.map((item) => (
                    <Link 
                        key={item.id} 
                        to={item.path} 
                        className={`menu-item ${item.color}`}
                    >
                        <div className="menu-item-icon">
                            {item.icon}
                        </div>
                        <div className="menu-item-content">
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                        </div>
                        <div className="menu-item-arrow">
                            →
                        </div>
                    </Link>
                ))}
            </div>

            <div className="compliance-info">
                <div className="info-card">
                    <h3>📚 법적 근거</h3>
                    <ul>
                        <li>개인정보보호법</li>
                        <li>정보통신망법</li>
                        <li>의료법</li>
                        <li>상법</li>
                        <li>근로기준법</li>
                    </ul>
                </div>
                
                <div className="info-card">
                    <h3>🎯 주요 기능</h3>
                    <ul>
                        <li>실시간 모니터링</li>
                        <li>자동화된 파기 시스템</li>
                        <li>접근 로그 관리</li>
                        <li>영향평가 자동화</li>
                        <li>교육 프로그램 관리</li>
                    </ul>
                </div>
                
                <div className="info-card">
                    <h3>📞 문의 및 지원</h3>
                    <div className="contact-info">
                        <p><strong>개인정보보호책임자:</strong> privacy@mindgarden.co.kr</p>
                        <p><strong>전화:</strong> 02-1234-5678</p>
                        <p><strong>주소:</strong> 서울시 강남구 테헤란로 123</p>
                    </div>
                </div>
            </div>
            </div>
        </AdminCommonLayout>
    );
};

export default ComplianceMenu;

/**
 * Management Grid Widget
/**
 * 실제 마인드가든 관리 기능들을 표시하는 위젯
/**
 * AdminDashboard의 관리 기능 카드들을 위젯화
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0
/**
 * @since 2025-11-27
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, User, Link2, Calendar, Settings, 
  BarChart, Shield, Database, Bell, 
  Building, MapPin, UserCog, Cog 
} from 'lucide-react';
import '../Widget.css';

const ManagementGridWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  
  const config = widget.config || {};
  const title = config.title || '관리 기능';
  const columns = config.columns || 3;
  
  // 실제 마인드가든 관리 기능들 정의
  const managementItems = config.items || [
    {
      id: 'user-management',
      title: '사용자 관리',
      description: '상담사, 내담자, 관리자 계정을 관리합니다',
      icon: <Users size={24} />,
      url: '/admin/user-management',
      color: 'blue'
    },
    {
      id: 'consultant-management',
      title: '상담사 관리',
      description: '상담사 정보 및 전문분야를 관리합니다',
      icon: <User size={24} />,
      url: '/admin/consultants',
      color: 'green'
    },
    {
      id: 'client-management',
      title: '내담자 관리',
      description: '내담자 정보 및 상담 이력을 관리합니다',
      icon: <Users size={24} />,
      url: '/admin/clients',
      color: 'purple'
    },
    {
      id: 'mapping-management',
      title: '매칭 관리',
      description: '상담사-내담자 매칭을 관리합니다',
      icon: <Link2 size={24} />,
      url: '/admin/mappings',
      color: 'orange'
    },
    {
      id: 'schedule-management',
      title: '일정 관리',
      description: '상담 일정을 확인하고 관리합니다',
      icon: <Calendar size={24} />,
      url: '/admin/schedules',
      color: 'cyan'
    },
    {
      id: 'branch-management',
      title: '지점 관리',
      description: '지점 정보 및 계층구조를 관리합니다',
      icon: <Building size={24} />,
      url: '/admin/branches',
      color: 'indigo'
    },
    {
      id: 'common-codes',
      title: '공통코드 관리',
      description: '시스템 공통코드를 관리합니다',
      icon: <Database size={24} />,
      url: '/admin/common-codes',
      color: 'gray'
    },
    {
      id: 'system-config',
      title: '시스템 설정',
      description: '시스템 전반 설정을 관리합니다',
      icon: <Settings size={24} />,
      url: '/admin/system-config',
      color: 'red'
    },
    {
      id: 'statistics',
      title: '통계 및 분석',
      description: '시스템 통계 및 성과를 분석합니다',
      icon: <BarChart size={24} />,
      url: '/admin/statistics',
      color: 'yellow'
    },
    {
      id: 'notifications',
      title: '시스템 알림',
      description: '시스템 알림을 관리합니다',
      icon: <Bell size={24} />,
      url: '/admin/system-notifications',
      color: 'pink'
    },
    {
      id: 'permissions',
      title: '권한 관리',
      description: '사용자 권한을 관리합니다',
      icon: <Shield size={24} />,
      url: '/admin/permissions',
      color: 'emerald'
    },
    {
      id: 'dashboards',
      title: '대시보드 관리',
      description: '사용자별 대시보드를 관리합니다',
      icon: <Cog size={24} />,
      url: '/admin/dashboards',
      color: 'violet'
    }
  ];
  
  const handleItemClick = (item) => {
    if (item.url) {
      navigate(item.url);
    } else if (item.action) {
      if (item.action.type === 'navigate' && item.action.url) {
        navigate(item.action.url);
      } else if (item.action.type === 'api' && item.action.url) {
        // API 호출 처리
        fetch(item.action.url, {
          method: item.action.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }).then(response => {
          if (response.ok) {
            console.log(`✅ ${item.label} 완료`);
          }
        }).catch(err => {
          console.error(`❌ ${item.label} 실패:`, err);
        });
      } else if (item.action.type === 'modal' && item.action.modalId) {
        // 모달 열기 (부모 컴포넌트에서 처리)
        console.log('모달 열기:', item.action.modalId);
      }
    }
  };
  
  return (
    <div className="widget widget-management-grid">
      <div className="widget-header">
        <div className="widget-title">
          <Settings className="mg-v2-icon" />
          {title}
        </div>
        <div className="widget-subtitle">마인드가든 관리 기능</div>
      </div>
      <div className="widget-body">
        <div className={`mg-management-grid mg-management-grid-${columns}`}>
          {managementItems.map((item, index) => (
            <div
              key={item.id || index}
              className={`mg-management-card mg-management-card-${item.color || 'default'}`}
              onClick={() => handleItemClick(item)}
            >
              <div className="mg-management-icon">
                {item.icon}
              </div>
              <div className="mg-management-content">
                <h3 className="mg-management-title">{item.title}</h3>
                <p className="mg-management-description">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagementGridWidget;




import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { sessionManager } from '../../utils/sessionManager';
import { authAPI } from '../../utils/ajax';
import WelcomeSection from './WelcomeSection';
import SummaryPanels from './SummaryPanels';
import QuickActions from './QuickActions';
import RecentActivities from './RecentActivities';

const CommonDashboard = ({ user: propUser }) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState('');
  const [activeTab, setActiveTab] = useState('today');
  const [user, setUser] = useState(null);
  const [consultationData, setConsultationData] = useState({
    upcomingConsultations: [],
    weeklyConsultations: 0,
    monthlyConsultations: 0,
    rating: 0,
    totalUsers: 0,
    todayConsultations: 0,
    consultantInfo: {
      name: '',
      specialty: '',
      intro: ''
    },
    recentActivities: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // 세션 데이터 및 상담 데이터 로드
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        console.log('🔍 대시보드 데이터 로드 시작...');
        
        // 1. 세션에서 사용자 정보 가져오기
        const sessionUser = sessionManager.getUser();
        const currentUser = sessionUser || propUser;
        
        console.log('👤 세션 사용자 정보:', sessionUser);
        console.log('👤 현재 사용자 정보:', currentUser);
        console.log('🔐 로그인 상태:', sessionManager.isLoggedIn());
        
        if (!currentUser && !sessionManager.isLoggedIn()) {
          console.log('❌ 사용자 정보 없음, 로그인 페이지로 이동');
          navigate('/login');
          return;
        }
        
        console.log('✅ 사용자 정보 설정:', currentUser);
        setUser(currentUser);
        
        // 2. 상담 데이터 로드
        if (currentUser?.role === 'CLIENT') {
          console.log('📊 내담자 상담 데이터 로드 시작');
          await loadClientConsultationData(currentUser.id);
        } else if (currentUser?.role === 'CONSULTANT') {
          console.log('📊 상담사 상담 데이터 로드 시작');
          await loadConsultantConsultationData(currentUser.id);
        } else if (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') {
          console.log('📊 관리자 시스템 데이터 로드 시작');
          await loadAdminSystemData();
        }
        
        // 3. 최근 활동 로드
        console.log('📈 최근 활동 로드 시작');
        await loadRecentActivities(currentUser.id);
        
        console.log('✅ 대시보드 데이터 로드 완료');
        
      } catch (error) {
        console.error('❌ 대시보드 데이터 로드 오류:', error);
      } finally {
        console.log('🏁 로딩 상태 해제');
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [propUser, navigate]);

  // 현재 시간 업데이트
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // 역할별 대시보드 제목
  const getDashboardTitle = () => {
    if (!user?.role) return '대시보드';
    
    switch (user.role) {
      case 'CLIENT':
        return '내담자 대시보드';
      case 'CONSULTANT':
        return '상담사 대시보드';
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return '관리자 대시보드';
      default:
        return '대시보드';
    }
  };

  // 역할별 대시보드 부제목
  const getDashboardSubtitle = () => {
    if (!user?.role) return '대시보드에 오신 것을 환영합니다';
    
    switch (user.role) {
      case 'CLIENT':
        return '내담자님의 상담 현황을 확인하세요';
      case 'CONSULTANT':
        return '상담사님의 상담 일정을 관리하세요';
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return '관리자님의 시스템 현황을 확인하세요';
      default:
        return '대시보드에 오신 것을 환영합니다';
    }
  };

  // 내담자 상담 데이터 로드
  const loadClientConsultationData = async (userId) => {
    try {
      // API가 아직 구현되지 않았으므로 기본 데이터 사용
      setConsultationData(prev => ({
        ...prev,
        upcomingConsultations: [],
        weeklyConsultations: 0,
        monthlyConsultations: 0,
        consultantInfo: {
          name: '김상담',
          specialty: '상담 심리학',
          intro: '전문적이고 따뜻한 상담을 제공합니다.'
        }
      }));
    } catch (error) {
      console.error('내담자 상담 데이터 로드 오류:', error);
    }
  };

  // 상담사 상담 데이터 로드
  const loadConsultantConsultationData = async (userId) => {
    try {
      // API가 아직 구현되지 않았으므로 기본 데이터 사용
      setConsultationData(prev => ({
        ...prev,
        monthlyConsultations: 12,
        rating: 4.8
      }));
    } catch (error) {
      console.error('상담사 상담 데이터 로드 오류:', error);
    }
  };

  // 관리자 시스템 데이터 로드
  const loadAdminSystemData = async () => {
    try {
      // API가 아직 구현되지 않았으므로 기본 데이터 사용
      setConsultationData(prev => ({
        ...prev,
        totalUsers: 156,
        todayConsultations: 8
      }));
    } catch (error) {
      console.error('시스템 데이터 로드 오류:', error);
    }
  };

  // 최근 활동 로드
  const loadRecentActivities = async (userId) => {
    try {
      // API가 아직 구현되지 않았으므로 기본 데이터 사용
      setConsultationData(prev => ({
        ...prev,
        recentActivities: [
          { title: '프로필 업데이트', time: '2시간 전', type: 'profile' },
          { title: '상담 일정 확인', time: '1일 전', type: 'schedule' }
        ]
      }));
    } catch (error) {
      console.error('최근 활동 로드 오류:', error);
    }
  };

  // 일정 새로고침
  const refreshSchedule = async () => {
    try {
      if (user?.role === 'CLIENT') {
        await loadClientConsultationData(user.id);
      } else if (user?.role === 'CONSULTANT') {
        await loadConsultantConsultationData(user.id);
      }
    } catch (error) {
      console.error('일정 새로고침 오류:', error);
    }
  };

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <div className="tablet-dashboard-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>대시보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="common-dashboard-content">
      
      {/* 웰컴 섹션 */}
      <WelcomeSection 
        user={user} 
        currentTime={currentTime} 
        consultationData={consultationData} 
      />
      
      {/* 요약 패널 섹션 */}
      <SummaryPanels 
        user={user} 
        consultationData={consultationData} 
      />
      
      {/* 빠른 액션 섹션 */}
      <QuickActions user={user} />
      
      {/* 최근 활동 섹션 */}
      <RecentActivities consultationData={consultationData} />
    </div>
  );
};

export default CommonDashboard;

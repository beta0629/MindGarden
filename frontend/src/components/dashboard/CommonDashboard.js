import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useSession } from '../../contexts/SessionContext';
import { authAPI, apiGet } from '../../utils/ajax';
import { sessionManager } from '../../utils/sessionManager';
import { DASHBOARD_API, API_BASE_URL } from '../../constants/api';
import { getDashboardPath, redirectToDashboardWithFallback } from '../../utils/session';
import { RoleUtils, USER_ROLES } from '../../constants/roles';
import '../../styles/main.css';
import './CommonDashboard.css';
import { DASHBOARD_DEFAULT_DATA, DASHBOARD_ERROR_MESSAGES } from '../../constants/dashboard';
import SimpleLayout from '../layout/SimpleLayout';
import WelcomeSection from './WelcomeSection';
import SummaryPanels from './SummaryPanels';
import QuickActions from './QuickActions';
import RecentActivities from './RecentActivities';
import ClientMessageSection from './ClientMessageSection';
import ErpPurchaseRequestPanel from './ErpPurchaseRequestPanel';
import SystemNotificationSection from './SystemNotificationSection';
import UnifiedLoading from '../common/UnifiedLoading';
import ClientPersonalizedMessages from './ClientPersonalizedMessages';
import ClientPaymentSessionsSection from './ClientPaymentSessionsSection';
import ConsultantClientSection from './ConsultantClientSection';
import HealingCard from '../common/HealingCard';
import ScheduleQuickAccess from './ScheduleQuickAccess';
import RatableConsultationsSection from '../client/RatableConsultationsSection';
import ConsultantRatingDisplay from '../consultant/ConsultantRatingDisplay';
import ConsultationRecordSection from '../consultant/ConsultationRecordSection';

const CommonDashboard = ({ user: propUser }) => {
  const navigate = useNavigate();
  const { user: sessionUser, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [currentTime, setCurrentTime] = useState('');
  const [activeTab, setActiveTab] = useState('today');
  const [user, setUser] = useState(null);
  const [consultationData, setConsultationData] = useState(DASHBOARD_DEFAULT_DATA.consultationData);
  const [clientStatus, setClientStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 내담자 상담 데이터 로드
  const loadClientConsultationData = useCallback(async (userId) => {
    try {
      console.log('📊 내담자 상담 데이터 로드 시작 - 사용자 ID:', userId);
      
      // 1. 내담자 스케줄 데이터 로드
      const scheduleResponse = await apiGet(DASHBOARD_API.CLIENT_SCHEDULES, {
        userId: userId,
        userRole: 'CLIENT'
      });
      
      console.log('📅 스케줄 응답:', scheduleResponse);
      
      let schedules = [];
      if (scheduleResponse?.success && scheduleResponse?.data) {
        schedules = scheduleResponse.data;
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
        
        // 오늘의 상담
        console.log('📅 오늘의 상담 필터링 시작 (내담자):', {
          today: today.toDateString(),
          schedules: schedules.map(s => ({ date: s.date, title: s.title }))
        });
        
        const todaySchedules = schedules.filter(schedule => {
          // 날짜 문자열을 직접 비교 (시간대 문제 방지)
          const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
          const scheduleDateStr = schedule.date; // 이미 YYYY-MM-DD 형식
          const isToday = scheduleDateStr === todayStr;
          
          console.log('📅 스케줄 날짜 비교 (내담자):', {
            scheduleDate: scheduleDateStr,
            today: todayStr,
            isToday,
            title: schedule.title
          });
          return isToday;
        });
        
        console.log('📅 오늘의 상담 결과 (내담자):', todaySchedules);
        
        // 이번 주 상담
        const weeklySchedules = schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.date);
          return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
        });
        
        // 다가오는 상담 (오늘 이후)
        const upcomingSchedules = schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.date);
          return scheduleDate > today && schedule.status === 'CONFIRMED';
        });
        
        // 최근 활동 데이터 생성
        const recentActivities = [];
        
        // 최근 스케줄을 활동으로 변환
        const recentSchedules = schedules
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5); // 최근 5개만
        
        recentSchedules.forEach(schedule => {
          const scheduleDate = new Date(schedule.date);
          const now = new Date();
          const timeDiff = now - scheduleDate;
          const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          
          let timeAgo;
          if (daysDiff === 0) {
            timeAgo = '오늘';
          } else if (daysDiff === 1) {
            timeAgo = '1일 전';
          } else if (daysDiff < 7) {
            timeAgo = `${daysDiff}일 전`;
          } else {
            timeAgo = `${Math.floor(daysDiff / 7)}주 전`;
          }
          
          recentActivities.push({
            type: 'schedule',
            title: `${schedule.consultantName} 상담사와의 상담 일정 ${schedule.status === 'CONFIRMED' ? '확정' : '등록'}`,
            time: timeAgo,
            details: `${schedule.date} ${schedule.startTime} - ${schedule.endTime}`
          });
        });
        
        // 최근 활동이 없을 때만 기본 메시지 표시
        if (recentActivities.length === 0) {
          recentActivities.push({
            type: 'info',
            title: '최근 활동이 없습니다',
            time: '현재',
            details: '아직 등록된 활동이 없습니다'
          });
        }
        
        // 상담사 목록 생성 (중복 제거 및 유효성 검사)
        const consultantMap = new Map();
        schedules.forEach(schedule => {
          if (schedule.consultantId && schedule.consultantName) {
            // ID와 이름이 모두 존재하고 유효한 경우에만 추가
            const consultantId = String(schedule.consultantId).trim();
            const consultantName = String(schedule.consultantName).trim();
            
            if (consultantId && consultantName && consultantId !== 'undefined' && consultantName !== 'undefined') {
              consultantMap.set(consultantId, {
                id: consultantId,
                name: consultantName,
                specialty: '상담 심리학', // 기본값, 추후 API에서 가져올 수 있음
                intro: '전문적이고 따뜻한 상담을 제공합니다.',
                profileImage: null
              });
            }
          }
        });
        
        // Map에서 배열로 변환하고 추가 중복 제거
        const consultantList = Array.from(consultantMap.values()).filter((consultant, index, self) => 
          index === self.findIndex(c => c.id === consultant.id && c.name === consultant.name)
        );
        
        setConsultationData(prev => ({
          ...prev,
          upcomingConsultations: [...todaySchedules, ...upcomingSchedules], // 오늘의 상담도 포함
          weeklyConsultations: weeklySchedules.length,
          todayConsultations: todaySchedules.length,
          recentActivities: recentActivities,
          consultantList: consultantList
        }));
        
        console.log('✅ 내담자 스케줄 데이터 로드 완료:', {
          today: todaySchedules.length,
          weekly: weeklySchedules.length,
          upcoming: upcomingSchedules.length
        });
      }
      
      // 상담사 목록은 스케줄 데이터에서 추출하여 처리됨
      
    } catch (error) {
      console.error('❌ 내담자 상담 데이터 로드 오류:', error);
      setConsultationData(prev => ({
        ...prev,
        upcomingConsultations: [],
        weeklyConsultations: 0,
        todayConsultations: 0,
        consultantInfo: {
          name: '데이터 로드 실패',
          specialty: '정보 없음',
          intro: '데이터를 불러오는데 실패했습니다.',
          profileImage: null
        }
      }));
    }
  }, [user?.id]);

  // 상담사 상담 데이터 로드
  const loadConsultantConsultationData = useCallback(async (userId) => {
    try {
      console.log('📊 상담사 상담 데이터 로드 시작 - 사용자 ID:', userId);
      
      // 1. 상담사 스케줄 데이터 로드
      const scheduleResponse = await apiGet(DASHBOARD_API.CONSULTANT_SCHEDULES, {
        userId: userId,
        userRole: 'CONSULTANT'
      });
      
      console.log('📅 상담사 스케줄 응답:', scheduleResponse);
      
      if (scheduleResponse?.success && scheduleResponse?.data) {
        const schedules = scheduleResponse.data;
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
        
        // 오늘의 상담
        console.log('📅 오늘의 상담 필터링 시작 (상담사):', {
          today: today.toDateString(),
          schedules: schedules.map(s => ({ date: s.date, title: s.title }))
        });
        
        const todaySchedules = schedules.filter(schedule => {
          // 날짜 문자열을 직접 비교 (시간대 문제 방지)
          const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
          const scheduleDateStr = schedule.date; // 이미 YYYY-MM-DD 형식
          const isToday = scheduleDateStr === todayStr;
          
          console.log('📅 스케줄 날짜 비교 (상담사):', {
            scheduleDate: scheduleDateStr,
            today: todayStr,
            isToday,
            title: schedule.title
          });
          return isToday;
        });
        
        console.log('📅 오늘의 상담 결과 (상담사):', todaySchedules);
        
        // 이번 주 상담
        const weeklySchedules = schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.date);
          return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
        });
        
        // 이번 달 상담
        const monthlySchedules = schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.date);
          return scheduleDate >= startOfMonth && scheduleDate <= today;
        });
        
        // 다가오는 상담 (오늘 이후)
        const upcomingSchedules = schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.date);
          return scheduleDate > today && (schedule.status === 'CONFIRMED' || schedule.status === 'BOOKED');
        });
        
        // 최근 활동 데이터 생성
        const recentActivities = [];
        
        // 최근 스케줄을 활동으로 변환 (유효한 데이터만 필터링)
        const recentSchedules = schedules
          .filter(schedule => {
            // 기본 데이터 유효성 검사
            if (!schedule.date || !schedule.startTime || !schedule.endTime) {
              return false;
            }
            
            // 클라이언트나 상담사 이름이 유효한지 확인
            const hasValidClientName = schedule.clientName && 
              schedule.clientName !== 'null' && 
              schedule.clientName !== 'undefined' && 
              schedule.clientName.trim() !== '';
              
            const hasValidConsultantName = schedule.consultantName && 
              schedule.consultantName !== 'null' && 
              schedule.consultantName !== 'undefined' && 
              schedule.consultantName.trim() !== '';
              
            const hasValidTitle = schedule.title && 
              schedule.title.trim() !== '';
            
            return hasValidClientName || hasValidConsultantName || hasValidTitle;
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5); // 최근 5개만
        
        recentSchedules.forEach(schedule => {
          // 스케줄 데이터 유효성 검사
          if (!schedule.date || !schedule.startTime || !schedule.endTime) {
            console.warn('⚠️ 유효하지 않은 스케줄 데이터:', schedule);
            return;
          }
          
          const scheduleDate = new Date(schedule.date);
          const now = new Date();
          const timeDiff = now - scheduleDate;
          const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          
          let timeAgo;
          if (daysDiff === 0) {
            timeAgo = '오늘';
          } else if (daysDiff === 1) {
            timeAgo = '1일 전';
          } else if (daysDiff < 7) {
            timeAgo = `${daysDiff}일 전`;
          } else {
            timeAgo = `${Math.floor(daysDiff / 7)}주 전`;
          }
          
          // 클라이언트/상담사 이름 처리 (안전한 fallback)
          let displayName = '내담자';
          
          if (schedule.clientName && schedule.clientName !== 'null' && schedule.clientName !== 'undefined' && schedule.clientName.trim() !== '') {
            displayName = schedule.clientName;
          } else if (schedule.consultantName && schedule.consultantName !== 'null' && schedule.consultantName !== 'undefined' && schedule.consultantName.trim() !== '') {
            displayName = `상담사 ${schedule.consultantName}`;
          } else if (schedule.title && schedule.title.trim() !== '') {
            displayName = schedule.title;
          }
          
          // 유효한 이름이 있는 경우만 활동에 추가
          if (displayName !== '내담자' || schedule.clientId) {
            recentActivities.push({
              type: 'schedule',
              title: `${displayName}과의 상담 일정 ${schedule.status === 'CONFIRMED' ? '확정' : '등록'}`,
              time: timeAgo,
              details: `${schedule.date} ${schedule.startTime} - ${schedule.endTime}`
            });
          }
        });
        
        // 최근 활동이 없을 때만 기본 메시지 표시
        if (recentActivities.length === 0) {
          recentActivities.push({
            type: 'info',
            title: '최근 활동이 없습니다',
            time: '현재',
            details: '아직 등록된 활동이 없습니다'
          });
        }
        
        setConsultationData(prev => ({
          ...prev,
          monthlyConsultations: monthlySchedules.length,
          todayConsultations: todaySchedules.length,
          weeklyConsultations: weeklySchedules.length,
          upcomingConsultations: [...todaySchedules, ...upcomingSchedules], // 오늘의 상담도 포함
          recentActivities: recentActivities
        }));
        
        console.log('✅ 상담사 스케줄 데이터 로드 완료:', {
          today: todaySchedules.length,
          weekly: weeklySchedules.length,
          monthly: monthlySchedules.length,
          upcoming: upcomingSchedules.length
        });
      }
      
      // 2. 상담사 통계 데이터 로드
      try {
        const statsResponse = await apiGet(DASHBOARD_API.CONSULTANT_STATS, {
          userRole: 'CONSULTANT'
        });
        
        console.log('📊 상담사 통계 응답:', statsResponse);
        
        if (statsResponse?.success && statsResponse?.data) {
          setConsultationData(prev => ({
            ...prev,
            rating: statsResponse.data.averageRating || 0
          }));
          
          console.log('✅ 상담사 통계 로드 완료:', statsResponse.data);
        }
      } catch (statsError) {
        console.warn('⚠️ 상담사 통계 로드 실패, 기본값 사용:', statsError);
        setConsultationData(prev => ({
          ...prev,
          rating: 0
        }));
      }
      
    } catch (error) {
      console.error('❌ 상담사 상담 데이터 로드 오류:', error);
      setConsultationData(prev => ({
        ...prev,
        monthlyConsultations: 0,
        todayConsultations: 0,
        rating: 0
      }));
    }
  }, [user?.id]);

  // 관리자 시스템 데이터 로드
  const loadAdminSystemData = useCallback(async () => {
    try {
      console.log('📊 관리자 시스템 데이터 로드 시작');
      
      // 1. 관리자 통계 데이터 로드
      try {
        const statsResponse = await apiGet(DASHBOARD_API.ADMIN_STATS, {
          userRole: 'ADMIN'
        });
        
        console.log('📊 관리자 통계 응답:', statsResponse);
        
        if (statsResponse?.success && statsResponse?.data) {
          const stats = statsResponse.data;
          // 관리자용 최근 활동 데이터 생성
          const recentActivities = [];
          
          // 시스템 통계 기반 활동 생성
          if (stats.totalUsers > 0) {
            recentActivities.push({
              type: 'profile',
              title: `총 ${stats.totalUsers}명의 사용자 관리`,
              time: '오늘',
              details: '전체 사용자 현황을 확인했습니다'
            });
          }
          
          if (stats.todayConsultations > 0) {
            recentActivities.push({
              type: 'schedule',
              title: `오늘 ${stats.todayConsultations}건의 상담 일정 관리`,
              time: '오늘',
              details: '오늘의 상담 일정을 확인했습니다'
            });
          }
          
          // 기본 활동 추가
          recentActivities.push({
            type: 'consultation',
            title: '시스템 현황 점검',
            time: '1시간 전',
            details: '전체 시스템 상태를 점검했습니다'
          });
          
          setConsultationData(prev => ({
            ...prev,
            totalUsers: stats.totalUsers || 0,
            todayConsultations: stats.todayConsultations || 0,
            recentActivities: recentActivities
          }));
          
          console.log('✅ 관리자 통계 로드 완료:', stats);
        }
      } catch (statsError) {
        console.warn('⚠️ 관리자 통계 로드 실패, 기본값 사용:', statsError);
        setConsultationData(prev => ({
          ...prev,
          totalUsers: 0,
          todayConsultations: 0
        }));
      }
      
      // 2. 매핑 데이터 로드
      let pendingMappings = 0;
      let activeMappings = 0;
      
      try {
        const mappingResponse = await apiGet('/api/admin/mappings');
        if (mappingResponse?.success && mappingResponse?.data) {
          const mappings = mappingResponse.data;
          pendingMappings = mappings.filter(m => m.paymentStatus === 'PENDING').length;
          activeMappings = mappings.filter(m => m.status === 'ACTIVE').length;
        }
      } catch (mappingError) {
        console.warn('⚠️ 매핑 데이터 로드 실패, 기본값 사용:', mappingError);
        // 기본값 사용
        pendingMappings = 0;
        activeMappings = 0;
      }
      
      setConsultationData(prev => ({
        ...prev,
        pendingMappings: pendingMappings,
        activeMappings: activeMappings
      }));
      
      console.log('✅ 관리자 시스템 데이터 로드 완료:', {
        totalUsers: consultationData.totalUsers,
        todayConsultations: consultationData.todayConsultations,
        pendingMappings: pendingMappings,
        activeMappings: activeMappings
      });
      
    } catch (error) {
      console.error('❌ 관리자 시스템 데이터 로드 오류:', error);
      setConsultationData(prev => ({
        ...prev,
        totalUsers: 0,
        todayConsultations: 0,
        pendingMappings: 0,
        activeMappings: 0
      }));
    }
  }, [user?.id]);

  // 세션 데이터 및 상담 데이터 로드
  useEffect(() => {
    let isMounted = true; // 컴포넌트 마운트 상태 추적
    
    const loadDashboardData = async () => {
      try {
        console.log('🔍 대시보드 데이터 로드 시작...');
        
        // 1. 세션 로딩 중이면 대기
        if (sessionLoading) {
          console.log('⏳ 세션 로딩 중... 대기');
          return;
        }
        
        // 2. 로그인 상태 확인 (propUser 또는 sessionUser 우선, sessionManager는 백업)
        let currentUser = propUser || sessionUser;
        if (!currentUser || !currentUser.role) {
          // 백업으로 sessionManager 확인
          currentUser = sessionManager.getUser();
          if (!currentUser || !currentUser.role) {
            // OAuth2 콜백 후 세션 쿠키 설정 대기 (1초)
            console.log('⏳ 사용자 정보 없음, 1초 대기 후 재확인...');
            console.log('👤 propUser:', propUser);
            console.log('👤 sessionUser:', sessionUser);
            console.log('👤 sessionManager 사용자:', currentUser);
            
            // 이미 지연된 세션 확인이 실행 중인지 확인
            if (window.delayedSessionCheckExecuted) {
              console.log('🔄 지연된 세션 확인 이미 실행됨, 스킵');
              return;
            }
            
            window.delayedSessionCheckExecuted = true;
            
           setTimeout(async () => {
             try {
               console.log('🔄 지연된 세션 확인 시작...');
               
               // 1초 후 다시 세션 확인
               const response = await fetch(`${API_BASE_URL}/api/auth/current-user`, {
                 credentials: 'include',
                 method: 'GET',
                 headers: {
                   'Content-Type': 'application/json'
                 }
               });
               
               console.log('🔍 지연된 세션 확인 응답:', response.status, response.statusText);
               
               if (response.ok) {
                 const result = await response.json();
                 console.log('📋 지연된 세션 확인 응답 데이터:', result);
                 
                 // 응답 데이터 구조 확인: result.success && result.user 또는 직접 사용자 객체
                 if ((result.success && result.user) || (result.role && result.name)) {
                   const userData = result.success ? result.user : result;
                   console.log('✅ 지연된 세션 확인 성공, 사용자 정보 로드:', userData);
                   
                   // 사용자 정보 설정 (페이지 리로드 대신)
                   setUser(userData);
                   console.log('✅ 사용자 정보 설정 완료, 페이지 리로드 없이 계속 진행');
                   return;
                 }
               }
               
               console.log('❌ 지연된 세션 확인 실패, 로그인 페이지로 이동');
               navigate('/login', { replace: true });
             } catch (error) {
               console.log('❌ 지연된 세션 확인 오류, 로그인 페이지로 이동:', error);
               navigate('/login', { replace: true });
             }
           }, 1000);
            return;
          }
        }
        
        // 3. 사용자 정보 가져오기 (위에서 확인한 currentUser 사용)
        const dashboardUser = currentUser;
        
        console.log('👤 propUser:', propUser);
        console.log('👤 dashboardUser:', dashboardUser);
        console.log('👤 sessionUser:', sessionUser);
        console.log('🔐 로그인 상태:', isLoggedIn);
        console.log('⏳ 세션 로딩 상태:', sessionLoading);
        
        // 4. 사용자 정보가 없는 경우 처리
        if (!dashboardUser) {
          console.log('⏳ 사용자 정보 없음, 잠시 대기...');
          return;
        }
        
        // 사용자 정보 변경 감지
        if (dashboardUser && dashboardUser.role) {
          console.log('👤 현재 사용자 role:', dashboardUser.role, '이름:', dashboardUser.name || dashboardUser.nickname || dashboardUser.username);
        }
        
        // 컴포넌트가 마운트된 상태에서만 상태 업데이트
        if (isMounted) {
          console.log('✅ 사용자 정보 설정:', dashboardUser);
          setUser(dashboardUser);
        }
        
        // 역할별 리다이렉션 체크 (CLIENT, CONSULTANT만 CommonDashboard 사용)
        if (dashboardUser?.role && !['CLIENT', 'CONSULTANT'].includes(dashboardUser.role)) {
          console.log('🎯 관리자 역할 감지, 적절한 대시보드로 리다이렉션:', dashboardUser.role);
          const dashboardPath = getDashboardPath(dashboardUser.role);
          console.log('🎯 리다이렉션 경로:', dashboardPath);
          redirectToDashboardWithFallback(dashboardUser.role, navigate);
          return;
        }
        
        // 2. 상담 데이터 로드
        if (dashboardUser?.role === 'CLIENT') {
          console.log('📊 내담자 상담 데이터 로드 시작');
          await loadClientConsultationData(dashboardUser.id);
          await loadClientStatus(dashboardUser.id);
        } else if (dashboardUser?.role === 'CONSULTANT') {
          console.log('📊 상담사 상담 데이터 로드 시작');
          await loadConsultantConsultationData(dashboardUser.id);
        } else if (dashboardUser?.role === 'ADMIN' || dashboardUser?.role === 'BRANCH_SUPER_ADMIN' || 
                   dashboardUser?.role === 'BRANCH_MANAGER' || dashboardUser?.role === 'HQ_ADMIN' || 
                   dashboardUser?.role === 'SUPER_HQ_ADMIN' || dashboardUser?.role === 'HQ_MASTER') {
          console.log('📊 관리자 시스템 데이터 로드 시작');
          await loadAdminSystemData();
        }
        
        // 3. 최근 활동은 각 역할별 데이터 로드에서 처리됨
        console.log('📈 최근 활동은 역할별 데이터 로드에서 처리됨');
        
        console.log('✅ 대시보드 데이터 로드 완료');
        
      } catch (error) {
        console.error('❌ 대시보드 데이터 로드 오류:', error);
      } finally {
        if (isMounted) {
          console.log('🏁 데이터 로딩 상태 해제');
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();
    
    // cleanup 함수
    return () => {
      isMounted = false;
    };
  }, [sessionLoading, loadClientConsultationData, loadConsultantConsultationData, loadAdminSystemData]); // 사용자 객체 의존성 제거

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
  }, []); // 빈 의존성 배열로 변경 (시간 업데이트는 독립적)

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

  // 내담자 상태 데이터 로드
  const loadClientStatus = async (userId) => {
    try {
      console.log('📊 내담자 상태 데이터 로드 시작 - 사용자 ID:', userId);
      
      // 매핑 API 호출로 실제 데이터 조회
      const mappingResponse = await apiGet(`/api/admin/mappings/client`, { clientId: userId });
      
      let mappingStatus = 'NONE';
      let paymentStatus = 'NONE';
      
      if (mappingResponse?.success && mappingResponse?.data) {
        const mapping = mappingResponse.data;
        mappingStatus = mapping.mappingStatus || 'ACTIVE';
        paymentStatus = mapping.paymentStatus || 'NONE';
      }
      
      setClientStatus({
        mappingStatus,
        paymentStatus,
        hasMapping: mappingStatus !== 'NONE'
      });
      
      console.log('✅ 내담자 상태 데이터 로드 완료 (기본값):', {
        mappingStatus,
        paymentStatus
      });
      
    } catch (error) {
      console.error('❌ 내담자 상태 데이터 로드 오류:', error);
      setClientStatus({
        mappingStatus: 'NONE',
        paymentStatus: 'NONE',
        hasMapping: false
      });
    }
  };

  // 일정 새로고침
  const refreshSchedule = async () => {
    try {
      if (RoleUtils.isClient(user)) {
        await loadClientConsultationData(user.id);
      } else if (RoleUtils.isConsultant(user)) {
        await loadConsultantConsultationData(user.id);
      }
    } catch (error) {
      console.error('일정 새로고침 오류:', error);
    }
  };

  // 로딩 상태 처리 (세션 로딩 중일 때만 표시)
  if (sessionLoading) {
    return (
      <div className="tablet-dashboard-page">
        <div className="loading-container">
          <UnifiedLoading 
            text="세션 확인 중..." 
            size="medium"
            type="page"
          />
        </div>
      </div>
    );
  }

  return (
    <SimpleLayout>
      <div className={`mg-dashboard-layout dashboard-container ${user?.role?.toLowerCase() || ''}`}>
        
        {/* 웰컴 섹션 */}
        <WelcomeSection 
          user={user} 
          currentTime={currentTime} 
          consultationData={consultationData} 
        />
        
        {/* 내담자 맞춤형 메시지 (내담자 전용) */}
        {RoleUtils.isClient(user) && (
          <ClientPersonalizedMessages 
            user={user}
            consultationData={consultationData}
            clientStatus={clientStatus}
          />
        )}

        {/* 내담자 결제 내역 및 회기 현황 (내담자 전용) */}
        {RoleUtils.isClient(user) && (
          <ClientPaymentSessionsSection userId={user.id} />
        )}

        {/* 상담사 평가 섹션 (내담자 전용) */}
        {RoleUtils.isClient(user) && (
          <RatableConsultationsSection />
        )}

        {/* 상담사 내담자 섹션 (상담사 전용) */}
        {RoleUtils.isConsultant(user) && (
          <ConsultantClientSection userId={user.id} />
        )}

        {/* 상담사 평가 표시 섹션 (상담사 전용) */}
        {RoleUtils.isConsultant(user) && (
          <ConsultantRatingDisplay consultantId={user.id} />
        )}

        {/* 상담일지 섹션 (상담사 전용) */}
        {RoleUtils.isConsultant(user) && (
          <ConsultationRecordSection consultantId={user.id} />
        )}

        {/* 오늘의 힐링 카드 (내담자와 상담사만) */}
        {(RoleUtils.isClient(user) || RoleUtils.isConsultant(user)) && (
          <HealingCard userRole={user?.role} />
        )}
        
        {/* 스케줄 빠른 접근 (상담사 전용) */}
        <ScheduleQuickAccess user={user} />
        
        {/* 요약 패널 섹션 (상담사/관리자 전용) */}
        {(RoleUtils.isConsultant(user) || RoleUtils.isAdmin(user) || RoleUtils.hasRole(user, USER_ROLES.HQ_MASTER)) && (
          <SummaryPanels 
            user={user} 
            consultationData={consultationData} 
          />
        )}
        
        {/* 빠른 액션 섹션 */}
        <QuickActions user={user} />
        
        {/* 최근 활동 섹션 */}
        <RecentActivities consultationData={consultationData} />
        
        {/* 시스템 알림 섹션 (상담사 전용) */}
        {RoleUtils.isConsultant(user) && (
          <SystemNotificationSection />
        )}

        {/* ERP 구매 요청 섹션 (상담사 전용) */}
        {RoleUtils.isConsultant(user) && (
          <ErpPurchaseRequestPanel user={user} />
        )}
        
        {/* 내담자 메시지 섹션 */}
        {RoleUtils.isClient(user) && (
          <ClientMessageSection userId={user.id} />
        )}
      </div>
    </SimpleLayout>
  );
};

export default CommonDashboard;
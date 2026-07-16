/**
 * 세션 관리 화면 (Container Component)
 * 
 * 웹의 frontend/src/components/admin/SessionManagement.js를 참고
 * Presentational/Container 분리 패턴 적용
 * - 로직만 담당 (데이터 fetching, 상태 관리, 비즈니스 로직)
 * - UI는 Presentational 컴포넌트에 위임
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Calendar as CalendarIcon, Clock, Users, CheckCircle, XCircle, AlertTriangle, Search, Plus, X, FileText, Package } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import DashboardSection from '../../components/DashboardSection';
import MGButton from '../../components/MGButton';
import ConfirmModal from '../../components/ConfirmModal';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPut, apiPost } from '../../api/client';
import { SCHEDULE_API, ADMIN_API, COMMON_CODE_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES, { TOUCH_TARGET } from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';
import NotificationService from '../../services/NotificationService';
import { DEFAULT_MAPPING_CONFIG, PAYMENT_METHODS } from '../../constants/mapping';
import { generatePaymentReference } from '../../utils/paymentReference';
// Presentational 컴포넌트들
import SessionStats from '../../components/admin/SessionManagement/SessionStats';
import SessionFilters from '../../components/admin/SessionManagement/SessionFilters';
import ScheduleCalendarView from '../../components/admin/SessionManagement/ScheduleCalendarView';
import DateZoomModal from '../../components/admin/SessionManagement/DateZoomModal';
import ScheduleDetailModal from '../../components/admin/SessionManagement/ScheduleDetailModal';
import ConsultantFilter from '../../components/admin/SessionManagement/ConsultantFilter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 세션 검증 유틸
import { canCreateSchedule, getSessionStatus, filterSchedulableMappings } from '../../utils/sessionValidation';
import { getConsultantColor, getEventColor } from '../../utils/consultantColor';

const SessionManagement = () => {
  const { user } = useSession();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // 상담사 필터 상태
  const [selectedConsultantId, setSelectedConsultantId] = useState('');
  const [loadingConsultants, setLoadingConsultants] = useState(false);
  
  // 메인 탭 상태 (세션 관리 / 세션 추가 요청 / 스케줄 추가)
  const [mainTab, setMainTab] = useState('sessions'); // 'sessions' | 'requests' | 'schedule'
  
  // 달력 뷰 상태 (세션 관리 탭 내에서만 사용)
  const [viewMode, setViewMode] = useState('list'); // 'calendar' | 'list'
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [showDateZoomModal, setShowDateZoomModal] = useState(false);
  const [selectedDateSchedules, setSelectedDateSchedules] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().split('T')[0]);
  const [showScheduleDetailModal, setShowScheduleDetailModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isUpdatingScheduleStatus, setIsUpdatingScheduleStatus] = useState(false);

  // 스케줄 생성 관련 상태
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  const [mappings, setMappings] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    startTime: '',
    duration: 50, // 기본 50분 (웹과 동일)
    endTime: '',
    title: '',
    description: '',
  });
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  
  // 세션 추가 관련 상태
  const [showSessionExtensionModal, setShowSessionExtensionModal] = useState(false);
  const [selectedMappingForExtension, setSelectedMappingForExtension] = useState(null);
  const [extensionSessions, setExtensionSessions] = useState(10); // 기본 10개
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  
  // 패키지 관련 상태
  const [packageOptions, setPackageOptions] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packagePrice, setPackagePrice] = useState(0);
  const [loadingPackages, setLoadingPackages] = useState(false);
  
  // 세션 추가 요청 목록 상태
  const [sessionExtensionRequests, setSessionExtensionRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  
  // 결제 확인 관련 상태
  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);
  const [selectedRequestForPayment, setSelectedRequestForPayment] = useState(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  
  // 승인 관련 상태
  const [approvingRequest, setApprovingRequest] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState(false);
  
  // 신규 매칭 생성 관련 상태 (백엔드 수정 없이 프론트엔드만 추가)
  const [showNewMappingModal, setShowNewMappingModal] = useState(false);
  // 신규 매칭 결제 확인 관련 상태
  const [showPaymentConfirmationModal, setShowPaymentConfirmationModal] = useState(false);
  const [selectedMappingForPayment, setSelectedMappingForPayment] = useState(null);
  const [paymentConfirmationData, setPaymentConfirmationData] = useState({
    paymentMethod: DEFAULT_MAPPING_CONFIG.PAYMENT_METHOD,
    paymentReference: '',
    paymentAmount: 0,
    depositReference: '', // 입금 참조번호 추가
  });
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [showDepositConfirmModal, setShowDepositConfirmModal] = useState(false);
  const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
  const [showEditMappingModal, setShowEditMappingModal] = useState(false);
  const [editingMappingData, setEditingMappingData] = useState({
    packageName: '',
    packagePrice: 0,
    totalSessions: 0,
    paymentMethod: '',
    paymentReference: '',
    responsibility: '',
    specialConsiderations: '',
    notes: '',
  });
  const [isUpdatingMapping, setIsUpdatingMapping] = useState(false);
  const [selectedConsultantForMapping, setSelectedConsultantForMapping] = useState(null);
  const [selectedClientForMapping, setSelectedClientForMapping] = useState(null);
  const [isCreatingMapping, setIsCreatingMapping] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    totalSessions: DEFAULT_MAPPING_CONFIG.TOTAL_SESSIONS,
    packageName: DEFAULT_MAPPING_CONFIG.PACKAGE_NAME,
    packagePrice: DEFAULT_MAPPING_CONFIG.PACKAGE_PRICE,
    paymentMethod: DEFAULT_MAPPING_CONFIG.PAYMENT_METHOD,
    paymentReference: '',
    responsibility: DEFAULT_MAPPING_CONFIG.RESPONSIBILITY,
    specialConsiderations: '',
    notes: ''
  });
  const [paymentMethodOptions, setPaymentMethodOptions] = useState([]);
  const [packageOptionsForMapping, setPackageOptionsForMapping] = useState([]);
  const [responsibilityOptions, setResponsibilityOptions] = useState([]);
  const [loadingMappingOptions, setLoadingMappingOptions] = useState(false);

  // 스케줄 상태 옵션 (동적 로드)
  const [scheduleStatusOptions, setScheduleStatusOptions] = useState([]);
  const [loadingStatusOptions, setLoadingStatusOptions] = useState(false);

  const insets = useSafeAreaInsets();

  const bottomSheetOverlayStyle = useMemo(
    () => [styles.modalOverlay, { paddingBottom: Math.max(insets.bottom, SPACING['2xl']) }],
    [insets.bottom]
  );

  const centeredModalOverlayStyle = useMemo(
    () => [
      styles.paymentModalOverlay,
      {
        paddingTop: Math.max(insets.top, SPACING.lg),
        paddingBottom: insets.bottom + SPACING.lg,
      },
    ],
    [insets.bottom, insets.top]
  );

  // 상담사 목록 로드
  const loadConsultantsForFilter = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoadingConsultants(true);
      
      const usersResponse = await apiGet(ADMIN_API.GET_ALL_USERS);
      const allUsers = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
      const consultantsData = allUsers.filter(u => u.role === 'CONSULTANT');
      
      setConsultants(consultantsData);
    } catch (error) {
      console.error('상담사 목록 로드 실패:', error);
      setConsultants([]);
    } finally {
      setLoadingConsultants(false);
    }
  }, [user?.id]);

  // 세션 데이터 로드 (상담사 필터링 지원)
  const loadSessions = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // 관리자용 스케줄 조회 (상담사 필터링 지원)
      let url = SCHEDULE_API.SCHEDULES_ADMIN;
      if (selectedConsultantId && selectedConsultantId !== '') {
        url += `?consultantId=${selectedConsultantId}`;
      }

      const response = await apiGet(url);

      let sessionsData = [];
      if (response?.success && Array.isArray(response?.data)) {
        sessionsData = response.data;
      } else if (Array.isArray(response?.data)) {
        // 응답이 배열로 직접 오는 경우
        sessionsData = response.data;
      } else if (response?.data) {
        // data가 객체인 경우 배열로 변환
        sessionsData = Array.isArray(response.data.schedules) ? response.data.schedules : [];
      } else {
        // 기본값 설정
        sessionsData = [];
        console.warn('세션 데이터가 없습니다:', response);
      }

      // 상담사와 클라이언트 이름 매핑 추가
      // consultants와 clients가 비어있으면 로드 시도
      if ((consultants.length === 0 || clients.length === 0) && !isLoadingMappings) {
        // loadActiveMappings를 호출하지 않고 직접 사용자 목록만 로드
        try {
          const usersResponse = await apiGet(ADMIN_API.GET_ALL_USERS);
          const allUsers = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
          const consultantsData = allUsers.filter(u => u.role === 'CONSULTANT');
          const clientsData = allUsers.filter(u => u.role === 'CLIENT');
          
          // 세션 데이터에 이름 정보 추가
          sessionsData = sessionsData.map(session => {
            const consultant = consultantsData.find(c => c.id === session.consultantId);
            const client = clientsData.find(c => c.id === session.clientId);
            
            return {
              ...session,
              consultantName: consultant?.name || session.consultantName || '',
              clientName: client?.name || session.clientName || '',
            };
          });
        } catch (error) {
          console.error('사용자 목록 로드 실패:', error);
        }
      } else {
        // 이미 로드된 consultants와 clients를 사용하여 이름 매핑
        sessionsData = sessionsData.map(session => {
          const consultant = consultants.find(c => c.id === session.consultantId);
          const client = clients.find(c => c.id === session.clientId);
          
          return {
            ...session,
            consultantName: consultant?.name || session.consultantName || '',
            clientName: client?.name || session.clientName || '',
          };
        });
      }

      setSessions(sessionsData);
    } catch (error) {
      console.error('세션 로드 실패:', error);
      // 에러가 발생해도 기본값으로 설정하여 로딩이 끝나도록 보장
      setSessions([]);
      setError(
        error.message || 
        error.status === 400 
          ? '요청이 올바르지 않습니다. 권한을 확인해주세요.' 
          : STRINGS.ERROR.LOAD_FAILED || '세션 목록을 불러올 수 없습니다.'
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, selectedConsultantId]);

  // 초기 데이터 로드
  useEffect(() => {
    loadConsultantsForFilter();
    // 매핑 목록도 초기 로드 (회기 추가 목록용)
    loadActiveMappings();
    // 스케줄 상태 옵션 로드
    loadScheduleStatusOptions();
    // 달력 뷰가 활성화되어 있으면 달력용 스케줄도 로드
    if (viewMode === 'calendar') {
      loadAllSessionsForCalendar();
    }
  }, [loadConsultantsForFilter, loadActiveMappings, loadScheduleStatusOptions, viewMode, loadAllSessionsForCalendar]);

  // 스케줄 데이터 로드 (초기 로드 및 상담사 필터 변경 시)
  useEffect(() => {
    if (consultants.length > 0 || selectedConsultantId === '') {
      loadSessions();
    }
  }, [loadSessions, selectedConsultantId, consultants.length]);

  // 활성 매칭 데이터 로드
  const loadActiveMappings = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoadingMappings(true);

      const mappingsRes = await Promise.allSettled([
        apiGet(ADMIN_API.GET_MAPPINGS).catch(err => ({ success: false, data: [] })),
      ]);

      const mappingsData = mappingsRes[0].status === 'fulfilled' ? mappingsRes[0].value : { success: false, data: [] };

      // 모든 매핑 포함 (웹과 동일하게 모든 매핑 표시)
      // 활성 상태가 아니거나 세션이 없으면 비활성화된 상태로 표시
      const allMappings = Array.isArray(mappingsData?.data) ? mappingsData.data : [];
      
      // 활성 상태 매핑 확인용 (표시는 모든 매핑을 포함)
      const activeMappings = allMappings.filter(m => {
        const isActive = m.status === 'ACTIVE' || 
                       m.status === 'PENDING_PAYMENT' || 
                       m.status === 'PAYMENT_CONFIRMED' ||
                       m.status === 'DEPOSIT_PENDING' ||
                       m.status === 'ACTIVE_PENDING';
        return isActive;
      });
      
      // 모든 매핑 표시 (활성/비활성 구분 없이 모두 표시)
      const mappingsToShow = allMappings;
      
      console.log(`📋 전체 매핑 개수: ${allMappings.length}, 활성 매핑 개수: ${activeMappings.length}, 표시할 매핑 개수: ${mappingsToShow.length}`);

      // 상담사 및 클라이언트 목록 로드
      const usersRes = await Promise.allSettled([
        apiGet(ADMIN_API.GET_ALL_USERS).catch(err => ({ success: false, data: [] })),
      ]);
      
      const usersData = usersRes[0].status === 'fulfilled' ? usersRes[0].value : { success: false, data: [] };
      const allUsers = Array.isArray(usersData?.data) ? usersData.data : [];
      
      // 상담사와 클라이언트 분리
      const consultantsData = allUsers.filter(u => u.role === 'CONSULTANT');
      const clientsData = allUsers.filter(u => u.role === 'CLIENT');

      console.log('📋 매핑 모달 - 로드된 상담사 목록:', consultantsData.map(c => ({ id: c.id, name: c.name })));
      console.log('📋 매핑 모달 - 로드된 클라이언트 목록:', clientsData.map(c => ({ id: c.id, name: c.name })));
      console.log('📋 매핑 모달 - 전체 매핑 개수:', mappingsData?.data?.length || 0);
      console.log('📋 매핑 모달 - 활성 매핑 개수:', activeMappings.length);
      console.log('📋 매핑 모달 - 로드된 매핑 목록:', activeMappings.map(m => ({ 
        id: m.id, 
        consultantId: m.consultantId, 
        clientId: m.clientId,
        status: m.status,
        remainingSessions: m.remainingSessions
      })));
      
      // 김선희2 상담사 확인
      const kimSeonHee2 = consultantsData.find(c => c.name === '김선희2' || c.name?.includes('김선희2'));
      if (kimSeonHee2) {
        console.log('✅ 김선희2 상담사 발견:', { id: kimSeonHee2.id, name: kimSeonHee2.name });
        const kimSeonHee2Mappings = mappingsToShow.filter(m => m.consultantId === kimSeonHee2.id);
        console.log('📋 김선희2의 매핑 개수 (표시 목록):', kimSeonHee2Mappings.length);
        console.log('📋 김선희2의 매핑 목록:', kimSeonHee2Mappings);
        
        // 전체 매핑에서도 확인 (활성 상태가 아닌 것 포함)
        const allKimSeonHee2Mappings = allMappings.filter(m => m.consultantId === kimSeonHee2.id);
        console.log('📋 김선희2의 전체 매핑 개수 (활성 상태 무관):', allKimSeonHee2Mappings.length);
        console.log('📋 김선희2의 전체 매핑 상태:', allKimSeonHee2Mappings.map(m => ({ 
          id: m.id, 
          status: m.status,
          remainingSessions: m.remainingSessions,
          consultantId: m.consultantId,
          clientId: m.clientId
        })));
      } else {
        console.log('❌ 김선희2 상담사를 찾을 수 없음');
        console.log('📋 상담사 이름 목록:', consultantsData.map(c => c.name));
      }

      setMappings(mappingsToShow);
      setConsultants(consultantsData);
      setClients(clientsData);
    } catch (error) {
      console.error('매칭 데이터 로드 실패:', error);
      setMappings([]);
      setClients([]);
    } finally {
      setIsLoadingMappings(false);
    }
  }, [user?.id]);

  // 매칭 선택 모달 열기
  const handleOpenMappingModal = async () => {
    await loadActiveMappings();
    setShowMappingModal(true);
  };

  // 매칭 선택 (세션 검증 포함)
  const handleSelectMapping = async (mapping) => {
    // 세션 검증
    if (!canCreateSchedule(mapping)) {
      const sessionStatus = getSessionStatus(mapping);
      NotificationService.warning(sessionStatus.message);
      return;
    }
    
    setSelectedMapping(mapping);
    setShowMappingModal(false);
    
    // 기본값 설정 (내일, 오전 9시-10시)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 자동 제목 생성
    const info = getMappingInfo(mapping);
    const autoTitle = `${info.consultantName} - ${info.clientName} 상담`;
    
    setScheduleForm({
      date: tomorrow.toISOString().split('T')[0],
      startTime: '09:00',
      duration: 50,
      endTime: '09:50',
      title: autoTitle,
      description: '',
    });
    
    // 스케줄 생성 모달을 열기 전에 해당 상담사의 스케줄만 로드
    // 메인 화면의 필터는 변경하지 않음
    if (mapping.consultantId) {
      await loadAllSessionsForCalendar(mapping.consultantId.toString());
    } else {
      await loadAllSessionsForCalendar();
    }
    
    setShowDateTimeModal(true);
  };
  
  // 패키지 옵션 로드
  const loadPackageOptions = useCallback(async () => {
    try {
      setLoadingPackages(true);
      const packageResponse = await apiGet(COMMON_CODE_API.GET_PACKAGE_OPTIONS);
      
      if (packageResponse && Array.isArray(packageResponse) && packageResponse.length > 0) {
        const options = packageResponse.map(code => {
          let sessions = 20; // 기본값
          let price = 0;
          
          // 웹과 동일: 코드 값에 따라 세션 수와 가격 설정
          // 먼저 extraData와 codeDescription에서 가져오기 (공통코드 DB 값 우선)
          if (code.extraData) {
            try {
              const extraData = JSON.parse(code.extraData);
              if (extraData.sessions) {
                sessions = extraData.sessions;
              }
            } catch (e) {
              console.warn('extraData 파싱 실패:', e);
            }
          }
          
          // 가격은 codeDescription에서 가져오기 (공통코드 DB 값)
          if (code.codeDescription) {
            const parsedPrice = parseFloat(code.codeDescription);
            if (!isNaN(parsedPrice) && parsedPrice > 0) {
              price = parsedPrice;
            }
          }
          
          // 기본 패키지들의 기본값 (DB에 값이 없을 때만 사용)
          if (code.codeValue === 'BASIC' && price === 0) {
            sessions = sessions || 20;
            price = price || 200000;
          } else if (code.codeValue === 'STANDARD' && price === 0) {
            sessions = sessions || 20;
            price = price || 400000;
          } else if (code.codeValue === 'PREMIUM' && price === 0) {
            sessions = sessions || 20;
            price = price || 600000;
          } else if (code.codeValue === 'VIP' && price === 0) {
            sessions = sessions || 20;
            price = price || 1000000;
          } else if (code.codeValue?.startsWith('SINGLE_')) {
            // SINGLE_ 패키지는 항상 1회기, 가격은 코드값에서 추출
            sessions = 1;
            const priceStr = code.codeValue.replace('SINGLE_', '');
            const parsedPrice = parseInt(priceStr, 10);
            if (!isNaN(parsedPrice) && parsedPrice > 0 && price === 0) {
              price = parsedPrice;
            } else if (isNaN(parsedPrice) || parsedPrice === 0) {
              price = price || 30000;
            }
          } else {
            sessions = sessions || 20;
            price = price || 0;
          }
          
          // 패키지별 라벨 생성 (웹과 동일)
          let label;
          if (code.codeValue === 'BASIC') {
            label = '기본 패키지';
          } else if (code.codeValue === 'STANDARD') {
            label = '표준 패키지';
          } else if (code.codeValue === 'PREMIUM') {
            label = '프리미엄 패키지';
          } else if (code.codeValue === 'VIP') {
            label = 'VIP 패키지';
          } else if (code.codeValue?.startsWith('SINGLE_')) {
            label = code.codeValue;
          } else {
            label = code.codeLabel || code.koreanName || code.codeValue;
          }
          
          return {
            value: code.codeValue,
            label: label,
            sessions: sessions,
            price: price,
            codeLabel: code.codeLabel || code.koreanName,
          };
        });
        
        setPackageOptions(options);
        
        // 싱글75000 패키지를 기본값으로 설정
        const defaultPackage = options.find(pkg => 
          pkg.value === 'SINGLE_75000' || 
          pkg.label === 'SINGLE_75000' || 
          pkg.value === '싱글75000' ||
          pkg.label === '싱글75000'
        );
        
        if (defaultPackage) {
          // 회기 추가 시 기본 패키지 설정
          setSelectedPackage(defaultPackage);
          setExtensionSessions(defaultPackage.sessions || 1);
          setPackagePrice(defaultPackage.price || 75000);
        }
      } else {
        setPackageOptions([]);
      }
    } catch (error) {
      console.error('패키지 옵션 로드 실패:', error);
      setPackageOptions([]);
    } finally {
      setLoadingPackages(false);
    }
  }, []);

  // 세션 추가 모달 열기
  const handleOpenSessionExtensionModal = async (mapping) => {
    setSelectedMappingForExtension(mapping);
    // 패키지 옵션 로드 (loadPackageOptions에서 싱글75000을 기본값으로 자동 설정)
    await loadPackageOptions();
    setShowSessionExtensionModal(true);
  };
  
  // 세션 추가 모달 닫기
  const handleCloseSessionExtensionModal = () => {
    setShowSessionExtensionModal(false);
    setSelectedMappingForExtension(null);
    setExtensionSessions(10);
    setSelectedPackage(null);
    setPackagePrice(0);
  };

  // 패키지 선택 핸들러
  const handlePackageSelect = (packageOption) => {
    setSelectedPackage(packageOption);
    setExtensionSessions(packageOption.sessions);
    setPackagePrice(packageOption.price);
  };
  
  // 세션 추가 요청 생성 (신규 요청 생성 시에만 단계별 상태 확인)
  const handleCreateSessionExtensionRequest = async () => {
    if (!selectedMappingForExtension) {
      NotificationService.error('매칭 정보가 없습니다.');
      return;
    }
    
    if (!selectedPackage) {
      NotificationService.error('패키지를 선택해주세요.');
      return;
    }

    if (extensionSessions <= 0 || extensionSessions > 1000) {
      NotificationService.error('세션 개수는 1~1000개 사이여야 합니다.');
      return;
    }

    if (!user?.id) {
      NotificationService.error('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
      return;
    }
    
    try {
      setIsCreatingRequest(true);

      // 신규 요청 생성 (PENDING 상태로 시작)
      const response = await apiPost(ADMIN_API.CREATE_SESSION_EXTENSION_REQUEST, {
        mappingId: selectedMappingForExtension.id,
        requesterId: user.id,
        additionalSessions: extensionSessions,
        packageName: selectedPackage.label || selectedPackage.value,
        packagePrice: packagePrice || selectedPackage.price,
        reason: '회기 추가 요청',
      });
      
      if (response?.success !== false) {
        NotificationService.success(`${extensionSessions}회기가 추가 요청되었습니다. 입금 확인을 기다려주세요.`);
        
        // 신규 요청 생성 후 목록 새로고침하여 PENDING 상태 확인
        await loadSessionExtensionRequests();
        
        // 매핑 목록도 새로고침하여 최신 세션 수 반영
        await loadActiveMappings();
        
        handleCloseSessionExtensionModal();
      } else {
        throw new Error(response?.message || '세션 추가 요청에 실패했습니다.');
      }
    } catch (error) {
      console.error('세션 추가 요청 실패:', error);
      NotificationService.error(error.message || '세션 추가 요청에 실패했습니다.');
    } finally {
      setIsCreatingRequest(false);
    }
  };

  // 세션 추가 요청 목록 로드
  const loadSessionExtensionRequests = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoadingRequests(true);
      const response = await apiGet(ADMIN_API.GET_SESSION_EXTENSION_REQUESTS);
      
      const requests = Array.isArray(response?.data) ? response.data : 
                      Array.isArray(response) ? response : [];
      
      console.log('📋 세션 추가 요청 목록 로드:', {
        전체_요청_수: requests.length,
        요청_상태별_분포: requests.reduce((acc, req) => {
          acc[req.status] = (acc[req.status] || 0) + 1;
          return acc;
        }, {}),
        요청_상세: requests.map(r => ({ 
          id: r.id, 
          status: r.status, 
          additionalSessions: r.additionalSessions,
          mappingId: r.mappingId,
          mapping: r.mapping,
          mappingIdFromMapping: r.mapping?.id
        }))
      });
      
      setSessionExtensionRequests(requests);
    } catch (error) {
      console.error('세션 추가 요청 목록 로드 실패:', error);
      setSessionExtensionRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, [user?.id]);

  // 세션 추가 요청 목록 로드 (활성 매핑 목록 필터링을 위해 항상 로드 필요)
  useEffect(() => {
    // 활성 매핑 목록을 표시하는 'requests' 탭일 때는 항상 로드
    // 필터링을 위해 세션 추가 요청 목록이 필요함
    loadSessionExtensionRequests();
  }, [loadSessionExtensionRequests]);

  // 입금 확인 처리 (신규 요청 생성 후 입금 확인 시 백엔드가 자동으로 승인 및 완료까지 처리)
  const handleConfirmPayment = async (requestId) => {
    try {
      setConfirmingPayment(true);
      setSelectedRequestForPayment(sessionExtensionRequests.find(r => r.id === requestId));
      
      const response = await apiPost(ADMIN_API.CONFIRM_SESSION_EXTENSION_PAYMENT(requestId), {
        paymentMethod: 'CASH',
        paymentReference: null,
      });
      
      if (response?.success !== false) {
        // 백엔드가 자동으로 승인 및 완료까지 처리하므로 완료 메시지 표시
        NotificationService.success('입금이 확인되었고 자동으로 승인되어 회기가 추가되었습니다.');
        // 즉시 새로고침
        await loadSessionExtensionRequests(); // COMPLETED 상태로 업데이트 확인
        await loadActiveMappings(); // 세션 수 반영 확인 및 완료된 매핑 제외
        
        // 웹과 동일: 1.5초 후 재확인 (PL/SQL 처리 시간 고려)
        setTimeout(async () => {
          await loadSessionExtensionRequests(); // 재확인
          await loadActiveMappings(); // 재확인
        }, 1500);
      } else {
        throw new Error(response?.message || '입금 확인에 실패했습니다.');
      }
    } catch (error) {
      console.error('입금 확인 실패:', error);
      NotificationService.error(error.message || '입금 확인에 실패했습니다.');
    } finally {
      setConfirmingPayment(false);
      setSelectedRequestForPayment(null);
    }
  };

  // 관리자 승인 처리
  const handleApproveRequest = async (requestId) => {
    if (!user?.id) {
      NotificationService.error('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
      return;
    }

    try {
      setApprovingRequest(true);
      setSelectedRequestForPayment(sessionExtensionRequests.find(r => r.id === requestId));
      
      const response = await apiPost(ADMIN_API.APPROVE_SESSION_EXTENSION(requestId), {
        adminId: user.id,
        comment: '관리자 승인',
      });
      
      if (response?.success !== false) {
        NotificationService.success('관리자 승인이 완료되었습니다.');
        // 즉시 새로고침
        await loadSessionExtensionRequests();
        await loadActiveMappings(); // 매핑 목록도 새로고침 (완료된 매핑 제외)
        
        // 1.5초 후 재확인
        setTimeout(async () => {
          await loadSessionExtensionRequests();
          await loadActiveMappings();
        }, 1500);
      } else {
        throw new Error(response?.message || '승인에 실패했습니다.');
      }
    } catch (error) {
      console.error('승인 실패:', error);
      NotificationService.error(error.message || '승인에 실패했습니다.');
    } finally {
      setApprovingRequest(false);
      setSelectedRequestForPayment(null);
    }
  };

  // 요청 완료 처리
  const handleCompleteRequest = async (requestId) => {
    try {
      setApprovingRequest(true);
      setSelectedRequestForPayment(sessionExtensionRequests.find(r => r.id === requestId));
      
      const response = await apiPost(ADMIN_API.COMPLETE_SESSION_EXTENSION(requestId), {});
      
      if (response?.success !== false) {
        NotificationService.success('요청이 완료되었습니다. 회기가 추가되었습니다.');
        // 즉시 새로고침
        await loadSessionExtensionRequests();
        await loadActiveMappings(); // 매핑 목록도 새로고침 (완료된 매핑 제외)
        
        // 1.5초 후 재확인
        setTimeout(async () => {
          await loadSessionExtensionRequests();
          await loadActiveMappings();
        }, 1500);
      } else {
        throw new Error(response?.message || '완료에 실패했습니다.');
      }
    } catch (error) {
      console.error('완료 실패:', error);
      NotificationService.error(error.message || '완료에 실패했습니다.');
    } finally {
      setApprovingRequest(false);
      setSelectedRequestForPayment(null);
    }
  };

  // 요청 거부 처리
  const handleRejectRequest = async (requestId) => {
    if (!user?.id) {
      NotificationService.error('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
      return;
    }

    try {
      setRejectingRequest(true);
      setSelectedRequestForPayment(sessionExtensionRequests.find(r => r.id === requestId));
      
      const response = await apiPost(ADMIN_API.REJECT_SESSION_EXTENSION(requestId), {
        adminId: user.id,
        reason: '관리자에 의해 거부됨',
      });
      
      if (response?.success !== false) {
        NotificationService.success('요청이 거부되었습니다.');
        await loadSessionExtensionRequests();
      } else {
        throw new Error(response?.message || '거부에 실패했습니다.');
      }
    } catch (error) {
      console.error('거부 실패:', error);
      NotificationService.error(error.message || '거부에 실패했습니다.');
    } finally {
      setRejectingRequest(false);
      setSelectedRequestForPayment(null);
    }
  };

  // 결제 방법 변경 시 참조번호 자동 생성
  const handlePaymentMethodChange = useCallback((method) => {
    const referenceNumber = generatePaymentReference(method);
    setPaymentInfo(prev => ({
      ...prev,
      paymentMethod: method,
      paymentReference: referenceNumber || ''
    }));
  }, []);

  // 신규 매칭 생성 관련 함수들 (백엔드 수정 없이 프론트엔드만 추가)
  
  // 공통 코드 옵션 로드 (결제 방법, 패키지, 상담종류)
  const loadCommonCodeOptionsForMapping = useCallback(async () => {
    try {
      setLoadingMappingOptions(true);
      
      // 결제 방법 로드
      try {
        const paymentResponse = await apiGet(COMMON_CODE_API.GET_PAYMENT_METHODS);
        if (paymentResponse && Array.isArray(paymentResponse) && paymentResponse.length > 0) {
          const options = paymentResponse.map(code => ({
            value: code.codeValue,
            label: code.codeLabel || code.koreanName,
            codeValue: code.codeValue
          }));
          setPaymentMethodOptions(options);
        } else {
          setPaymentMethodOptions([]);
        }
      } catch (error) {
        console.error('결제 방법 코드 로드 실패:', error);
        setPaymentMethodOptions([]);
      }
      
      // 패키지 옵션 로드 (loadPackageOptions와 동일한 로직)
      try {
        const packageResponse = await apiGet(COMMON_CODE_API.GET_PACKAGE_OPTIONS);
        if (packageResponse && Array.isArray(packageResponse) && packageResponse.length > 0) {
          const options = packageResponse.map(code => {
            let sessions = 20;
            let price = 0;
            
            if (code.extraData) {
              try {
                const extraData = JSON.parse(code.extraData);
                if (extraData.sessions) sessions = extraData.sessions;
              } catch (e) {
                console.warn('extraData 파싱 실패:', e);
              }
            }
            
            if (code.codeDescription) {
              const parsedPrice = parseFloat(code.codeDescription);
              if (!isNaN(parsedPrice) && parsedPrice > 0) {
                price = parsedPrice;
              }
            }
            
            // 기본 패키지 기본값
            if (code.codeValue === 'BASIC' && price === 0) {
              sessions = sessions || 20;
              price = price || 200000;
            } else if (code.codeValue === 'STANDARD' && price === 0) {
              sessions = sessions || 20;
              price = price || 400000;
            } else if (code.codeValue === 'PREMIUM' && price === 0) {
              sessions = sessions || 20;
              price = price || 600000;
            } else if (code.codeValue === 'VIP' && price === 0) {
              sessions = sessions || 20;
              price = price || 1000000;
            } else if (code.codeValue?.startsWith('SINGLE_')) {
              sessions = 1;
              const priceStr = code.codeValue.replace('SINGLE_', '');
              const parsedPrice = parseInt(priceStr, 10);
              if (!isNaN(parsedPrice) && parsedPrice > 0 && price === 0) {
                price = parsedPrice;
              } else if (isNaN(parsedPrice) || parsedPrice === 0) {
                price = price || 30000;
              }
            } else {
              sessions = sessions || 20;
              price = price || 0;
            }
            
            let label;
            if (code.codeValue === 'BASIC') {
              label = '기본 패키지';
            } else if (code.codeValue === 'STANDARD') {
              label = '표준 패키지';
            } else if (code.codeValue === 'PREMIUM') {
              label = '프리미엄 패키지';
            } else if (code.codeValue === 'VIP') {
              label = 'VIP 패키지';
            } else if (code.codeValue?.startsWith('SINGLE_')) {
              label = code.codeValue;
            } else {
              label = code.codeLabel || code.koreanName || code.codeValue;
            }
            
            return {
              value: code.codeValue,
              label: label,
              sessions: sessions,
              price: price,
              codeValue: code.codeValue
            };
          });
          setPackageOptionsForMapping(options);
          
          // 싱글75000 패키지를 기본값으로 설정
          const defaultPackage = options.find(pkg => 
            pkg.codeValue === 'SINGLE_75000' || 
            pkg.label === 'SINGLE_75000' || 
            pkg.codeValue === '싱글75000' ||
            pkg.label === '싱글75000'
          );
          
          if (defaultPackage) {
            // 신규 매칭 생성 시 기본 패키지 설정
            setPaymentInfo(prev => ({
              ...prev,
              packageName: defaultPackage.label,
              packagePrice: defaultPackage.price,
              totalSessions: defaultPackage.sessions || 1,
            }));
          }
        } else {
          setPackageOptionsForMapping([]);
        }
      } catch (error) {
        console.error('패키지 옵션 로드 실패:', error);
        setPackageOptionsForMapping([]);
      }
      
      // 상담종류 옵션 로드
      try {
        const responsibilityResponse = await apiGet(COMMON_CODE_API.GET_RESPONSIBILITY_OPTIONS);
        if (responsibilityResponse && Array.isArray(responsibilityResponse) && responsibilityResponse.length > 0) {
          const options = responsibilityResponse.map(code => ({
            value: code.codeValue,
            label: code.codeLabel || code.koreanName,
            codeValue: code.codeValue
          }));
          setResponsibilityOptions(options);
        } else {
          setResponsibilityOptions([]);
        }
      } catch (error) {
        console.error('상담종류 옵션 로드 실패:', error);
        setResponsibilityOptions([]);
      }
    } catch (error) {
      console.error('공통 코드 옵션 로드 실패:', error);
    } finally {
      setLoadingMappingOptions(false);
    }
  }, []);
  
  // 신규 매칭 모달 열기
  const handleOpenNewMappingModal = useCallback(() => {
    setShowNewMappingModal(true);
    loadCommonCodeOptionsForMapping();
  }, [loadCommonCodeOptionsForMapping]);
  
  // 신규 매칭 모달 닫기
  const handleCloseNewMappingModal = useCallback(() => {
    setShowNewMappingModal(false);
    setSelectedConsultantForMapping(null);
  }, []);
  
  // 상담사 선택
  const handleSelectConsultantForMapping = useCallback((consultant) => {
    setSelectedConsultantForMapping(consultant);
  }, []);
  
  // 내담자 선택 및 결제 정보 입력 모달 열기
  const handleSelectClientForMapping = useCallback((client) => {
    if (!selectedConsultantForMapping) {
      NotificationService.error('상담사를 먼저 선택해주세요.');
      return;
    }
    
    setSelectedClientForMapping(client);
    
    // 싱글75000 패키지를 기본값으로 설정 (패키지 옵션이 로드된 경우)
    const defaultPackage = packageOptionsForMapping.find(pkg => 
      pkg.codeValue === 'SINGLE_75000' || 
      pkg.label === 'SINGLE_75000' || 
      pkg.codeValue === '싱글75000' ||
      pkg.label === '싱글75000'
    );
    
    // 결제 참조번호 자동 생성 및 기본 패키지 설정
    setPaymentInfo(prev => ({
      ...prev,
      paymentReference: generatePaymentReference(prev.paymentMethod) || '',
      ...(defaultPackage ? {
        packageName: defaultPackage.label,
        packagePrice: defaultPackage.price,
        totalSessions: defaultPackage.sessions || 1,
      } : {})
    }));
    
    setShowNewMappingModal(false);
    setShowPaymentInfoModal(true);
  }, [selectedConsultantForMapping, packageOptionsForMapping]);
  
  // 결제 정보 모달 닫기
  const handleClosePaymentInfoModalForMapping = useCallback(() => {
    setShowPaymentInfoModal(false);
    setSelectedClientForMapping(null);
    setPaymentInfo({
      totalSessions: DEFAULT_MAPPING_CONFIG.TOTAL_SESSIONS,
      packageName: DEFAULT_MAPPING_CONFIG.PACKAGE_NAME,
      packagePrice: DEFAULT_MAPPING_CONFIG.PACKAGE_PRICE,
      paymentMethod: DEFAULT_MAPPING_CONFIG.PAYMENT_METHOD,
      paymentReference: '',
      responsibility: DEFAULT_MAPPING_CONFIG.RESPONSIBILITY,
      specialConsiderations: '',
      notes: ''
    });
  }, []);
  
  // 신규 매칭 생성 (백엔드 CREATE_MAPPING API 사용)
  const handleCreateMappingWithPayment = useCallback(async () => {
    if (!selectedConsultantForMapping || !selectedClientForMapping) {
      NotificationService.error('상담사와 내담자를 선택해주세요.');
      return;
    }
    
    if (isCreatingMapping) {
      return;
    }

    try {
      setIsCreatingMapping(true);
      
      const mappingData = {
        consultantId: selectedConsultantForMapping.id,
        clientId: selectedClientForMapping.id,
        startDate: new Date().toISOString().split('T')[0],
        status: 'PENDING_PAYMENT',
        notes: paymentInfo.notes || '',
        responsibility: paymentInfo.responsibility || DEFAULT_MAPPING_CONFIG.RESPONSIBILITY,
        specialConsiderations: paymentInfo.specialConsiderations || '',
        paymentStatus: 'PENDING',
        totalSessions: paymentInfo.totalSessions || DEFAULT_MAPPING_CONFIG.TOTAL_SESSIONS,
        remainingSessions: paymentInfo.totalSessions || DEFAULT_MAPPING_CONFIG.TOTAL_SESSIONS,
        packageName: paymentInfo.packageName || DEFAULT_MAPPING_CONFIG.PACKAGE_NAME,
        packagePrice: paymentInfo.packagePrice || DEFAULT_MAPPING_CONFIG.PACKAGE_PRICE,
        paymentAmount: paymentInfo.packagePrice || DEFAULT_MAPPING_CONFIG.PACKAGE_PRICE,
        paymentMethod: paymentInfo.paymentMethod || DEFAULT_MAPPING_CONFIG.PAYMENT_METHOD,
        paymentReference: paymentInfo.paymentReference || '',
        mappingType: 'NEW'
      };

      const response = await apiPost(ADMIN_API.CREATE_MAPPING, mappingData);

      if (response?.success) {
        NotificationService.success('매칭이 생성되었습니다. (결제 대기 상태)');
        handleClosePaymentInfoModalForMapping();
        handleCloseNewMappingModal();
        await loadActiveMappings(); // 매핑 목록 새로고침
      } else {
        throw new Error(response?.message || '매칭 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('매칭 생성 실패:', error);
      NotificationService.error(error.message || '매칭 생성에 실패했습니다.');
    } finally {
      setIsCreatingMapping(false);
    }
  }, [selectedConsultantForMapping, selectedClientForMapping, paymentInfo, isCreatingMapping, handleClosePaymentInfoModalForMapping, handleCloseNewMappingModal]);
  
  // 신규 매칭 결제 확인 관련 함수들
  const handleOpenPaymentConfirmationModal = useCallback((mapping) => {
    setSelectedMappingForPayment(mapping);
    const info = getMappingInfo(mapping);
    setPaymentConfirmationData({
      paymentMethod: mapping.paymentMethod || DEFAULT_MAPPING_CONFIG.PAYMENT_METHOD,
      paymentReference: mapping.paymentReference || '',
      paymentAmount: mapping.packagePrice || mapping.paymentAmount || 0,
    });
    setShowPaymentConfirmationModal(true);
  }, []);

  const handleClosePaymentConfirmationModal = useCallback(() => {
    setShowPaymentConfirmationModal(false);
    setSelectedMappingForPayment(null);
    setPaymentConfirmationData({
      paymentMethod: DEFAULT_MAPPING_CONFIG.PAYMENT_METHOD,
      paymentReference: '',
      paymentAmount: 0,
    });
  }, []);

  const handlePaymentMethodChangeForConfirmation = useCallback((method) => {
    const referenceNumber = generatePaymentReference(method);
    setPaymentConfirmationData(prev => ({
      ...prev,
      paymentMethod: method,
      paymentReference: referenceNumber || '',
    }));
  }, []);

  const handleConfirmMappingPayment = useCallback(async () => {
    if (!selectedMappingForPayment) {
      NotificationService.error('매핑 정보를 찾을 수 없습니다.');
      return;
    }

    if (isConfirmingPayment) {
      return;
    }

    try {
      setIsConfirmingPayment(true);

      // 현재 매핑 상태에 따라 다른 API 호출
      let response;
      if (selectedMappingForPayment.status === 'PENDING_PAYMENT') {
        // 결제 확인 단계
        response = await apiPost(
          ADMIN_API.CONFIRM_MAPPING_PAYMENT(selectedMappingForPayment.id),
          {
            paymentMethod: paymentConfirmationData.paymentMethod,
            paymentReference: paymentConfirmationData.paymentMethod === PAYMENT_METHODS.CASH 
              ? null 
              : paymentConfirmationData.paymentReference,
            paymentAmount: paymentConfirmationData.paymentAmount
          }
        );
      } else if (selectedMappingForPayment.status === 'PAYMENT_CONFIRMED') {
        // 입금 확인 단계
        response = await apiPost(
          ADMIN_API.CONFIRM_MAPPING_DEPOSIT(selectedMappingForPayment.id),
          { 
            depositReference: paymentConfirmationData.paymentReference || paymentConfirmationData.depositReference || ''
          }
        );
      } else if (selectedMappingForPayment.status === 'DEPOSIT_PENDING' || selectedMappingForPayment.status === 'ACTIVE_PENDING') {
        // 관리자 승인 단계 (DEPOSIT_PENDING 또는 ACTIVE_PENDING 상태에서 활성화)
        // 최종 승인: 매칭을 ACTIVE 상태로 활성화
        response = await apiPost(
          ADMIN_API.APPROVE_MAPPING(selectedMappingForPayment.id),
          { 
            adminName: user?.username || user?.name || 'Admin'
          }
        );
      }

      if (response?.success !== false) {
        const statusMessages = {
          'PENDING_PAYMENT': '✅ 결제 확인 완료! 다음 단계로 진행됩니다.',
          'PAYMENT_CONFIRMED': '✅ 입금 확인 완료! 관리자 승인을 기다립니다.',
          'DEPOSIT_PENDING': '✅ 관리자 승인 완료! 매칭이 활성화되었습니다.',
          'ACTIVE_PENDING': '✅ 관리자 승인 완료! 매칭이 활성화되었습니다.',
        };
        NotificationService.success(statusMessages[selectedMappingForPayment.status] || '✅ 처리 완료!');
        handleClosePaymentConfirmationModal();
        await loadActiveMappings(); // 매핑 목록 새로고침
      } else {
        NotificationService.error(response?.message || '처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('처리 실패:', error);
      NotificationService.error(error?.message || '처리에 실패했습니다.');
    } finally {
      setIsConfirmingPayment(false);
    }
  }, [selectedMappingForPayment, paymentConfirmationData, isConfirmingPayment, handleClosePaymentConfirmationModal, loadActiveMappings]);

  // 입금 확인 모달 관련 함수들 (신규 매칭의 PAYMENT_CONFIRMED 상태일 때)
  const handleOpenDepositConfirmationModal = useCallback((mapping) => {
    setSelectedMappingForPayment(mapping);
    setPaymentConfirmationData({
      paymentMethod: mapping.paymentMethod || DEFAULT_MAPPING_CONFIG.PAYMENT_METHOD,
      paymentReference: mapping.paymentReference || '',
      paymentAmount: mapping.packagePrice || mapping.paymentAmount || 0,
      depositReference: '', // 입금 참조번호 초기화
    });
    setShowPaymentConfirmationModal(true);
  }, []);

  // 입금 확인 다이얼로그의 실제 확인 처리
  const handleConfirmDeposit = useCallback(async () => {
    if (!selectedMappingForPayment) {
      NotificationService.error('매핑 정보를 찾을 수 없습니다.');
      return;
    }

    if (isConfirmingPayment) {
      return;
    }

    try {
      setIsConfirmingPayment(true);
      setShowDepositConfirmModal(false);

      const response = await apiPost(
        ADMIN_API.CONFIRM_MAPPING_DEPOSIT(selectedMappingForPayment.id),
        { 
          depositReference: paymentConfirmationData.depositReference || paymentConfirmationData.paymentReference || ''
        }
      );

      if (response?.success !== false) {
        NotificationService.success('✅ 입금 확인 완료! ERP 시스템에 현금 수입 거래가 자동 등록되었습니다. 관리자 승인을 기다립니다.');
        handleClosePaymentConfirmationModal();
        await loadActiveMappings(); // 매핑 목록 새로고침
      } else {
        NotificationService.error(response?.message || '입금 확인에 실패했습니다.');
      }
    } catch (error) {
      console.error('입금 확인 실패:', error);
      NotificationService.error(error?.message || '입금 확인에 실패했습니다.');
    } finally {
      setIsConfirmingPayment(false);
    }
  }, [selectedMappingForPayment, paymentConfirmationData, isConfirmingPayment, handleClosePaymentConfirmationModal, loadActiveMappings]);

  // 관리자 승인 모달 관련 함수들 (신규 매칭의 ACTIVE_PENDING 상태일 때)
  const handleOpenApprovalModal = useCallback((mapping) => {
    // 관리자 승인은 간단한 확인 모달로 처리
    // 또는 결제 확인 모달을 재사용할 수 있음
    setSelectedMappingForPayment(mapping);
    setShowPaymentConfirmationModal(true);
  }, []);

  // 매핑 수정 모달 열기 (ERP 등록 전 - PENDING_PAYMENT 상태일 때만)
  const handleOpenEditMappingModal = useCallback(async (mapping) => {
    if (mapping.status !== 'PENDING_PAYMENT') {
      NotificationService.error('결제 확인 전 상태에서만 수정 가능합니다.');
      return;
    }
    setSelectedMappingForPayment(mapping);
    
    // 패키지 옵션 및 기타 옵션 로드
    await loadCommonCodeOptionsForMapping();
    
    // 매핑 데이터에서 기존 값 즉시 설정
    const existingPackageName = mapping.packageName || '';
    const existingPaymentMethod = mapping.paymentMethod || DEFAULT_MAPPING_CONFIG.PAYMENT_METHOD;
    
    setEditingMappingData({
      packageName: existingPackageName,
      packagePrice: mapping.packagePrice || mapping.paymentAmount || 0,
      totalSessions: mapping.totalSessions || 0,
      paymentMethod: existingPaymentMethod,
      paymentReference: mapping.paymentReference || '',
      responsibility: mapping.responsibility || DEFAULT_MAPPING_CONFIG.RESPONSIBILITY,
      specialConsiderations: mapping.specialConsiderations || '',
      notes: mapping.notes || '',
    });
    
    setShowEditMappingModal(true);
  }, [loadCommonCodeOptionsForMapping]);
  
  // 패키지 옵션이 로드된 후 매칭된 패키지 정보 및 결제 방법 업데이트
  useEffect(() => {
    if (showEditMappingModal && selectedMappingForPayment) {
      const existingPackageName = selectedMappingForPayment.packageName || '';
      const existingPaymentMethod = selectedMappingForPayment.paymentMethod || '';
      
      setEditingMappingData(prev => {
        let updated = { ...prev };
        
        // 패키지 정보 업데이트
        if (packageOptionsForMapping.length > 0) {
          const matchedPackage = packageOptionsForMapping.find(pkg => 
            pkg.label === existingPackageName || 
            pkg.codeValue === existingPackageName
          );
          
          if (matchedPackage && matchedPackage.label === existingPackageName) {
            // 이미 올바른 값이면 업데이트하지 않음 (무한 루프 방지)
            if (prev.packagePrice !== matchedPackage.price || prev.totalSessions !== matchedPackage.sessions) {
              updated.packagePrice = matchedPackage.price || prev.packagePrice;
              updated.totalSessions = matchedPackage.sessions || prev.totalSessions;
            }
          }
        }
        
        // 결제 방법 매칭 및 업데이트
        if (paymentMethodOptions.length > 0 && existingPaymentMethod) {
          // 매핑 데이터의 paymentMethod를 옵션과 비교하여 매칭
          const matchedMethod = paymentMethodOptions.find(option => {
            const optionValue = option.value || option.label;
            const optionLabel = option.label || option.value;
            return optionValue === existingPaymentMethod || 
                   optionLabel === existingPaymentMethod ||
                   option.codeValue === existingPaymentMethod;
          });
          
          if (matchedMethod && prev.paymentMethod !== (matchedMethod.value || matchedMethod.label)) {
            updated.paymentMethod = matchedMethod.value || matchedMethod.label;
            // 결제 방법이 변경되었을 때만 참조번호 재생성 (기존 참조번호가 없거나 현금일 경우)
            if (!prev.paymentReference || (matchedMethod.value || matchedMethod.label) === PAYMENT_METHODS.CASH) {
              updated.paymentReference = generatePaymentReference(matchedMethod.value || matchedMethod.label) || prev.paymentReference || '';
            }
          } else if (!matchedMethod && existingPaymentMethod) {
            // 매칭되지 않으면 원본 값 그대로 사용
            updated.paymentMethod = existingPaymentMethod;
          }
        }
        
        return updated;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEditMappingModal, selectedMappingForPayment?.id, packageOptionsForMapping.length, paymentMethodOptions.length]);

  // 매핑 수정 모달 닫기
  const handleCloseEditMappingModal = useCallback(() => {
    setShowEditMappingModal(false);
    setSelectedMappingForPayment(null);
    setEditingMappingData({
      packageName: '',
      packagePrice: 0,
      totalSessions: 0,
      paymentMethod: '',
      paymentReference: '',
      responsibility: '',
      specialConsiderations: '',
      notes: '',
    });
  }, []);

  // 매핑 정보 수정 (ERP 등록 전)
  const handleUpdateMapping = useCallback(async () => {
    if (!selectedMappingForPayment) {
      NotificationService.error('매핑 정보를 찾을 수 없습니다.');
      return;
    }

    if (selectedMappingForPayment.status !== 'PENDING_PAYMENT') {
      NotificationService.error('결제 확인 전 상태에서만 수정 가능합니다.');
      handleCloseEditMappingModal();
      return;
    }

    if (isUpdatingMapping) {
      return;
    }

    try {
      setIsUpdatingMapping(true);

      // 백엔드 ConsultantClientMappingDto가 받는 필드 전송
      const response = await apiPut(
        ADMIN_API.UPDATE_MAPPING(selectedMappingForPayment.id),
        {
          packageName: editingMappingData.packageName,
          packagePrice: parseFloat(editingMappingData.packagePrice) || 0,
          totalSessions: parseInt(editingMappingData.totalSessions) || 0,
          paymentMethod: editingMappingData.paymentMethod || null,
          paymentReference: editingMappingData.paymentReference || null,
        }
      );

      if (response?.success !== false) {
        NotificationService.success('✅ 매핑 정보가 수정되었습니다.');
        handleCloseEditMappingModal();
        await loadActiveMappings(); // 매핑 목록 새로고침
      } else {
        NotificationService.error(response?.message || '매핑 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('매핑 수정 실패:', error);
      NotificationService.error(error?.message || '매핑 수정에 실패했습니다.');
    } finally {
      setIsUpdatingMapping(false);
    }
  }, [selectedMappingForPayment, editingMappingData, isUpdatingMapping, handleCloseEditMappingModal, loadActiveMappings]);
  
  // 요청 상태 정보 가져오기
  const getRequestStatusInfo = (status) => {
    switch (status) {
      case 'PENDING':
        return {
          text: '입금 대기',
          color: COLORS.warning,
          bgColor: COLORS.warningLight,
        };
      case 'PAYMENT_CONFIRMED':
        return {
          text: '입금 확인됨',
          color: COLORS.info || COLORS.primary,
          bgColor: COLORS.primaryLight,
        };
      case 'ADMIN_APPROVED':
        return {
          text: '관리자 승인됨',
          color: COLORS.success,
          bgColor: COLORS.successLight,
        };
      case 'COMPLETED':
        return {
          text: '완료됨',
          color: COLORS.success,
          bgColor: COLORS.successLight,
        };
      case 'REJECTED':
        return {
          text: '거부됨',
          color: COLORS.error,
          bgColor: COLORS.errorLight,
        };
      default:
        return {
          text: status || '알 수 없음',
          color: COLORS.gray600,
          bgColor: COLORS.gray100,
        };
    }
  };

  // 시간을 분으로 변환
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // 분을 시간 문자열로 변환
  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // 시간 겹침 여부 확인 (웹 버전과 동일한 로직)
  const isTimeOverlapping = (start1, end1, start2, end2) => {
    return start1 < end2 && start2 < end1;
  };

  // 분 단위 시간 차이 계산
  const getMinutesDifference = (time1, time2) => {
    const minutes1 = timeToMinutes(time1);
    const minutes2 = timeToMinutes(time2);
    return Math.abs(minutes2 - minutes1);
  };

  // 시간 간격이 너무 가까운지 확인 (10분 휴식 시간)
  const isTimeTooClose = (start1, end1, start2, end2) => {
    const breakTime = 10; // 10분 휴식 시간
    
    // 첫 번째 스케줄이 두 번째 스케줄보다 먼저 끝나는 경우
    if (end1 <= start2) {
      const gapMinutes = getMinutesDifference(end1, start2);
      return gapMinutes < breakTime;
    }
    
    // 두 번째 스케줄이 첫 번째 스케줄보다 먼저 끝나는 경우
    if (end2 <= start1) {
      const gapMinutes = getMinutesDifference(end2, start1);
      return gapMinutes < breakTime;
    }
    
    return false;
  };

  // 시간 충돌 검사 (동일 상담사, 동일 날짜의 기존 스케줄과 비교)
  const checkTimeConflict = (consultantId, date, startTime, endTime) => {
    const conflictSchedules = sessions.filter(schedule => {
      // 동일한 상담사이고 동일한 날짜인 스케줄만 체크
      return schedule.consultantId === consultantId && 
             schedule.date === date &&
             schedule.status !== 'CANCELLED'; // 취소된 스케줄은 제외
    });

    return conflictSchedules.some(schedule => {
      const scheduleStart = schedule.startTime;
      const scheduleEnd = schedule.endTime;
      
      // 10분 휴식 시간을 고려한 충돌 검사
      return isTimeOverlapping(startTime, endTime, scheduleStart, scheduleEnd) ||
             isTimeTooClose(startTime, endTime, scheduleStart, scheduleEnd);
    });
  };

  // 스케줄 생성
  const handleCreateSchedule = async () => {
    if (!selectedMapping) {
      NotificationService.error(STRINGS.ERROR.SELECT_MAPPING || '매칭을 선택해주세요.');
      return;
    }

    if (!scheduleForm.date) {
      NotificationService.error(STRINGS.SESSION.DATE_REQUIRED);
      return;
    }

    if (!scheduleForm.startTime) {
      NotificationService.error(STRINGS.SESSION.START_TIME_REQUIRED);
      return;
    }

    // 종료 시간 자동 계산 (시작 시간 + 상담 시간)
    const calculatedEndTime = calculateEndTime(scheduleForm.startTime, scheduleForm.duration);
    if (!calculatedEndTime) {
      NotificationService.error('상담 시간을 선택해주세요');
      return;
    }

    // 종료 시간 재계산 (최신 duration 반영)
    const finalEndTime = calculateEndTime(scheduleForm.startTime, scheduleForm.duration);

    // 동일 시간대 스케줄 중복 체크 (웹 버전과 동일한 로직)
    const hasConflict = checkTimeConflict(
      selectedMapping.consultantId,
      scheduleForm.date,
      scheduleForm.startTime,
      finalEndTime
    );

    if (hasConflict) {
      NotificationService.error('해당 시간대에 이미 스케줄이 존재합니다. 다른 시간을 선택해주세요.');
      return;
    }

    try {
      setIsCreatingSchedule(true);

      const scheduleData = {
        consultantId: selectedMapping.consultantId,
        clientId: selectedMapping.clientId,
        date: scheduleForm.date,
        startTime: scheduleForm.startTime,
        endTime: finalEndTime,
        title: scheduleForm.title,
        description: scheduleForm.description || '',
        scheduleType: 'CONSULTATION',
        consultationType: 'INDIVIDUAL',
      };

      const response = await apiPost(SCHEDULE_API.SCHEDULES_BY_CONSULTANT, scheduleData);

      if (response?.success) {
        NotificationService.success(STRINGS.SESSION.SCHEDULE_CREATED);
        setShowDateTimeModal(false);
        setSelectedMapping(null);
        // 세션 목록 새로고침
        await loadSessions();
        // 달력 뷰가 활성화되어 있으면 달력 데이터도 새로고침
        if (mainTab === 'sessions' && viewMode === 'calendar') {
          await loadAllSessionsForCalendar();
        }
      } else {
        throw new Error(response?.message || STRINGS.SESSION.SCHEDULE_CREATE_FAILED);
      }
    } catch (error) {
      console.error('스케줄 생성 실패:', error);
      NotificationService.error(error.message || STRINGS.SESSION.SCHEDULE_CREATE_FAILED);
    } finally {
      setIsCreatingSchedule(false);
    }
  };

  // 매칭 정보 가져오기
  const getMappingInfo = (mapping) => {
    const consultant = consultants.find(c => c.id === mapping.consultantId);
    const client = clients.find(c => c.id === mapping.clientId);
    
    return {
      consultantName: consultant?.name || STRINGS.CONSULTANT.NO_INFO,
      clientName: client?.name || STRINGS.CLIENT.NO_INFO,
      remainingSessions: mapping.remainingSessions || 0,
      totalSessions: mapping.totalSessions || 0,
      usedSessions: mapping.usedSessions || 0,
    };
  };

  // 활성 매핑 목록 필터링 (회기 추가용)
  const activeMappingsForExtension = useMemo(() => {
    // 완료된 세션 추가 요청이 있는 매핑 ID 목록 (여러 방법으로 확인)
    const completedRequestMappingIds = new Set();
    
    sessionExtensionRequests.forEach(request => {
      if (request.status === 'COMPLETED') {
        // 여러 방법으로 mappingId 확인
        let mappingId = request.mappingId;
        
        // mappingId가 없으면 mapping 객체에서 추출 시도
        if (!mappingId && request.mapping) {
          if (typeof request.mapping === 'object') {
            mappingId = request.mapping.id || request.mapping.mappingId;
          } else if (typeof request.mapping === 'number') {
            mappingId = request.mapping;
          }
        }
        
        if (mappingId) {
          completedRequestMappingIds.add(Number(mappingId)); // 숫자로 변환하여 비교
          console.log('✅ 완료된 요청 매핑 ID 추가:', mappingId, '요청 ID:', request.id);
        } else {
          console.warn('⚠️ 완료된 요청에 매핑 ID가 없음:', request);
        }
      }
    });
    
    console.log('🔍 완료된 세션 추가 요청 매핑 ID:', Array.from(completedRequestMappingIds));
    console.log('📋 전체 매핑 수:', mappings.length);
    console.log('📋 세션 추가 요청 수:', sessionExtensionRequests.length);
    
    return mappings
      .filter((mapping, index, self) => {
        // 중복 제거: id 기준으로 첫 번째 항목만 유지 (먼저 중복 제거)
        return index === self.findIndex(m => m.id === mapping.id);
      })
      .filter(mapping => {
        // 세션 추가 요청이 완료된 매핑은 제외 (숫자 ID로 비교)
        const mappingIdNum = Number(mapping.id);
        const mappingIdStr = String(mapping.id);
        
        // 숫자 ID로 직접 비교
        if (completedRequestMappingIds.has(mappingIdNum)) {
          console.log('❌ 제외됨 (세션 추가 완료 - 숫자 ID):', mapping.id, '매핑:', mapping);
          return false;
        }
        
        // 문자열 ID로도 비교 (타입 불일치 대비)
        const hasCompletedRequest = Array.from(completedRequestMappingIds).some(id => 
          String(id) === mappingIdStr || Number(id) === mappingIdNum
        );
        if (hasCompletedRequest) {
          console.log('❌ 제외됨 (세션 추가 완료 - 문자열 ID):', mapping.id, '매핑:', mapping);
          return false;
        }
        
        const isActive = mapping.status === 'ACTIVE' || 
                        mapping.status === 'PENDING_PAYMENT' || 
                        mapping.status === 'PAYMENT_CONFIRMED' ||
                        mapping.status === 'DEPOSIT_PENDING' ||
                        mapping.status === 'ACTIVE_PENDING';
        
        if (!isActive) {
          return false;
        }
        
        // 세션이 충분히 있는 매핑도 제외 (회기 추가가 필요 없는 경우)
        const info = getMappingInfo(mapping);
        // remainingSessions이 충분하면(예: 10회 이상) 리스트에서 제외할 수도 있지만,
        // 사용자가 명시적으로 제외하라고 하지 않았으므로 일단 유지
        
        return true;
      })
      .sort((a, b) => {
        // 최신순으로 정렬 (updatedAt 또는 createdAt 기준)
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
      });
  }, [mappings, sessionExtensionRequests]);

  // 달력 뷰용 markedDates (스케줄 표시)
  // 선택된 상담사의 스케줄 데이터만 저장
  const [allSessionsForCalendar, setAllSessionsForCalendar] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState(null);

  // 스케줄 폼용 markedDates (날짜/시간 입력 모달)
  const scheduleFormMarkedDates = useMemo(() => {
    const marked = {};
    const today = new Date().toISOString().split('T')[0];
    
    // 스케줄 생성 모달에서는 selectedMapping의 상담사 ID를 우선 사용
    const consultantIdForModal = selectedMapping?.consultantId || selectedConsultantId;
    
    // 선택된 상담사의 색상 가져오기
    const selectedConsultant = consultants.find(c => 
      c.id === Number(consultantIdForModal) || c.id === consultantIdForModal || 
      c.id?.toString() === consultantIdForModal?.toString()
    );
    const dotColor = selectedConsultant && selectedConsultant.gradeColor
      ? selectedConsultant.gradeColor
      : consultantIdForModal
      ? getConsultantColor(consultantIdForModal, consultants)
      : COLORS.primary;

    // allSessionsForCalendar 데이터를 기반으로 날짜별 상담 개수 카운트
    // 스케줄 생성 모달에서는 선택된 매핑의 상담사와 일치하는 스케줄만 표시
    const dateCountMap = {};
    if (Array.isArray(allSessionsForCalendar)) {
      allSessionsForCalendar.forEach(session => {
        // 상담사 필터링 (모달에서는 선택된 매핑의 상담사만)
        if (consultantIdForModal && consultantIdForModal !== '' && consultantIdForModal !== 'all') {
          const sessionConsultantId = session.consultantId;
          const consultantMatch = sessionConsultantId === Number(consultantIdForModal) || 
                                 sessionConsultantId === consultantIdForModal ||
                                 String(sessionConsultantId) === String(consultantIdForModal);
          if (!consultantMatch) {
            return; // 상담사가 일치하지 않으면 건너뛰기
          }
        }
        
        const dateStr = session.dateString; // 이미 정규화된 dateString 사용
        if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          if (!dateCountMap[dateStr]) {
            dateCountMap[dateStr] = 0;
          }
          dateCountMap[dateStr]++;
        }
      });
    }

    // 날짜별로 dots 생성 (상담 개수만큼 점 추가, 최대 3개)
    Object.entries(dateCountMap).forEach(([dateKey, count]) => {
      if (count > 0 && dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        const dotCount = Math.min(count, 3);
        marked[dateKey] = {
          marked: true,
          dots: [],
        };
        for (let i = 0; i < dotCount; i++) {
          marked[dateKey].dots.push({ color: dotColor });
        }
      }
    });

    // scheduleForm.date가 선택되어 있으면 해당 날짜를 강조
    if (scheduleForm.date) {
      marked[scheduleForm.date] = {
        ...(marked[scheduleForm.date] || { dots: [] }), // 기존 마커가 있으면 유지
        selected: true,
        selectedColor: COLORS.primary,
        selectedTextColor: COLORS.white,
      };
    }
    
    // 오늘 날짜 표시 (선택되지 않았을 때만)
    if (!marked[today] && !scheduleForm.date) {
      marked[today] = { selected: true, selectedColor: COLORS.primaryLight, selectedTextColor: COLORS.white };
    }

    return marked;
  }, [allSessionsForCalendar, scheduleForm.date, selectedConsultantId, selectedMapping, consultants]);

  // 달력용 스케줄 로드 (선택된 상담사 필터 적용)
  // consultantId 파라미터가 있으면 해당 상담사만, 없으면 selectedConsultantId 사용
  const loadAllSessionsForCalendar = useCallback(async (consultantId = null) => {
    if (!user?.id) {
      setCalendarError('사용자 ID가 없어서 스케줄을 로드할 수 없습니다.');
      return;
    }

    try {
      setCalendarLoading(true);
      setCalendarError(null);
      // 파라미터로 전달된 상담사 ID 우선 사용, 없으면 selectedConsultantId 사용
      const targetConsultantId = consultantId || selectedConsultantId;
      let url = SCHEDULE_API.SCHEDULES_ADMIN;
      if (targetConsultantId && targetConsultantId !== '' && targetConsultantId !== 'all') {
        url += `?consultantId=${targetConsultantId}`;
        console.log('📅 선택된 상담사로 스케줄 로드:', targetConsultantId);
      } else {
        console.log('📅 모든 상담사의 스케줄 로드');
      }
      
      console.log('📅 API 호출 URL:', url);
      const response = await apiGet(url);
      
      console.log('📅 달력용 스케줄 API 응답 전체:', JSON.stringify(response, null, 2));
      
      let sessionsData = [];
      
      // 다양한 응답 형식 처리
      if (Array.isArray(response)) {
        // 응답이 배열로 직접 오는 경우
        sessionsData = response;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          sessionsData = response.data;
        } else if (response.data?.schedules && Array.isArray(response.data.schedules)) {
          sessionsData = response.data.schedules;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          sessionsData = response.data.data;
        }
      } else if (response?.success === false) {
        console.error('❌ API 응답 실패:', response?.message);
        setAllSessionsForCalendar([]);
        return;
      }
      
      console.log('📅 파싱된 스케줄 데이터:', sessionsData.length, '개');
      if (sessionsData.length > 0) {
        console.log('📅 첫 번째 스케줄 샘플:', JSON.stringify(sessionsData[0], null, 2));
        console.log('📅 첫 번째 스케줄 날짜:', sessionsData[0].date, typeof sessionsData[0].date);
        console.log('📅 첫 번째 스케줄 상담사 ID:', sessionsData[0].consultantId);
        
        // 날짜별로 그룹화해서 확인 (실제 날짜 형식 확인)
        const dateGroups = {};
        sessionsData.forEach(s => {
          let dateKey = '날짜없음';
          if (s.date) {
            if (typeof s.date === 'string') {
              dateKey = s.date.split('T')[0];
            } else if (s.date && typeof s.date === 'object' && s.date.year !== undefined) {
              // LocalDate 객체
              const month = s.date.month >= 0 && s.date.month < 12 ? s.date.month + 1 : s.date.month;
              dateKey = `${s.date.year}-${String(month).padStart(2, '0')}-${String(s.date.day).padStart(2, '0')}`;
            }
          }
          dateGroups[dateKey] = (dateGroups[dateKey] || 0) + 1;
        });
        
        // 날짜 형식 디버깅 정보 저장
        if (sessionsData.length > 0) {
          const firstDate = sessionsData[0].date;
          console.log('🔍 첫 번째 스케줄 날짜 상세 분석:', {
            date: firstDate,
            type: typeof firstDate,
            isObject: typeof firstDate === 'object',
            isDate: firstDate instanceof Date,
            keys: firstDate && typeof firstDate === 'object' ? Object.keys(firstDate) : null,
            stringified: JSON.stringify(firstDate),
          });
        }
      } else {
        console.warn('⚠️ 스케줄 데이터가 비어있습니다! 응답:', response);
      }

      // 날짜 정규화 함수 (YYYY-MM-DD 형식으로 변환)
      const normalizeDate = (dateValue) => {
        if (!dateValue) return null;
        
        // 이미 문자열이고 YYYY-MM-DD 형식인 경우
        if (typeof dateValue === 'string') {
          const dateStr = dateValue.split('T')[0];
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
          }
          // 다른 문자열 형식 시도
          try {
            const parsed = new Date(dateValue);
            if (!isNaN(parsed.getTime())) {
              return parsed.toISOString().split('T')[0];
            }
          } catch (e) {
            // 파싱 실패
          }
          return null;
        }
        
        // Date 객체인 경우
        if (dateValue instanceof Date) {
          if (!isNaN(dateValue.getTime())) {
            return dateValue.toISOString().split('T')[0];
          }
          return null;
        }
        
        // 객체 형태인 경우 (LocalDate)
        if (dateValue && typeof dateValue === 'object') {
          // {year, month, day} 또는 {year, monthValue, dayOfMonth}
          let year, month, day;
          
          if (dateValue.year !== undefined) {
            year = Number(dateValue.year);
            month = Number(dateValue.month !== undefined ? dateValue.month : dateValue.monthValue);
            day = Number(dateValue.day !== undefined ? dateValue.day : dateValue.dayOfMonth);
            
            // 유효성 검사
            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
              // month가 0-11 범위면 1-based로 변환 (0=1월, 11=12월)
              if (month >= 0 && month <= 11) {
                month = month + 1;
              }
              // 범위 제한
              if (month < 1) month = 1;
              if (month > 12) month = 12;
              if (day < 1) day = 1;
              if (day > 31) day = 31;
              
              const monthStr = String(month).padStart(2, '0');
              const dayStr = String(day).padStart(2, '0');
              return `${year}-${monthStr}-${dayStr}`;
            }
          }
          
          // toString() 메서드 시도
          if (dateValue.toString && typeof dateValue.toString === 'function') {
            try {
              const str = dateValue.toString();
              if (str && typeof str === 'string') {
                const dateStr = str.split('T')[0];
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                  return dateStr;
                }
              }
            } catch (e) {
              // toString 실패
            }
          }
        }
        
        return null;
      };

      // 상담사 및 클라이언트 이름 매핑 + 날짜 정규화
      if (consultants.length > 0 && clients.length > 0) {
        sessionsData = sessionsData.map(session => {
          const consultant = consultants.find(c => c.id === session.consultantId);
          const client = clients.find(c => c.id === session.clientId);
          
          // 날짜 정규화
          const normalizedDate = normalizeDate(session.date);
          
          if (!normalizedDate) {
            console.warn('⚠️ 날짜 정규화 실패:', session.date, typeof session.date);
          }
          
          return {
            ...session,
            date: normalizedDate || session.date, // 정규화 실패 시 원본 유지
            dateString: normalizedDate, // 정규화된 날짜를 별도로 저장
            consultantName: consultant?.name || session.consultantName || '',
            clientName: client?.name || session.clientName || '',
          };
        });
      } else {
        // consultants/clients가 없으면 API로 로드
        try {
          const usersResponse = await apiGet(ADMIN_API.GET_ALL_USERS);
          const allUsers = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
          const consultantsData = allUsers.filter(u => u.role === 'CONSULTANT');
          const clientsData = allUsers.filter(u => u.role === 'CLIENT');
          
          sessionsData = sessionsData.map(session => {
            const consultant = consultantsData.find(c => c.id === session.consultantId);
            const client = clientsData.find(c => c.id === session.clientId);
            
            // 날짜 정규화
            const normalizedDate = normalizeDate(session.date);
            
            if (!normalizedDate) {
              console.warn('⚠️ 날짜 정규화 실패:', session.date, typeof session.date);
            }
            
            return {
              ...session,
              date: normalizedDate || session.date, // 정규화 실패 시 원본 유지
              dateString: normalizedDate, // 정규화된 날짜를 별도로 저장
              consultantName: consultant?.name || session.consultantName || '',
              clientName: client?.name || session.clientName || '',
            };
          });
        } catch (error) {
          console.warn('사용자 목록 로드 실패 (달력용):', error);
        }
      }
      
      // 날짜 정규화 결과 확인
      const normalizedCount = sessionsData.filter(s => s.dateString).length;
      const failedCount = sessionsData.length - normalizedCount;
      if (failedCount > 0) {
        console.warn(`⚠️ 날짜 정규화 실패: ${failedCount}개 / 전체 ${sessionsData.length}개`);
        const firstFailed = sessionsData.find(s => !s.dateString);
        if (firstFailed) {
          console.warn('⚠️ 첫 번째 실패 샘플:', JSON.stringify(firstFailed.date), typeof firstFailed.date);
        }
      }
      console.log(`📅 날짜 정규화 완료: ${normalizedCount}개 성공, ${failedCount}개 실패`);

      console.log('📅 최종 저장될 스케줄 데이터:', sessionsData.length, '개');
      setAllSessionsForCalendar(sessionsData);
      setCalendarError(null);
    } catch (error) {
      console.error('❌ 달력용 스케줄 로드 실패:', error);
      const errorMessage = error.message || '알 수 없는 오류';
      setCalendarError(`스케줄 로드 실패: ${errorMessage}`);
      NotificationService.error('스케줄 데이터를 불러오는데 실패했습니다: ' + errorMessage);
      setAllSessionsForCalendar([]);
    } finally {
      setCalendarLoading(false);
    }
  }, [user?.id, selectedConsultantId, consultants, clients]);

  // 달력 표시용 마커 생성 (세션 관리/달력 뷰용 - 모든 상담사의 스케줄 표시)
  const calendarMarkedDates = useMemo(() => {
    const marked = {};
    const today = new Date().toISOString().split('T')[0];
    
    // 내일 날짜 계산 (전체에서 한 번만)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // allSessionsForCalendar가 배열인지 확인
    if (!Array.isArray(allSessionsForCalendar)) {
      console.warn('⚠️ allSessionsForCalendar가 배열이 아닙니다:', typeof allSessionsForCalendar, allSessionsForCalendar);
      return marked;
    }
    
    console.log('📅 달력 마커 생성 시작 - 전체 스케줄 수:', allSessionsForCalendar.length);
    console.log('📅 오늘:', today, '내일:', tomorrowStr);
    
    // 세션 관리/달력 뷰에서는 모든 상담사의 스케줄 표시 (필터링 제거)
    const filteredSessions = allSessionsForCalendar;
    
    console.log('📅 모든 상담사 스케줄 사용:', filteredSessions.length, '개');
    
    // 내일 날짜의 스케줄 확인
    const tomorrowSessions = filteredSessions.filter(s => {
      if (!s.date) return false;
      let sessionDateStr = '';
      if (typeof s.date === 'string') {
        sessionDateStr = s.date.split('T')[0];
      } else if (s.date && typeof s.date === 'object' && s.date.year && s.date.month !== undefined && s.date.day !== undefined) {
        const month = String(s.date.month).padStart(2, '0');
        const day = String(s.date.day).padStart(2, '0');
        sessionDateStr = `${s.date.year}-${month}-${day}`;
      }
      return sessionDateStr === tomorrowStr;
    });
    console.log(`📅 내일(${tomorrowStr}) 스케줄: ${tomorrowSessions.length}개`, tomorrowSessions.map(s => ({ id: s.id, date: s.date, consultantId: s.consultantId })));
    
    // 날짜별로 상담 개수 카운트 (모든 상담사)
    // 날짜별로 상담사별 스케줄을 그룹화하여 각 상담사 색상으로 표시
    const dateConsultantMap = {}; // { dateKey: { consultantId: count } }
    let parseFailCount = 0;
    const parseFailSamples = [];
    
    filteredSessions.forEach((session, index) => {
      // 먼저 dateString (정규화된 날짜) 사용, 없으면 date 파싱
      let dateStr = session.dateString;
      
      // 디버깅: 첫 번째 스케줄만 상세 로그
      if (index === 0 && filteredSessions.length > 0) {
        console.log('📅 첫 번째 스케줄 상세:', {
          id: session.id,
          dateString: session.dateString,
          date: session.date,
          dateType: typeof session.date,
          consultantId: session.consultantId,
        });
      }
      
      // dateString이 없으면 date에서 파싱 시도
      if (!dateStr && session.date) {
        try {
          if (typeof session.date === 'string') {
            // ISO 형식 (2025-11-03T00:00:00) 또는 날짜만 (2025-11-03)
            dateStr = session.date.split('T')[0];
          } else if (session.date instanceof Date) {
            // Date 객체인 경우
            if (!isNaN(session.date.getTime())) {
              dateStr = session.date.toISOString().split('T')[0];
            }
          } else if (session.date && typeof session.date === 'object') {
            // LocalDate 객체가 직접 전달된 경우
            if (session.date.year !== undefined) {
              const year = Number(session.date.year);
              let month = Number(session.date.month !== undefined ? session.date.month : session.date.monthValue);
              const day = Number(session.date.day !== undefined ? session.date.day : session.date.dayOfMonth);
              
              if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                // month가 0-11 범위면 1-based로 변환
                if (month >= 0 && month <= 11) {
                  month = month + 1;
                }
                // 범위 제한
                if (month < 1) month = 1;
                if (month > 12) month = 12;
                if (day < 1) day = 1;
                if (day > 31) day = 31;
                
                const monthStr = String(month).padStart(2, '0');
                const dayStr = String(day).padStart(2, '0');
                dateStr = `${year}-${monthStr}-${dayStr}`;
              }
            } else if (session.date.toString && typeof session.date.toString === 'function') {
              try {
                const str = session.date.toString();
                if (str && typeof str === 'string') {
                  dateStr = str.split('T')[0];
                }
              } catch (e) {
                // toString 실패
              }
            }
          }
        } catch (error) {
          // 파싱 실패
        }
      }
      
      // 날짜 유효성 검사
      if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        parseFailCount++;
        if (parseFailSamples.length < 3) {
          parseFailSamples.push({ 
            index, 
            reason: dateStr ? '날짜 형식 오류' : '날짜 없음', 
            date: session.date,
            dateString: session.dateString,
            dateType: typeof session.date,
            parsed: dateStr 
          });
        }
        return;
      }
      
      // 날짜별로 상담사별 스케줄 그룹화
      if (!dateConsultantMap[dateStr]) {
        dateConsultantMap[dateStr] = {};
      }
      const consultantId = session.consultantId;
      if (!dateConsultantMap[dateStr][consultantId]) {
        dateConsultantMap[dateStr][consultantId] = 0;
      }
      dateConsultantMap[dateStr][consultantId]++;
    });
    
    // 파싱 실패한 경우 알림
    if (parseFailCount > 0 && Object.keys(dateConsultantMap).length === 0) {
      NotificationService.error(
        `날짜 파싱 실패: ${parseFailCount}개 스케줄의 날짜를 파싱할 수 없습니다. ` +
        `샘플: ${JSON.stringify(parseFailSamples[0]?.date || 'N/A')}`
      );
    }
    
    console.log('📅 날짜별 상담사별 스케줄:', Object.keys(dateConsultantMap).length, '개 날짜');
    
    // 날짜별로 dots 생성 (각 상담사별 색상으로 점 표시, 최대 3개)
    Object.entries(dateConsultantMap).forEach(([dateKey, consultantMap]) => {
      if (dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        const consultantIds = Object.keys(consultantMap);
        const dotCount = Math.min(consultantIds.length, 3); // 최대 3개 상담사까지 표시
        
        // 각 상담사별 색상으로 점 생성
        const dots = [];
        for (let i = 0; i < dotCount; i++) {
          const consultantId = consultantIds[i];
          const consultant = consultants.find(c => 
            c.id === Number(consultantId) || c.id === consultantId || 
            c.id?.toString() === consultantId?.toString()
          );
          const dotColor = consultant && consultant.gradeColor
            ? consultant.gradeColor
            : getConsultantColor(consultantId, consultants);
          
          dots.push({ 
            color: dotColor,
            selectedDotColor: COLORS.white,
          });
        }
        
        // multi-dot 형식에 맞게 설정
        marked[dateKey] = {
          marked: true,
          dots: dots,
          selected: false,
        };
        
        console.log(`📅 마커 생성: ${dateKey} - ${dotCount}개 점 (${consultantIds.length}개 상담사)`);
      }
    });
    
    // 내일 날짜 확인
    if (marked[tomorrowStr]) {
      console.log(`✅ 최종 확인 - 내일(${tomorrowStr}) 마커 존재:`, marked[tomorrowStr]);
    } else {
      const tomorrowHasData = dateConsultantMap[tomorrowStr] ? Object.keys(dateConsultantMap[tomorrowStr]).length : 0;
      console.warn(`⚠️ 최종 확인 - 내일(${tomorrowStr}) 마커 없음! 상담사 수: ${tomorrowHasData}`);
    }
    
    console.log('📅 생성된 마커 날짜 수:', Object.keys(marked).length);
    if (Object.keys(marked).length > 0) {
      console.log('📅 마커 샘플 (첫 5개):', Object.keys(marked).slice(0, 5).map(dateKey => ({
        date: dateKey,
        dots: marked[dateKey].dots.length,
        colors: marked[dateKey].dots.map(d => d.color),
        marked: marked[dateKey].marked
      })));
      console.log('📅 마커 전체 데이터 (첫 3개):', JSON.stringify(
        Object.fromEntries(Object.entries(marked).slice(0, 3)),
        null, 2
      ));
    } else {
      // dateConsultantMap이 비어있는 경우는 정상일 수 있음 (스케줄이 없을 때)
      // 하지만 데이터가 있는데 파싱이 실패한 경우에만 경고
      if (filteredSessions.length > 0 && parseFailCount === filteredSessions.length) {
        console.warn('⚠️ 모든 스케줄의 날짜 파싱 실패:', parseFailSamples);
      } else if (filteredSessions.length === 0) {
        // 데이터가 없으면 정상 (오류 아님)
        console.log('📅 표시할 스케줄이 없습니다.');
      }
    }
    
    // 오늘 날짜 표시
    if (!marked[today]) {
      marked[today] = { dots: [] };
    }
    marked[today].marked = true;
    marked[today].selectedColor = COLORS.primaryLight;
    
    return marked;
  }, [allSessionsForCalendar, consultants]);

  // 달력 뷰일 때 전체 스케줄 로드 (모든 상담사 데이터)
  useEffect(() => {
    console.log('📅 달력 뷰 useEffect - mainTab:', mainTab, 'viewMode:', viewMode);
    if (mainTab === 'sessions' && viewMode === 'calendar') {
      console.log('📅 달력용 스케줄 로드 시작 (모든 상담사)');
      // 세션 관리/달력 뷰에서는 모든 상담사 데이터 로드 (파라미터 없이)
      loadAllSessionsForCalendar();
    }
  }, [mainTab, viewMode, loadAllSessionsForCalendar]);

  // 스케줄 생성 모달이 열릴 때 해당 상담사의 스케줄 로드 (필요시)
  // handleSelectMapping에서 이미 로드하므로 여기서는 제거

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSessions();
  }, [loadSessions]);

  // 필터링된 세션 목록 (최신순 정렬)
  const filteredSessions = useMemo(() => {
    const filtered = sessions.filter(session => {
      if (statusFilter === 'ALL') return true;
      return session.status === statusFilter;
    });
    
    // 최신순 정렬: id가 큰 순서대로 (최신 등록된 것 먼저)
    // id가 없으면 date + startTime 조합으로 정렬
    return filtered.sort((a, b) => {
      // id가 있으면 id로 정렬 (큰 값이 최신)
      if (a.id && b.id) {
        return b.id - a.id;
      }
      
      // id가 없으면 날짜와 시간으로 정렬
      const dateA = a.date ? new Date(a.date + ' ' + (a.startTime || '00:00')).getTime() : 0;
      const dateB = b.date ? new Date(b.date + ' ' + (b.startTime || '00:00')).getTime() : 0;
      return dateB - dateA; // 최신순 (내림차순)
    });
  }, [sessions, statusFilter]);
  
  // 날짜 클릭 핸들러 (최신순 정렬) - 달력에서는 전체 스케줄 사용
  const handleDayPress = (day) => {
    const selectedDate = day.dateString;
    // 달력 뷰에서는 필터 무시하고 모든 스케줄 사용
    const schedulesToUse = viewMode === 'calendar' ? allSessionsForCalendar : sessions;
    const dateSchedules = schedulesToUse
      .filter(s => {
        const sessionDate = s.date ? s.date.split('T')[0] : '';
        return sessionDate === selectedDate;
      })
      .map(schedule => {
        // 상담사/내담자 이름 매핑 추가
        const consultant = consultants.find(c => c.id === schedule.consultantId);
        const client = clients.find(c => c.id === schedule.clientId);
        return {
          ...schedule,
          consultantName: consultant?.name || schedule.consultantName,
          clientName: client?.name || schedule.clientName,
        };
      })
      .sort((a, b) => {
        // id가 있으면 id로 정렬 (큰 값이 최신)
        if (a.id && b.id) {
          return b.id - a.id;
        }
        // id가 없으면 시간으로 정렬 (최신순)
        const timeA = a.startTime || '00:00';
        const timeB = b.startTime || '00:00';
        return timeB.localeCompare(timeA);
      });
    
    console.log('📅 날짜 클릭 - 선택된 날짜:', selectedDate);
    console.log('📅 해당 날짜의 스케줄:', dateSchedules);
    
    setSelectedCalendarDate(selectedDate);
    setSelectedDateSchedules(dateSchedules);
    setShowDateZoomModal(true);
  };
  
  // 날짜 줌인 모달에서 일정 추가
  const handleAddScheduleFromCalendar = () => {
    setShowDateZoomModal(false);
    handleOpenMappingModal();
    // 선택된 날짜를 폼에 설정
    if (selectedCalendarDate) {
      setScheduleForm(prev => ({ ...prev, date: selectedCalendarDate }));
    }
  };
  
  // 스케줄 상세 모달 열기
  const handleOpenScheduleDetail = (schedule) => {
    console.log('📋 상세 보기 클릭 - 원본 스케줄 데이터:', schedule);
    console.log('📋 상세 보기 - consultants 길이:', consultants.length);
    console.log('📋 상세 보기 - clients 길이:', clients.length);
    
    if (!schedule) {
      console.error('⚠️ handleOpenScheduleDetail: schedule이 없습니다.');
      return;
    }
    
    // 상담사/내담자 이름 매핑 추가
    let enrichedSchedule = { ...schedule };
    
    // 이미 로드된 consultants와 clients를 사용하여 이름 매핑
    const consultant = consultants.find(c => c.id === schedule.consultantId);
    const client = clients.find(c => c.id === schedule.clientId);
    
    enrichedSchedule = {
      ...schedule,
      consultantName: consultant?.name || schedule.consultantName || '',
      clientName: client?.name || schedule.clientName || '',
    };
    
    console.log('📋 상세 보기 - 보강된 스케줄 데이터:', enrichedSchedule);
    console.log('📋 상세 보기 - consultantName:', enrichedSchedule.consultantName);
    console.log('📋 상세 보기 - clientName:', enrichedSchedule.clientName);
    console.log('📋 상세 보기 - date:', enrichedSchedule.date);
    console.log('📋 상세 보기 - startTime:', enrichedSchedule.startTime);
    console.log('📋 상세 보기 - endTime:', enrichedSchedule.endTime);
    
    setSelectedSchedule(enrichedSchedule);
    setShowScheduleDetailModal(true);
    console.log('📋 상세 보기 - 모달 열기 완료');
  };
  
  // 스케줄 상태 변경
  const handleScheduleStatusChange = async (scheduleId, newStatus) => {
    try {
      setIsUpdatingScheduleStatus(true);
      const response = await apiPut(SCHEDULE_API.SCHEDULE_UPDATE(scheduleId), { status: newStatus });
      
      if (response?.success) {
        NotificationService.success(`스케줄 상태가 ${getStatusDisplayInfo(newStatus).text}로 변경되었습니다.`);
        // 로컬 상태 업데이트
        setSessions(prev => prev.map(session =>
          session.id === scheduleId ? { ...session, status: newStatus } : session
        ));
        setSelectedSchedule(prev => prev ? { ...prev, status: newStatus } : null);
        // 모달 닫기
        setShowScheduleDetailModal(false);
      } else {
        throw new Error(response?.message || '스케줄 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('스케줄 상태 변경 실패:', error);
      NotificationService.error(error.message || '스케줄 상태 변경에 실패했습니다.');
    } finally {
      setIsUpdatingScheduleStatus(false);
    }
  };

  // 세션 상태 업데이트
  const updateSessionStatus = async (sessionId, newStatus) => {
    try {
      const response = await apiPut(SCHEDULE_API.SCHEDULE_UPDATE(sessionId), { status: newStatus });

      if (response?.success) {
        // 로컬 상태 업데이트
        setSessions(prev => prev.map(session =>
          session.id === sessionId ? { ...session, status: newStatus } : session
        ));
      } else {
        throw new Error(STRINGS.ERROR.UPDATE_FAILED || '세션 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('세션 상태 변경 실패:', error);
    }
  };

  // 상태별 통계 계산
  const getStatusStats = () => {
    const stats = {
      total: sessions.length,
      scheduled: sessions.filter(s => s.status === 'SCHEDULED').length,
      completed: sessions.filter(s => s.status === 'COMPLETED').length,
      cancelled: sessions.filter(s => s.status === 'CANCELLED').length,
      pending: sessions.filter(s => s.status === 'PENDING').length,
    };
    return stats;
  };

  // 스케줄 상태 옵션 로드 (웹 버전과 동일한 방식)
  const loadScheduleStatusOptions = useCallback(async () => {
    try {
      setLoadingStatusOptions(true);
      const response = await apiGet(COMMON_CODE_API.GET_STATUS_OPTIONS);
      
      if (response && Array.isArray(response) && response.length > 0) {
        // 웹과 동일하게 필요한 상태만 필터링 (선택사항)
        const allowedStatuses = ['SCHEDULED', 'BOOKED', 'COMPLETED', 'CANCELLED', 'PENDING', 'CONFIRMED', 'AVAILABLE', 'VACATION'];
        const filteredResponse = response.filter(code => allowedStatuses.includes(code.codeValue));
        
        const statusOptions = filteredResponse.map(code => ({
          value: code.codeValue,
          label: code.codeLabel || code.koreanName || code.codeValue,
          color: code.colorCode,
          icon: code.icon,
        }));
        
        console.log('📋 스케줄 상태 옵션 로드 완료:', statusOptions);
        setScheduleStatusOptions(statusOptions);
      } else {
        console.warn('📋 스케줄 상태 코드 데이터가 없습니다:', response);
        // 기본값 설정
        setScheduleStatusOptions([
          { value: 'SCHEDULED', label: '예정', color: null, icon: null },
          { value: 'BOOKED', label: '예약됨', color: null, icon: null },
          { value: 'COMPLETED', label: '완료', color: null, icon: null },
          { value: 'CANCELLED', label: '취소', color: null, icon: null },
          { value: 'PENDING', label: '대기', color: null, icon: null },
        ]);
      }
    } catch (error) {
      console.error('스케줄 상태 코드 로드 실패:', error);
      // 실패 시 기본값 설정
      setScheduleStatusOptions([
        { value: 'SCHEDULED', label: '예정', color: null, icon: null },
        { value: 'BOOKED', label: '예약됨', color: null, icon: null },
        { value: 'COMPLETED', label: '완료', color: null, icon: null },
        { value: 'CANCELLED', label: '취소', color: null, icon: null },
        { value: 'PENDING', label: '대기', color: null, icon: null },
      ]);
    } finally {
      setLoadingStatusOptions(false);
    }
  }, []);

  // 상태 표시 정보 (동적 로드된 옵션 사용)
  const getStatusDisplayInfo = (status) => {
    // 동적으로 로드된 상태 옵션에서 찾기
    if (scheduleStatusOptions.length > 0) {
      const statusOption = scheduleStatusOptions.find(option => option.value === status);
      if (statusOption) {
        // 색상 결정
        let color = COLORS.gray500;
        let bgColor = COLORS.gray100;
        let icon = Clock;
        
        // 상태별 기본 색상 및 아이콘 매핑
        if (status === 'SCHEDULED' || status === 'BOOKED' || status === 'CONFIRMED') {
          color = COLORS.primary;
          bgColor = COLORS.primaryLight;
          icon = CalendarIcon;
        } else if (status === 'COMPLETED') {
          color = COLORS.success;
          bgColor = COLORS.successLight;
          icon = CheckCircle;
        } else if (status === 'CANCELLED') {
          color = COLORS.error;
          bgColor = COLORS.errorLight;
          icon = XCircle;
        } else if (status === 'PENDING') {
          color = COLORS.warning;
          bgColor = COLORS.warningLight;
          icon = AlertTriangle;
        }
        
        return {
          text: statusOption.label,
          color: statusOption.color || color,
          bgColor: bgColor,
          icon: icon,
        };
      }
    }
    
    // 동적 로드 실패 시 기본값 사용
    switch (status) {
      case 'SCHEDULED':
        return {
          text: STRINGS.SCHEDULE.STATUS.SCHEDULED || '예정',
          color: COLORS.primary,
          bgColor: COLORS.primaryLight,
          icon: CalendarIcon,
        };
      case 'BOOKED':
        return {
          text: STRINGS.SCHEDULE.STATUS.BOOKED || '예약됨',
          color: COLORS.primary,
          bgColor: COLORS.primaryLight,
          icon: CalendarIcon,
        };
      case 'COMPLETED':
        return {
          text: STRINGS.SCHEDULE.STATUS.COMPLETED || '완료',
          color: COLORS.success,
          bgColor: COLORS.successLight,
          icon: CheckCircle,
        };
      case 'CANCELLED':
        return {
          text: STRINGS.SCHEDULE.STATUS.CANCELLED || '취소',
          color: COLORS.error,
          bgColor: COLORS.errorLight,
          icon: XCircle,
        };
      case 'PENDING':
        return {
          text: STRINGS.SESSION.PENDING || '대기',
          color: COLORS.warning,
          bgColor: COLORS.warningLight,
          icon: AlertTriangle,
        };
      default:
        return {
          text: status || '알 수 없음',
          color: COLORS.gray500,
          bgColor: COLORS.gray100,
          icon: Clock,
        };
    }
  };

  // 날짜 포맷
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  // 시간 포맷
  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      if (timeString.includes('T')) {
        return timeString.split('T')[1]?.slice(0, 5);
      }
      return timeString;
    } catch (error) {
      return timeString;
    }
  };

  // 종료 시간 자동 계산 (시작 시간 + 상담 시간)
  const calculateEndTime = (startTime, duration) => {
    if (!startTime || !duration) return '';
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + duration;
    return minutesToTime(endMinutes);
  };

  // 시간 슬롯이 충돌하는지 확인 (같은 상담사, 같은 날짜의 기존 스케줄)
  const isTimeSlotConflict = (timeSlot) => {
    if (!selectedMapping || !scheduleForm.date) {
      return false;
    }

    const endTime = calculateEndTime(timeSlot, scheduleForm.duration);
    return checkTimeConflict(
      selectedMapping.consultantId,
      scheduleForm.date,
      timeSlot,
      endTime
    );
  };

  // 시작 시간 선택 시 종료 시간 자동 계산 및 충돌 검사
  const handleStartTimeSelect = (startTime) => {
    if (!selectedMapping || !scheduleForm.date) {
      NotificationService.error('매칭과 날짜를 먼저 선택해주세요.');
      return;
    }

    // 충돌 검사
    const endTime = calculateEndTime(startTime, scheduleForm.duration);
    const hasConflict = checkTimeConflict(
      selectedMapping.consultantId,
      scheduleForm.date,
      startTime,
      endTime
    );

    if (hasConflict) {
      NotificationService.error('해당 시간대에 이미 스케줄이 존재합니다. 다른 시간을 선택해주세요.');
      return;
    }

    setScheduleForm(prev => ({
      ...prev,
      startTime,
      endTime,
    }));
  };

  // 상담 시간 선택 시 종료 시간 자동 계산 및 충돌 검사
  const handleDurationSelect = (duration) => {
    if (!scheduleForm.startTime) {
      setScheduleForm(prev => ({ ...prev, duration }));
      return;
    }

    const endTime = calculateEndTime(scheduleForm.startTime, duration);

    // 시작 시간이 있고 충돌이 있는 경우 알림
    if (selectedMapping && scheduleForm.date && scheduleForm.startTime) {
      const hasConflict = checkTimeConflict(
        selectedMapping.consultantId,
        scheduleForm.date,
        scheduleForm.startTime,
        endTime
      );

      if (hasConflict) {
        NotificationService.error('선택한 상담 시간으로 인해 해당 시간대에 스케줄이 이미 존재합니다. 다른 상담 시간을 선택해주세요.');
        return;
      }
    }

    setScheduleForm(prev => ({
      ...prev,
      duration,
      endTime,
    }));
  };

  // 30분 단위 시간 슬롯 생성 (9시부터 20시까지)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // 20시 이후는 제외
        if (hour === 20 && minute > 0) break;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const stats = getStatusStats();

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.ADMIN.SESSION_MANAGEMENT}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.ADMIN.SESSION_MANAGEMENT}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 메인 탭 네비게이션 */}
        <View style={styles.mainTabs}>
          <TouchableOpacity
            style={[styles.mainTab, mainTab === 'sessions' && styles.mainTabActive]}
            onPress={() => setMainTab('sessions')}
          >
            <CalendarIcon size={SIZES.ICON.SM} color={mainTab === 'sessions' ? COLORS.white : COLORS.mediumGray} />
            <Text style={[
              styles.mainTabText,
              mainTab === 'sessions' && styles.mainTabTextActive
            ]}>
              세션 관리
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mainTab, mainTab === 'requests' && styles.mainTabActive]}
            onPress={() => setMainTab('requests')}
          >
            <Package size={SIZES.ICON.SM} color={mainTab === 'requests' ? COLORS.white : COLORS.mediumGray} />
            <Text style={[
              styles.mainTabText,
              mainTab === 'requests' && styles.mainTabTextActive
            ]}>
              세션 추가 요청
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mainTab, mainTab === 'schedule' && styles.mainTabActive]}
            onPress={() => setMainTab('schedule')}
          >
            <Plus size={SIZES.ICON.SM} color={mainTab === 'schedule' ? COLORS.white : COLORS.mediumGray} />
            <Text style={[
              styles.mainTabText,
              mainTab === 'schedule' && styles.mainTabTextActive
            ]}>
              스케줄 추가
            </Text>
          </TouchableOpacity>
        </View>

        {/* 세션 관리 탭 */}
        {mainTab === 'sessions' && (
          <>
            {/* 통계 카드 - Presentational 컴포넌트 사용 */}
            <SessionStats stats={stats} />

            {/* 뷰 모드 전환 탭 */}
            <View style={styles.viewModeTabs}>
          <TouchableOpacity
            style={[styles.viewModeTab, viewMode === 'calendar' && styles.viewModeTabActive]}
            onPress={() => setViewMode('calendar')}
          >
            <CalendarIcon size={SIZES.ICON.SM} color={viewMode === 'calendar' ? COLORS.white : COLORS.mediumGray} />
            <Text style={[
              styles.viewModeTabText,
              viewMode === 'calendar' && styles.viewModeTabTextActive
            ]}>
              달력
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeTab, viewMode === 'list' && styles.viewModeTabActive]}
            onPress={() => setViewMode('list')}
          >
            <CalendarIcon size={SIZES.ICON.SM} color={viewMode === 'list' ? COLORS.white : COLORS.mediumGray} />
            <Text style={[
              styles.viewModeTabText,
              viewMode === 'list' && styles.viewModeTabTextActive
            ]}>
              목록
            </Text>
          </TouchableOpacity>
        </View>

        {/* 달력 뷰 */}
        {viewMode === 'calendar' && (
          <DashboardSection title="스케줄 달력" icon={<CalendarIcon size={SIZES.ICON.MD} color={COLORS.primary} />}>
            <ScheduleCalendarView
              markedDates={calendarMarkedDates}
              onDayPress={handleDayPress}
              currentMonth={currentMonth}
              onMonthChange={(month) => {
                setCurrentMonth(month.dateString);
                // 월 변경 시 해당 월의 데이터 다시 로드
                loadAllSessionsForCalendar();
              }}
              minDate={undefined}
            />
          </DashboardSection>
        )}

            {/* 상담사 필터 (관리자) */}
            <DashboardSection title="상담사 필터" icon={<Users size={SIZES.ICON.MD} color={COLORS.primary} />}>
              <ConsultantFilter
                consultants={consultants}
                selectedConsultantId={selectedConsultantId}
                onConsultantChange={(value) => setSelectedConsultantId(value)}
                loading={loadingConsultants}
              />
            </DashboardSection>

            {/* 상태 필터 - Presentational 컴포넌트 사용 */}
            <DashboardSection title={STRINGS.COMMON.FILTER} icon={<Search size={SIZES.ICON.MD} color={COLORS.primary} />}>
              <SessionFilters
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
              />
            </DashboardSection>

            {/* 세션 목록 */}
            {viewMode === 'list' && (
              <DashboardSection title={STRINGS.SESSION.SESSION_LIST || '세션 목록'} icon={<CalendarIcon size={SIZES.ICON.MD} color={COLORS.primary} />}>
                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <MGButton
                      variant="primary"
                      size="small"
                      onPress={loadSessions}
                      style={styles.retryButton}
                    >
                      <Text style={styles.retryButtonText}>{STRINGS.COMMON.RETRY}</Text>
                    </MGButton>
                  </View>
                ) : filteredSessions.length > 0 ? (
                  <View style={styles.sessionList}>
                    {filteredSessions.map((session) => {
                      const statusInfo = getStatusDisplayInfo(session.status);
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <View key={session.id} style={styles.sessionCard}>
                          <View style={styles.sessionHeader}>
                            <View style={styles.sessionInfo}>
                              <Text style={styles.sessionTitle}>
                                {session.title || `${session.consultantName || ''} - ${session.clientName || ''}` || '제목 없음'}
                              </Text>
                              <Text style={styles.sessionDate}>
                                {formatDate(session.date)} {formatTime(session.startTime)}
                              </Text>
                            </View>
                            <View style={styles.sessionStatus}>
                              <View style={[
                                styles.statusBadge,
                                (session.status === 'SCHEDULED' || session.status === 'BOOKED') && styles.statusBadgeScheduled,
                                session.status === 'COMPLETED' && styles.statusBadgeCompleted,
                                session.status === 'CANCELLED' && styles.statusBadgeCancelled,
                                session.status === 'PENDING' && styles.statusBadgePending,
                              ]}>
                                <StatusIcon size={SIZES.ICON.SM} color={statusInfo.color} strokeWidth={2} />
                                <Text style={[
                                  styles.statusText,
                                  (session.status === 'SCHEDULED' || session.status === 'BOOKED') && styles.statusTextScheduled,
                                  session.status === 'COMPLETED' && styles.statusTextCompleted,
                                  session.status === 'CANCELLED' && styles.statusTextCancelled,
                                  session.status === 'PENDING' && styles.statusTextPending,
                                ]}>
                                  {statusInfo.text}
                                </Text>
                              </View>
                            </View>
                          </View>
                          
                          <View style={styles.sessionDetails}>
                            {session.consultantName && (
                              <Text style={styles.sessionDetail}>
                                👤 상담사: {session.consultantName}
                              </Text>
                            )}
                            {session.clientName && (
                              <Text style={styles.sessionDetail}>
                                🤝 내담자: {session.clientName}
                              </Text>
                            )}
                            {session.description && (
                              <Text style={styles.sessionDetail} numberOfLines={2}>
                                📝 {session.description}
                              </Text>
                            )}
                          </View>
                          
                          <View style={styles.sessionActions}>
                            <MGButton
                              variant="outline"
                              size="small"
                              onPress={() => handleOpenScheduleDetail(session)}
                              style={styles.detailButton}
                            >
                              <Text style={styles.detailButtonText}>상세</Text>
                            </MGButton>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <CalendarIcon size={SIZES.ICON['2XL']} color={COLORS.gray400} />
                    <Text style={styles.emptyText}>등록된 세션이 없습니다.</Text>
                  </View>
                )}
              </DashboardSection>
            )}
          </>
        )}

        {/* 세션 추가 요청 탭 */}
        {mainTab === 'requests' && (
          <>
            {/* 활성 매핑 목록 (회기 추가) */}
            <DashboardSection 
              title="활성 매핑 (회기 추가)" 
              icon={<Users size={SIZES.ICON.MD} color={COLORS.primary} />}
            >
              {/* 신규 매칭 생성 버튼 */}
              <View style={styles.newMappingButtonContainer}>
                <MGButton
                  variant="success"
                  size="medium"
                  onPress={handleOpenNewMappingModal}
                  style={styles.newMappingButton}
                >
                  <View style={styles.newMappingButtonContent}>
                    <Plus size={SIZES.ICON.MD} color={COLORS.white} />
                    <Text style={styles.newMappingButtonText}>신규 매칭 생성</Text>
                  </View>
                </MGButton>
              </View>
              {isLoadingMappings ? (
                <View style={styles.modalLoading}>
                  <UnifiedLoading text="매핑 목록을 불러오는 중..." size="medium" />
                </View>
              ) : activeMappingsForExtension.length > 0 ? (
                <View style={styles.mappingCardGrid}>
                  {activeMappingsForExtension.map((mapping) => {
                    const info = getMappingInfo(mapping);
                    const isActive = mapping.status === 'ACTIVE';
                    
                    return (
                      <View key={mapping.id} style={[
                        styles.mappingCard,
                        !isActive && styles.mappingCardDisabled
                      ]}>
                        <View style={styles.mappingCardContent}>
                          <View style={styles.mappingCardHeader}>
                            <Text style={styles.mappingCardConsultant}>
                              👤 {info.consultantName}
                            </Text>
                            <Text style={styles.mappingCardClient}>
                              🤝 {info.clientName}
                            </Text>
                          </View>
                          <View style={styles.mappingCardSessions}>
                            <Text style={styles.mappingCardSessionsText}>
                              📊 {info.usedSessions}/{info.totalSessions}회기
                            </Text>
                            {info.remainingSessions > 0 ? (
                              <Text style={styles.mappingCardRemainingText}>
                                (남은 회기: {info.remainingSessions})
                              </Text>
                            ) : (
                              <Text style={styles.mappingCardNoSessionsText}>
                                (세션 없음)
                              </Text>
                            )}
                          </View>
                          {/* 신규 매칭 상태 표시 (단계별) */}
                          {mapping.status === 'PENDING_PAYMENT' && (
                            <View style={styles.mappingCardStatusContainer}>
                              <Text style={[
                                styles.mappingCardStatusText,
                                styles.mappingCardStatusTextPending
                              ]}>
                                ⏳ 결제 대기 중
                              </Text>
                            </View>
                          )}
                          {mapping.status === 'PAYMENT_CONFIRMED' && (
                            <View style={styles.mappingCardStatusContainer}>
                              <Text style={[
                                styles.mappingCardStatusText,
                                styles.mappingCardStatusTextPaymentConfirmed
                              ]}>
                                💳 결제 확인됨 (입금 확인 필요)
                              </Text>
                            </View>
                          )}
                          {(mapping.status === 'DEPOSIT_PENDING' || mapping.status === 'ACTIVE_PENDING') && (
                            <View style={styles.mappingCardStatusContainer}>
                              <Text style={[
                                styles.mappingCardStatusText,
                                styles.mappingCardStatusTextActivePending
                              ]}>
                                ⏸️ 관리자 승인 대기 중
                              </Text>
                            </View>
                          )}
                          {mapping.status === 'ACTIVE' && (
                            <View style={styles.mappingCardStatusContainer}>
                              <Text style={[
                                styles.mappingCardStatusText,
                                styles.mappingCardStatusTextActive
                              ]}>
                                ✅ 활성화됨
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.mappingCardActions}>
                          {mapping.status === 'PENDING_PAYMENT' ? (
                            <View style={styles.mappingCardActionRow}>
                              <MGButton
                                variant="warning"
                                size="small"
                                onPress={() => handleOpenPaymentConfirmationModal(mapping)}
                                style={[styles.extendSessionsButton, styles.mappingActionButton]}
                              >
                                <View style={styles.extendSessionsButtonContent}>
                                  <CheckCircle size={SIZES.ICON.SM} color={COLORS.white} strokeWidth={2} />
                                  <Text style={styles.extendSessionsButtonText}>결제 확인</Text>
                                </View>
                              </MGButton>
                              <MGButton
                                variant="secondary"
                                size="small"
                                onPress={() => handleOpenEditMappingModal(mapping)}
                                style={[styles.extendSessionsButton, styles.mappingActionButton]}
                              >
                                <View style={styles.extendSessionsButtonContent}>
                                  <FileText size={SIZES.ICON.SM} color={COLORS.white} strokeWidth={2} />
                                  <Text style={styles.extendSessionsButtonText}>수정</Text>
                                </View>
                              </MGButton>
                            </View>
                          ) : mapping.status === 'PAYMENT_CONFIRMED' ? (
                            <MGButton
                              variant="info"
                              size="small"
                              onPress={() => handleOpenDepositConfirmationModal(mapping)}
                              style={styles.extendSessionsButton}
                            >
                              <View style={styles.extendSessionsButtonContent}>
                                <CheckCircle size={SIZES.ICON.SM} color={COLORS.white} strokeWidth={2} />
                                <Text style={styles.extendSessionsButtonText}>입금 확인</Text>
                              </View>
                            </MGButton>
                          ) : (mapping.status === 'DEPOSIT_PENDING' || mapping.status === 'ACTIVE_PENDING') ? (
                            <MGButton
                              variant="success"
                              size="small"
                              onPress={() => handleOpenApprovalModal(mapping)}
                              style={styles.extendSessionsButton}
                            >
                              <View style={styles.extendSessionsButtonContent}>
                                <CheckCircle size={SIZES.ICON.SM} color={COLORS.white} strokeWidth={2} />
                                <Text style={styles.extendSessionsButtonText}>관리자 승인</Text>
                              </View>
                            </MGButton>
                          ) : (
                            <MGButton
                              variant="primary"
                              size="small"
                              onPress={() => handleOpenSessionExtensionModal(mapping)}
                              disabled={!isActive}
                              style={styles.extendSessionsButton}
                            >
                              <View style={styles.extendSessionsButtonContent}>
                                <Plus size={SIZES.ICON.SM} color={COLORS.white} strokeWidth={2} />
                                <Text style={styles.extendSessionsButtonText}>회기 추가</Text>
                              </View>
                            </MGButton>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Users size={SIZES.ICON['2XL']} color={COLORS.gray400} />
                  <Text style={styles.emptyText}>
                    활성 매핑이 없습니다.
                  </Text>
                </View>
              )}
            </DashboardSection>

            {/* 세션 추가 목록 */}
            <DashboardSection 
              title="세션 추가" 
              icon={<Package size={SIZES.ICON.MD} color={COLORS.primary} />}
            >
          {loadingRequests ? (
            <View style={styles.modalLoading}>
              <UnifiedLoading text="요청 목록을 불러오는 중..." size="medium" />
            </View>
          ) : sessionExtensionRequests.length > 0 ? (
            <View style={styles.requestList}>
              {sessionExtensionRequests
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                .slice(0, 10)
                .map((request) => {
                  // 디버깅: 요청 상태 확인
                  console.log('📋 세션 추가 요청:', {
                    id: request.id,
                    status: request.status,
                    additionalSessions: request.additionalSessions,
                    packageName: request.packageName,
                  });
                  
                  const statusInfo = getRequestStatusInfo(request.status);
                  const mappingInfo = request.mapping ? getMappingInfo(request.mapping) : null;
                  
                  return (
                    <View key={request.id} style={styles.requestCard}>
                      <View style={styles.requestHeader}>
                        <View style={styles.requestInfo}>
                          <Text style={styles.requestClient}>
                            {mappingInfo?.clientName || request.mapping?.client?.name || '알 수 없음'}
                          </Text>
                          <Text style={styles.requestConsultant}>
                            {mappingInfo?.consultantName || request.mapping?.consultant?.name || '알 수 없음'}
                          </Text>
                        </View>
                        <View style={[
                          styles.requestStatusBadge,
                          request.status === 'PENDING' && styles.requestStatusBadgePending,
                          request.status === 'PAYMENT_CONFIRMED' && styles.requestStatusBadgePaymentConfirmed,
                          request.status === 'ADMIN_APPROVED' && styles.requestStatusBadgeAdminApproved,
                          request.status === 'COMPLETED' && styles.requestStatusBadgeCompleted,
                          request.status === 'REJECTED' && styles.requestStatusBadgeRejected,
                          (!request.status || !['PENDING', 'PAYMENT_CONFIRMED', 'ADMIN_APPROVED', 'COMPLETED', 'REJECTED'].includes(request.status)) && styles.requestStatusBadgeDefault,
                        ]}>
                          <Text style={[
                            styles.requestStatusText,
                            request.status === 'PENDING' && styles.requestStatusTextPending,
                            request.status === 'PAYMENT_CONFIRMED' && styles.requestStatusTextPaymentConfirmed,
                            request.status === 'ADMIN_APPROVED' && styles.requestStatusTextAdminApproved,
                            request.status === 'COMPLETED' && styles.requestStatusTextCompleted,
                            request.status === 'REJECTED' && styles.requestStatusTextRejected,
                            (!request.status || !['PENDING', 'PAYMENT_CONFIRMED', 'ADMIN_APPROVED', 'COMPLETED', 'REJECTED'].includes(request.status)) && styles.requestStatusTextDefault,
                          ]}>
                            {statusInfo.text}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.requestDetails}>
                        <Text style={styles.requestSessions}>
                          +{request.additionalSessions}회기 추가
                        </Text>
                        <Text style={styles.requestPackage}>
                          {request.packageName} • {parseInt(request.packagePrice || 0).toLocaleString('ko-KR')}원
                        </Text>
                        <Text style={styles.requestDate}>
                          {request.createdAt ? new Date(request.createdAt).toLocaleDateString('ko-KR') : ''}
                        </Text>
                      </View>
                      
                      {request.reason && (
                        <View style={styles.requestReason}>
                          <Text style={styles.requestReasonLabel}>사유:</Text>
                          <Text style={styles.requestReasonText}>{request.reason}</Text>
                        </View>
                      )}
                      
                      {/* 상태별 액션 버튼 */}
                      <View style={styles.requestActions}>
                        {/* 신규 요청 생성 시: PENDING 상태 → 입금 확인 필요 */}
                        {request.status === 'PENDING' && (
                          <>
                            <MGButton
                              variant="success"
                              size="small"
                              loading={confirmingPayment && selectedRequestForPayment?.id === request.id}
                              onPress={() => handleConfirmPayment(request.id)}
                              style={styles.requestActionButton}
                            >
                              <Text style={styles.requestActionButtonText}>입금 확인</Text>
                            </MGButton>
                            <MGButton
                              variant="danger"
                              size="small"
                              loading={rejectingRequest && selectedRequestForPayment?.id === request.id}
                              onPress={() => handleRejectRequest(request.id)}
                              style={styles.requestActionButton}
                            >
                              <Text style={styles.requestActionButtonText}>거부</Text>
                            </MGButton>
                          </>
                        )}
                        
                        {/* 입금 확인 후: 백엔드가 자동으로 승인 및 완료 처리하므로 이 상태는 일시적으로만 보임 */}
                        {request.status === 'PAYMENT_CONFIRMED' && (
                          <>
                            <MGButton
                              variant="primary"
                              size="small"
                              loading={approvingRequest && selectedRequestForPayment?.id === request.id}
                              onPress={() => handleApproveRequest(request.id)}
                              style={styles.requestActionButton}
                            >
                              <Text style={styles.requestActionButtonText}>관리자 승인</Text>
                            </MGButton>
                            <MGButton
                              variant="danger"
                              size="small"
                              loading={rejectingRequest && selectedRequestForPayment?.id === request.id}
                              onPress={() => handleRejectRequest(request.id)}
                              style={styles.requestActionButton}
                            >
                              <Text style={styles.requestActionButtonText}>거부</Text>
                            </MGButton>
                          </>
                        )}
                        
                        {/* 관리자 승인 후: 요청 완료 대기 (백엔드가 자동 처리하므로 일시적으로만 보임) */}
                        {request.status === 'ADMIN_APPROVED' && (
                          <MGButton
                            variant="warning"
                            size="small"
                            loading={approvingRequest && selectedRequestForPayment?.id === request.id}
                            onPress={() => handleCompleteRequest(request.id)}
                            style={styles.requestActionButton}
                          >
                            <Text style={styles.requestActionButtonText}>요청 완료</Text>
                          </MGButton>
                        )}
                        
                        {/* COMPLETED 또는 REJECTED: 최종 상태 (입금 확인 시 자동으로 COMPLETED로 변경됨) */}
                        {(request.status === 'COMPLETED' || request.status === 'REJECTED') && (
                          <Text style={styles.requestFinalStatus}>
                            {request.status === 'COMPLETED' ? '완료됨' : '거부됨'}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Package size={SIZES.ICON['2XL']} color={COLORS.gray400} />
              <Text style={styles.emptyText}>최근 세션 추가 요청이 없습니다.</Text>
            </View>
          )}
            </DashboardSection>
          </>
        )}

        {/* 스케줄 추가 탭 */}
        {mainTab === 'schedule' && (
          <>
            <View style={styles.createButtonContainer}>
              <MGButton
                variant="primary"
                size="medium"
                fullWidth
                onPress={handleOpenMappingModal}
                style={styles.createButton}
              >
                <View style={styles.createButtonContent}>
                  <Plus size={SIZES.ICON.MD} color={COLORS.white} />
                  <Text style={styles.createButtonText}>{STRINGS.SESSION.CREATE_NEW_SCHEDULE}</Text>
                </View>
              </MGButton>
            </View>

            <DashboardSection title="스케줄 생성 가이드" icon={<FileText size={SIZES.ICON.MD} color={COLORS.primary} />}>
              <View style={styles.guideContainer}>
                <Text style={styles.guideText}>
                  1. 위의 "새 스케줄 생성" 버튼을 클릭하세요.
                </Text>
                <Text style={styles.guideText}>
                  2. 상담사와 내담자를 선택하세요.
                </Text>
                <Text style={styles.guideText}>
                  3. 날짜, 시간, 제목을 입력하세요.
                </Text>
                <Text style={styles.guideText}>
                  4. 스케줄을 생성하면 자동으로 세션에서 차감됩니다.
                </Text>
              </View>
            </DashboardSection>
          </>
        )}
      </ScrollView>

      {/* 매칭 선택 모달 */}
      <Modal
        visible={showMappingModal}
        animationType="slide"
        transparent={true}
        presentationStyle="overFullScreen"
        statusBarTranslucent={true}
        onRequestClose={() => setShowMappingModal(false)}
      >
        <View style={bottomSheetOverlayStyle}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{STRINGS.SESSION.SELECT_MAPPING}</Text>
              <TouchableOpacity
                onPress={() => setShowMappingModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={SIZES.ICON.MD} color={COLORS.gray600} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>{STRINGS.SESSION.SELECT_MAPPING_DESC}</Text>

            {isLoadingMappings ? (
              <View style={styles.modalLoading}>
                <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="medium" />
              </View>
            ) : mappings.length > 0 ? (
              <ScrollView 
                style={styles.mappingList}
                contentContainerStyle={styles.mappingListContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {mappings
                  .sort((a, b) => {
                    // 최신순 정렬: id가 큰 순서대로 (최신 등록된 것 먼저)
                    if (a.id && b.id) {
                      return b.id - a.id;
                    }
                    // id가 없으면 updatedAt 또는 createdAt 기준
                    const dateA = new Date(a.updatedAt || a.createdAt || 0);
                    const dateB = new Date(b.updatedAt || b.createdAt || 0);
                    return dateB - dateA; // 최신순 (내림차순)
                  })
                  .map((mapping) => {
                  const info = getMappingInfo(mapping);
                  const canSchedule = canCreateSchedule(mapping);
                  const sessionStatus = getSessionStatus(mapping);
                  
                  // 디버깅: 김선희2 매핑 확인
                  if (info.consultantName?.includes('김선희2')) {
                    console.log('🔍 김선희2 매핑 발견:', {
                      mappingId: mapping.id,
                      consultantName: info.consultantName,
                      clientName: info.clientName,
                      canSchedule,
                      remainingSessions: mapping.remainingSessions,
                      status: mapping.status,
                      consultantId: mapping.consultantId
                    });
                  }
                  
                  return (
                    <View key={mapping.id} style={styles.mappingItemWrapper}>
                      <TouchableOpacity
                        style={[
                          styles.mappingItem,
                          !canSchedule && styles.mappingItemDisabled
                        ]}
                        onPress={() => canSchedule && handleSelectMapping({ ...mapping, ...info })}
                        disabled={!canSchedule}
                      >
                        <View style={styles.mappingItemContent}>
                          <View style={styles.mappingItemHeader}>
                            <Text style={styles.mappingItemTitle}>
                              {info.consultantName} - {info.clientName}
                            </Text>
                            {canSchedule && (
                              <CheckCircle size={SIZES.ICON.SM} color={COLORS.primary} strokeWidth={2} />
                            )}
                          </View>
                          <View style={styles.mappingItemDetails}>
                            <Text style={[
                              styles.mappingItemDetail,
                              sessionStatus.status === 'none' && styles.mappingItemDetailError
                            ]}>
                              세션: {info.remainingSessions || 0}회 남음
                            </Text>
                            <Text style={[
                              styles.mappingItemStatus,
                              sessionStatus.status === 'none' && styles.mappingItemStatusError
                            ]}>
                              {sessionStatus.message}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                      
                      {!canSchedule && (
                        <MGButton
                          variant="warning"
                          size="small"
                          onPress={() => handleOpenSessionExtensionModal(mapping)}
                          style={styles.extendSessionsButton}
                        >
                          <Text style={styles.extendSessionsButtonText}>세션 추가</Text>
                        </MGButton>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.modalEmpty}>
                <Users size={SIZES.ICON['2XL']} color={COLORS.gray400} />
                <Text style={styles.modalEmptyText}>{STRINGS.SESSION.NO_ACTIVE_MAPPINGS}</Text>
                <Text style={styles.modalEmptyDesc}>{STRINGS.SESSION.NO_ACTIVE_MAPPINGS_DESC}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 날짜/시간 입력 모달 - 직관적인 UI */}
      <Modal
        visible={showDateTimeModal}
        animationType="slide"
        transparent={true}
        presentationStyle="overFullScreen"
        statusBarTranslucent={true}
        onRequestClose={() => setShowDateTimeModal(false)}
      >
        <View style={bottomSheetOverlayStyle}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{STRINGS.SESSION.SELECT_DATE_TIME}</Text>
              <TouchableOpacity
                onPress={() => setShowDateTimeModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={SIZES.ICON.MD} color={COLORS.gray600} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.formContainer} 
              contentContainerStyle={styles.formContentContainer}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {selectedMapping && (() => {
                const mappingInfo = getMappingInfo(selectedMapping);
                return (
                  <View style={styles.selectedMappingInfo}>
                    <Text style={styles.selectedMappingTitle}>{STRINGS.SESSION.MAPPING_INFO}</Text>
                    <Text style={styles.selectedMappingText}>
                      {STRINGS.SESSION.CONSULTANT_NAME}: {mappingInfo.consultantName}
                    </Text>
                    <Text style={styles.selectedMappingText}>
                      {STRINGS.SESSION.CLIENT_NAME}: {mappingInfo.clientName}
                    </Text>
                    <Text style={styles.selectedMappingText}>
                      {STRINGS.SESSION.REMAINING_SESSIONS}: {mappingInfo.remainingSessions}회기
                    </Text>
                  </View>
                );
              })()}
              {/* 캘린더 날짜 선택 */}
              <View style={styles.calendarSection}>
                <View style={styles.sectionTitleContainer}>
                  <CalendarIcon size={SIZES.ICON.SM} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>{STRINGS.SESSION.SESSION_DATE}</Text>
                </View>
                <View style={styles.calendarWrapper}>
                  <Calendar
                    current={scheduleForm.date || new Date().toISOString().split('T')[0]}
                    onDayPress={(day) => {
                      console.log('📅 날짜 선택:', day.dateString);
                      const selectedDate = new Date(day.dateString);
                      const formattedDate = selectedDate.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long',
                      });
                      
                      setScheduleForm(prev => ({ ...prev, date: day.dateString }));
                      
                      // 날짜 선택 시 피드백 제공
                      NotificationService.success(`날짜 선택: ${formattedDate}`);
                    }}
                    markedDates={scheduleFormMarkedDates}
                    theme={{
                      todayTextColor: COLORS.primary,
                      selectedDayBackgroundColor: COLORS.primary,
                      selectedDayTextColor: COLORS.white,
                      arrowColor: COLORS.primary,
                      monthTextColor: COLORS.dark,
                      textDayFontWeight: TYPOGRAPHY.fontWeight.medium,
                      textMonthFontWeight: TYPOGRAPHY.fontWeight.bold,
                      textDayHeaderFontWeight: TYPOGRAPHY.fontWeight.semibold,
                      todayBackgroundColor: COLORS.primaryLight,
                      backgroundColor: COLORS.white,
                      calendarBackground: COLORS.white,
                    }}
                    minDate={undefined}
                    enableSwipeMonths={true}
                    hideExtraDays={true}
                    style={styles.calendarStyle}
                  />
                </View>
              </View>
              
              {/* 선택된 날짜 표시 - 눈에 띄게 */}
              {scheduleForm.date && (
                <View style={styles.selectedDateDisplay}>
                  <View style={styles.selectedDateIconContainer}>
                    <CalendarIcon size={SIZES.ICON.LG} color={COLORS.primary} />
                  </View>
                  <View style={styles.selectedDateTextContainer}>
                    <Text style={styles.selectedDateLabel}>{STRINGS.SESSION.SESSION_DATE}</Text>
                    <Text style={styles.selectedDateValue}>
                      {new Date(scheduleForm.date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long',
                      })}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.selectedDateClearButton}
                    onPress={() => {
                      setScheduleForm(prev => ({ ...prev, date: '' }));
                      NotificationService.info('날짜 선택이 해제되었습니다.');
                    }}
                  >
                    <X size={SIZES.ICON.SM} color={COLORS.gray600} />
                  </TouchableOpacity>
                </View>
              )}
              
              {!scheduleForm.date && (
                <View style={styles.dateHintContainer}>
                  <CalendarIcon size={SIZES.ICON.MD} color={COLORS.gray400} />
                  <Text style={styles.dateHintText}>위 캘린더에서 날짜를 선택해주세요</Text>
                </View>
              )}

              {/* 시작 시간 선택 (30분 단위) */}
              <View style={styles.timeSection}>
                <View style={styles.sectionTitleContainer}>
                  <Clock size={SIZES.ICON.SM} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>
                    {STRINGS.SESSION.START_TIME_SLOT_SELECT}
                  </Text>
                </View>
                <Text style={styles.sectionDescription}>
                  {STRINGS.SESSION.START_TIME_SLOT_DESC}
                </Text>
                
                {/* 30분 단위 시간 슬롯 그리드 */}
                <View style={styles.timeSlotGrid}>
                  {generateTimeSlots().map((timeSlot) => {
                    const isConflict = isTimeSlotConflict(timeSlot);
                    const isSelected = scheduleForm.startTime === timeSlot;
                    
                    return (
                      <TouchableOpacity
                        key={timeSlot}
                        style={[
                          styles.timeSlotButton,
                          isSelected && styles.timeSlotButtonSelected,
                          isConflict && styles.timeSlotButtonConflict,
                        ]}
                        onPress={() => handleStartTimeSelect(timeSlot)}
                        disabled={isConflict}
                      >
                        <Text
                          style={[
                            styles.timeSlotButtonText,
                            isSelected && styles.timeSlotButtonTextSelected,
                            isConflict && styles.timeSlotButtonTextConflict,
                          ]}
                        >
                          {timeSlot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 상담 시간 선택 */}
              <View style={styles.durationSection}>
                <View style={styles.sectionTitleContainer}>
                  <Clock size={SIZES.ICON.SM} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>
                    {STRINGS.SESSION.DURATION_SELECT}
                  </Text>
                </View>
                
                <View style={styles.durationButtons}>
                  {[
                    { value: 30, label: STRINGS.SESSION.DURATION_30_MIN },
                    { value: 50, label: STRINGS.SESSION.DURATION_50_MIN },
                    { value: 80, label: STRINGS.SESSION.DURATION_80_MIN },
                    { value: 100, label: STRINGS.SESSION.DURATION_100_MIN },
                  ].map((duration) => (
                    <TouchableOpacity
                      key={duration.value}
                      style={[
                        styles.durationButton,
                        scheduleForm.duration === duration.value && styles.durationButtonSelected,
                      ]}
                      onPress={() => handleDurationSelect(duration.value)}
                    >
                      <Text
                        style={[
                          styles.durationButtonText,
                          scheduleForm.duration === duration.value && styles.durationButtonTextSelected,
                        ]}
                      >
                        {duration.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 선택된 시간 요약 */}
              {scheduleForm.startTime && scheduleForm.endTime ? (
                <View style={styles.selectedTimeDisplay}>
                  <View style={styles.timeDisplayItem}>
                    <Text style={styles.timeDisplayLabel}>{STRINGS.SESSION.START_TIME}</Text>
                    <Text style={styles.timeDisplayValue}>{scheduleForm.startTime}</Text>
                  </View>
                  <View style={styles.timeDisplayItem}>
                    <Text style={styles.timeDisplayLabel}>{STRINGS.SESSION.END_TIME}</Text>
                    <Text style={styles.timeDisplayValue}>{scheduleForm.endTime}</Text>
                  </View>
                  <View style={styles.timeDisplayItem}>
                    <Text style={styles.timeDisplayLabel}>{STRINGS.SESSION.DURATION_SELECT}</Text>
                    <Text style={styles.timeDisplayValue}>{scheduleForm.duration}분</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.timeHintContainer}>
                  <Clock size={SIZES.ICON.MD} color={COLORS.gray400} />
                  <Text style={styles.timeHintText}>시작 시간과 상담 시간을 선택해주세요</Text>
                </View>
              )}

              {/* 생성 버튼 */}
              <View style={styles.modalButtonContainer}>
                <MGButton
                  variant="secondary"
                  size="medium"
                  fullWidth
                  onPress={() => setShowDateTimeModal(false)}
                  style={styles.modalButton}
                >
                  <Text style={styles.modalButtonTextSecondary}>{STRINGS.COMMON.CANCEL}</Text>
                </MGButton>

                <MGButton
                  variant="primary"
                  size="medium"
                  fullWidth
                  loading={isCreatingSchedule}
                  onPress={handleCreateSchedule}
                  style={styles.modalButton}
                >
                  <Text style={styles.modalButtonText}>{STRINGS.SESSION.CREATE_NEW_SCHEDULE}</Text>
                </MGButton>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 날짜 줌인 모달 */}
      <DateZoomModal
        isVisible={showDateZoomModal}
        date={selectedCalendarDate}
        schedules={selectedDateSchedules}
        onClose={() => setShowDateZoomModal(false)}
        onSchedulePress={handleOpenScheduleDetail}
        onAddSchedule={handleAddScheduleFromCalendar}
      />
      
      {/* 스케줄 상세 모달 */}
      <ScheduleDetailModal
        isVisible={showScheduleDetailModal}
        schedule={selectedSchedule}
        onClose={() => {
          setShowScheduleDetailModal(false);
          setSelectedSchedule(null);
        }}
        onStatusChange={handleScheduleStatusChange}
        isUpdating={isUpdatingScheduleStatus}
      />

      {/* 세션 추가 모달 */}
      <Modal
        visible={showSessionExtensionModal}
        animationType="slide"
        transparent={true}
        presentationStyle="overFullScreen"
        statusBarTranslucent={true}
        onRequestClose={handleCloseSessionExtensionModal}
      >
        <View style={bottomSheetOverlayStyle}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>세션 추가</Text>
              <TouchableOpacity
                onPress={handleCloseSessionExtensionModal}
                style={styles.modalCloseButton}
              >
                <X size={SIZES.ICON.MD} color={COLORS.gray600} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              추가할 세션 개수를 입력해주세요.
            </Text>

            {selectedMappingForExtension && (() => {
              const mappingInfo = getMappingInfo(selectedMappingForExtension);
              return (
                <View style={styles.sessionExtensionInfo}>
                  <Text style={styles.sessionExtensionLabel}>매칭 정보</Text>
                  <Text style={styles.sessionExtensionText}>
                    {mappingInfo.consultantName} - {mappingInfo.clientName}
                  </Text>
                  <Text style={styles.sessionExtensionText}>
                    현재 세션: {mappingInfo.remainingSessions || 0}회
                  </Text>
                </View>
              );
            })()}

            <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.sessionExtensionForm}>
                <Text style={styles.sessionExtensionLabel}>패키지 선택</Text>
                
                {loadingPackages ? (
                  <View style={styles.modalLoading}>
                    <UnifiedLoading text="패키지 목록을 불러오는 중..." size="medium" />
                  </View>
                ) : packageOptions.length > 0 ? (
                  <View style={styles.packageList}>
                    {packageOptions.map((pkg) => (
                      <TouchableOpacity
                        key={pkg.value}
                        style={[
                          styles.packageCard,
                          selectedPackage?.value === pkg.value && styles.packageCardSelected
                        ]}
                        onPress={() => handlePackageSelect(pkg)}
                      >
                        <View style={styles.packageCardContent}>
                          <Text style={[
                            styles.packageCardName,
                            selectedPackage?.value === pkg.value && styles.packageCardNameSelected
                          ]}>
                            {pkg.label}
                          </Text>
                          <View style={styles.packageCardDetails}>
                            <Text style={[
                              styles.packageCardDetail,
                              selectedPackage?.value === pkg.value && styles.packageCardDetailSelected
                            ]}>
                              {pkg.sessions}회기
                            </Text>
                            <Text style={[
                              styles.packageCardDetail,
                              selectedPackage?.value === pkg.value && styles.packageCardDetailSelected
                            ]}>
                              {pkg.price.toLocaleString('ko-KR')}원
                            </Text>
                          </View>
                        </View>
                        {selectedPackage?.value === pkg.value && (
                          <View style={styles.packageCardCheck}>
                            <CheckCircle size={SIZES.ICON.SM} color={COLORS.white} strokeWidth={2} />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>패키지 옵션이 없습니다.</Text>
                  </View>
                )}

                {/* 선택된 패키지 정보 */}
                {selectedPackage && (
                  <View style={styles.selectedPackageInfo}>
                    <Text style={styles.selectedPackageLabel}>선택된 패키지</Text>
                    <Text style={styles.selectedPackageName}>{selectedPackage.label}</Text>
                    <View style={styles.selectedPackageDetails}>
                      <Text style={styles.selectedPackageDetail}>
                        회기: {selectedPackage.sessions}회
                      </Text>
                      <Text style={styles.selectedPackageDetail}>
                        금액: {selectedPackage.price.toLocaleString('ko-KR')}원
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* 추가 후 예상 세션 */}
              {selectedMappingForExtension && (() => {
                const mappingInfo = getMappingInfo(selectedMappingForExtension);
                const newTotal = (mappingInfo.remainingSessions || 0) + extensionSessions;
                return (
                  <View style={styles.sessionExtensionResult}>
                    <Text style={styles.sessionExtensionResultLabel}>추가 후 예상 세션:</Text>
                    <Text style={styles.sessionExtensionResultValue}>
                      {mappingInfo.remainingSessions || 0} + {extensionSessions} = {newTotal}회
                    </Text>
                  </View>
                );
              })()}
            </ScrollView>

            {/* 버튼 */}
            <View style={styles.modalButtonContainer}>
              <MGButton
                variant="secondary"
                size="medium"
                fullWidth
                onPress={handleCloseSessionExtensionModal}
                disabled={isCreatingRequest}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonTextSecondary}>취소</Text>
              </MGButton>
                <MGButton
                  variant="primary"
                  size="medium"
                  fullWidth
                  loading={isCreatingRequest}
                  onPress={handleCreateSessionExtensionRequest}
                  style={styles.modalButton}
                >
                  <Text style={styles.modalButtonText}>세션 추가 요청</Text>
                </MGButton>
            </View>
          </View>
        </View>
      </Modal>

      {/* 신규 매칭 생성 모달 (백엔드 수정 없이 프론트엔드만 추가) */}
      <Modal
        visible={showNewMappingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseNewMappingModal}
      >
        <View style={bottomSheetOverlayStyle}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>신규 매칭 생성</Text>
              <TouchableOpacity
                onPress={handleCloseNewMappingModal}
                style={styles.modalCloseButton}
              >
                <X size={SIZES.ICON.MD} color={COLORS.gray600} />
              </TouchableOpacity>
            </View>

            {/* 상담사 선택 */}
            {!selectedConsultantForMapping && (
              <View style={styles.modalBody}>
                <Text style={styles.sectionTitle}>상담사 선택</Text>
                <FlatList
                  data={consultants}
                  keyExtractor={(item) => `consultant-select-${item.id}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.consultantSelectItem}
                      onPress={() => handleSelectConsultantForMapping(item)}
                    >
                      <View style={styles.consultantSelectInfo}>
                        <Text style={styles.consultantSelectName}>{item.name}</Text>
                        <Text style={styles.consultantSelectEmail}>{item.email}</Text>
                      </View>
                      <Users size={SIZES.ICON.SM} color={COLORS.primary} />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <Users size={SIZES.ICON.XL} color={COLORS.gray400} />
                      <Text style={styles.emptyText}>등록된 상담사가 없습니다.</Text>
                    </View>
                  }
                />
              </View>
            )}

            {/* 상담사 정보 및 변경 버튼 */}
            {selectedConsultantForMapping && (
              <View style={styles.selectedConsultantInfo}>
                <View style={styles.selectedConsultantHeader}>
                  <View style={styles.selectedConsultantContent}>
                    <Text style={styles.selectedConsultantLabel}>선택된 상담사</Text>
                    <Text style={styles.selectedConsultantName}>{selectedConsultantForMapping.name}</Text>
                    <Text style={styles.selectedConsultantEmail}>{selectedConsultantForMapping.email}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changeConsultantButton}
                    onPress={() => setSelectedConsultantForMapping(null)}
                  >
                    <Text style={styles.changeConsultantButtonText}>변경</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 활성 내담자 목록 */}
            {selectedConsultantForMapping && (
              <View style={styles.modalBody}>
                <Text style={styles.sectionTitle}>활성 내담자 목록</Text>
                {(() => {
                  const unmappedClients = clients.filter(client => {
                    if (client.role !== 'CLIENT') return false;
                    if (client.isDeleted === true || client.deletedAt) return false;
                    const hasMapping = mappings.some(m =>
                      m.clientId === client.id &&
                      m.consultantId === selectedConsultantForMapping.id &&
                      (m.status === 'ACTIVE' || m.status === 'PENDING_PAYMENT' || m.status === 'PAYMENT_CONFIRMED')
                    );
                    return !hasMapping;
                  });
                  
                  return unmappedClients.length > 0 ? (
                    <FlatList
                      data={unmappedClients}
                      keyExtractor={(item) => `client-${item.id}`}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.clientListItem}
                          onPress={() => handleSelectClientForMapping(item)}
                        >
                          <View style={styles.clientListItemInfo}>
                            <Text style={styles.clientListItemName}>{item.name}</Text>
                            <Text style={styles.clientListItemEmail}>{item.email}</Text>
                          </View>
                          <View style={styles.clientListItemAction}>
                            <Users size={SIZES.ICON.SM} color={COLORS.primary} />
                          </View>
                        </TouchableOpacity>
                      )}
                    />
                  ) : (
                    <View style={styles.emptyState}>
                      <Users size={SIZES.ICON.XL} color={COLORS.gray400} />
                      <Text style={styles.emptyText}>
                        이 상담사와 매칭 가능한 활성 내담자가 없습니다.
                      </Text>
                    </View>
                  );
                })()}
              </View>
            )}

            <View style={styles.modalFooter}>
              <MGButton
                variant="primary"
                size="medium"
                onPress={handleCloseNewMappingModal}
                style={styles.modalCancelButton}
              >
                취소
              </MGButton>
            </View>
          </View>
        </View>
      </Modal>

      {/* 결제 정보 입력 모달 (백엔드 수정 없이 프론트엔드만 추가) */}
      <Modal
        visible={showPaymentInfoModal}
        animationType="slide"
        transparent={true}
        presentationStyle="overFullScreen"
        statusBarTranslucent={true}
        onRequestClose={handleClosePaymentInfoModalForMapping}
      >
        <View style={centeredModalOverlayStyle}>
          <View style={styles.paymentModalContent}>
            {/* 모달 헤더 */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{STRINGS.MAPPING.PAYMENT_INFO_TITLE}</Text>
              <TouchableOpacity
                onPress={handleClosePaymentInfoModalForMapping}
                style={styles.modalCloseButton}
                hitSlop={TOUCH_TARGET.closeButton}
              >
                <X size={SIZES.ICON.MD} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            {/* 모달 본문 */}
            <View style={styles.modalBody}>
              {/* 선택된 상담사 및 내담자 정보 */}
              {selectedConsultantForMapping && selectedClientForMapping && (
                <View style={styles.paymentInfoSection}>
                  <Text style={styles.pairInfoText}>
                    상담사: {selectedConsultantForMapping.name}
                  </Text>
                  <Text style={styles.pairInfoText}>
                    내담자: {selectedClientForMapping.name}
                  </Text>
                </View>
              )}

              {/* 결제 정보 입력 폼 */}
              <ScrollView 
                style={styles.paymentFormScroll} 
                contentContainerStyle={styles.paymentFormContainer}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
              {/* 회기 수 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>회기 수</Text>
                <View style={styles.sessionsInputRow}>
                  <TouchableOpacity
                    style={styles.sessionsButton}
                    onPress={() => setPaymentInfo(prev => ({
                      ...prev,
                      totalSessions: Math.max(DEFAULT_MAPPING_CONFIG.MIN_SESSIONS, prev.totalSessions - 1)
                    }))}
                  >
                    <Text style={styles.sessionsButtonText}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.sessionsInput}
                    value={paymentInfo.totalSessions.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text, 10) || 1;
                      setPaymentInfo(prev => ({
                        ...prev,
                        totalSessions: Math.max(DEFAULT_MAPPING_CONFIG.MIN_SESSIONS, Math.min(DEFAULT_MAPPING_CONFIG.MAX_SESSIONS, num))
                      }));
                    }}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={styles.sessionsButton}
                    onPress={() => setPaymentInfo(prev => ({
                      ...prev,
                      totalSessions: Math.min(DEFAULT_MAPPING_CONFIG.MAX_SESSIONS, prev.totalSessions + 1)
                    }))}
                  >
                    <Text style={styles.sessionsButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 패키지명 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>패키지명</Text>
                {loadingMappingOptions ? (
                  <UnifiedLoading text="로딩 중..." size="small" />
                ) : packageOptionsForMapping.length > 0 ? (
                  <FlatList
                    data={packageOptionsForMapping}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.codeValue || item.value}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.packageOptionButton,
                          paymentInfo.packageName === item.label && styles.packageOptionButtonSelected
                        ]}
                        onPress={() => {
                          setPaymentInfo(prev => ({
                            ...prev,
                            packageName: item.label || item.value,
                            totalSessions: item.sessions || prev.totalSessions,
                            packagePrice: item.price || prev.packagePrice
                          }));
                        }}
                      >
                        <Text style={[
                          styles.packageOptionText,
                          paymentInfo.packageName === item.label && styles.packageOptionTextSelected
                        ]}>
                          {item.label || item.value}
                        </Text>
                        {item.price > 0 && (
                          <Text style={styles.packageOptionPrice}>
                            {item.price.toLocaleString()}원
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                  />
                ) : (
                  <TextInput
                    style={styles.formInput}
                    value={paymentInfo.packageName}
                    onChangeText={(text) => setPaymentInfo(prev => ({
                      ...prev,
                      packageName: text
                    }))}
                    placeholder="패키지명"
                  />
                )}
              </View>

              {/* 패키지 가격 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>패키지 가격</Text>
                <TextInput
                  style={styles.formInput}
                  value={paymentInfo.packagePrice.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text.replace(/,/g, ''), 10) || 0;
                    setPaymentInfo(prev => ({
                      ...prev,
                      packagePrice: num
                    }));
                  }}
                  keyboardType="numeric"
                  placeholder="가격 입력"
                />
              </View>

              {/* 결제 방법 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>결제 방법</Text>
                {loadingMappingOptions ? (
                  <UnifiedLoading text="로딩 중..." size="small" />
                ) : (
                  <View style={styles.paymentMethodButtons}>
                    {(paymentMethodOptions.length > 0 ? paymentMethodOptions : []).map((option) => {
                      const method = option.value || option.label;
                      return (
                        <TouchableOpacity
                          key={method}
                          style={[
                            styles.paymentMethodButton,
                            paymentInfo.paymentMethod === method && styles.paymentMethodButtonSelected
                          ]}
                          onPress={() => {
                            handlePaymentMethodChange(method);
                          }}
                        >
                          <Text style={[
                            styles.paymentMethodButtonText,
                            paymentInfo.paymentMethod === method && styles.paymentMethodButtonTextSelected
                          ]}>
                            {option.label || option.value}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* 결제 참조번호 */}
              {paymentInfo.paymentMethod !== PAYMENT_METHODS.CASH && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>결제 참조번호</Text>
                  <TextInput
                    style={styles.formInput}
                    value={paymentInfo.paymentReference}
                    onChangeText={(text) => setPaymentInfo(prev => ({
                      ...prev,
                      paymentReference: text
                    }))}
                    placeholder="참조번호 입력"
                  />
                </View>
              )}

              {/* 상담종류 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{STRINGS.MAPPING.CONSULTATION_TYPE}</Text>
                {loadingMappingOptions ? (
                  <UnifiedLoading text="로딩 중..." size="small" />
                ) : responsibilityOptions.length > 0 ? (
                  <FlatList
                    data={responsibilityOptions}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.codeValue || item.value}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.responsibilityOptionButton,
                          paymentInfo.responsibility === item.label && styles.responsibilityOptionButtonSelected
                        ]}
                        onPress={() => {
                          setPaymentInfo(prev => ({
                            ...prev,
                            responsibility: item.label || item.value
                          }));
                        }}
                      >
                        <Text style={[
                          styles.responsibilityOptionText,
                          paymentInfo.responsibility === item.label && styles.responsibilityOptionTextSelected
                        ]}>
                          {item.label || item.value}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                ) : (
                  <TextInput
                    style={styles.formInput}
                    value={paymentInfo.responsibility}
                    onChangeText={(text) => setPaymentInfo(prev => ({
                      ...prev,
                      responsibility: text
                    }))}
                    placeholder={STRINGS.MAPPING.CONSULTATION_TYPE_PLACEHOLDER}
                  />
                )}
              </View>

              {/* 특별 고려사항 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>특별 고려사항</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={paymentInfo.specialConsiderations}
                  onChangeText={(text) => setPaymentInfo(prev => ({
                    ...prev,
                    specialConsiderations: text
                  }))}
                  placeholder="특별 고려사항 입력"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* 메모 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>메모</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={paymentInfo.notes}
                  onChangeText={(text) => setPaymentInfo(prev => ({
                    ...prev,
                    notes: text
                  }))}
                  placeholder="메모 입력"
                  multiline
                  numberOfLines={3}
                />
              </View>
              </ScrollView>
            </View>

            <View style={styles.modalFooter}>
              <MGButton
                variant="primary"
                size="medium"
                onPress={handleClosePaymentInfoModalForMapping}
                disabled={isCreatingMapping}
                style={styles.modalCancelButton}
              >
                {STRINGS.COMMON.CANCEL}
              </MGButton>
              <MGButton
                variant="primary"
                size="medium"
                onPress={handleCreateMappingWithPayment}
                loading={isCreatingMapping}
                style={styles.modalSubmitButton}
              >
                {STRINGS.MAPPING.CREATE_MAPPING_BUTTON}
              </MGButton>
            </View>
          </View>
        </View>
      </Modal>

      {/* 신규 매칭 결제 확인 모달 */}
      <Modal
        visible={showPaymentConfirmationModal}
        transparent
        animationType="fade"
        onRequestClose={handleClosePaymentConfirmationModal}
        presentationStyle="overFullScreen"
        statusBarTranslucent={true}
      >
        <View style={centeredModalOverlayStyle}>
          <View style={styles.paymentModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedMappingForPayment?.status === 'PENDING_PAYMENT' 
                  ? STRINGS.MAPPING.CONFIRM_PAYMENT_TITLE 
                  : selectedMappingForPayment?.status === 'PAYMENT_CONFIRMED'
                  ? '입금 확인'
                  : (selectedMappingForPayment?.status === 'DEPOSIT_PENDING' || selectedMappingForPayment?.status === 'ACTIVE_PENDING')
                  ? '관리자 승인'
                  : STRINGS.MAPPING.CONFIRM_PAYMENT_TITLE}
              </Text>
              <TouchableOpacity
                onPress={handleClosePaymentConfirmationModal}
                style={styles.modalCloseButton}
                hitSlop={TOUCH_TARGET.closeButton}
              >
                <X size={SIZES.ICON.MD} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            {selectedMappingForPayment && (() => {
              const mappingInfo = getMappingInfo(selectedMappingForPayment);
              const isPaymentStage = selectedMappingForPayment.status === 'PENDING_PAYMENT';
              const isDepositStage = selectedMappingForPayment.status === 'PAYMENT_CONFIRMED';
              const isApprovalStage = selectedMappingForPayment.status === 'DEPOSIT_PENDING' || selectedMappingForPayment.status === 'ACTIVE_PENDING';
              
              return (
                <ScrollView 
                  style={styles.paymentFormScroll} 
                  contentContainerStyle={styles.paymentFormContainer}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* 매핑 정보 */}
                  <View style={styles.paymentInfoCard}>
                    <View style={styles.infoCardHeader}>
                      <Text style={styles.infoCardTitle}>매칭 정보</Text>
                    </View>
                    <View style={styles.infoCardContent}>
                      <View style={styles.infoRow}>
                        <Users size={SIZES.ICON.SM} color={COLORS.primary} />
                        <Text style={styles.infoLabel}>상담사</Text>
                        <Text style={styles.infoValue}>{mappingInfo.consultantName}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Users size={SIZES.ICON.SM} color={COLORS.success} />
                        <Text style={styles.infoLabel}>내담자</Text>
                        <Text style={styles.infoValue}>{mappingInfo.clientName}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Package size={SIZES.ICON.SM} color={COLORS.warning} />
                        <Text style={styles.infoLabel}>금액</Text>
                        <Text style={styles.infoValueAmount}>
                          {selectedMappingForPayment.packagePrice || selectedMappingForPayment.paymentAmount || 0}원
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* 결제 방법 (결제 확인 단계에서만 표시) */}
                  {isPaymentStage && (
                    <>
                      {/* 결제 확인 경고 문구 */}
                      <View style={styles.warningCard}>
                        <Text style={styles.warningTitle}>⚠️ 주의사항</Text>
                        <Text style={styles.warningText}>
                          • 결제 확인 시 ERP 시스템에 미수금(매출채권) 거래가 자동 등록됩니다.{'\n'}
                          • 결제 방법과 참조번호를 정확히 확인 후 진행해주세요.{'\n'}
                          • 실제 입금이 확인되면 입금 확인 단계에서 현금 수입으로 전환됩니다.
                        </Text>
                      </View>
                      
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>결제 방법</Text>
                        {loadingMappingOptions ? (
                          <UnifiedLoading text="로딩 중..." size="small" />
                        ) : (
                          <View style={styles.paymentMethodButtons}>
                            {(paymentMethodOptions.length > 0 ? paymentMethodOptions : []).map((option) => {
                              const method = option.value || option.label;
                              return (
                                <TouchableOpacity
                                  key={method}
                                  style={[
                                    styles.paymentMethodButton,
                                    paymentConfirmationData.paymentMethod === method && styles.paymentMethodButtonSelected
                                  ]}
                                  onPress={() => {
                                    handlePaymentMethodChangeForConfirmation(method);
                                  }}
                                >
                                  <Text style={[
                                    styles.paymentMethodButtonText,
                                    paymentConfirmationData.paymentMethod === method && styles.paymentMethodButtonTextSelected
                                  ]}>
                                    {option.label || option.value}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                      </View>

                      {/* 결제 참조번호 */}
                      {paymentConfirmationData.paymentMethod !== PAYMENT_METHODS.CASH && (
                        <View style={styles.formGroup}>
                          <Text style={styles.formLabel}>결제 참조번호</Text>
                          <TextInput
                            style={styles.formInput}
                            value={paymentConfirmationData.paymentReference}
                            onChangeText={(text) => setPaymentConfirmationData(prev => ({
                              ...prev,
                              paymentReference: text
                            }))}
                            placeholder="참조번호 입력"
                          />
                        </View>
                      )}

                      {/* 결제 금액 */}
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>{STRINGS.MAPPING.PAYMENT_AMOUNT}</Text>
                        <TextInput
                          style={styles.formInput}
                          value={paymentConfirmationData.paymentAmount.toString()}
                          onChangeText={(text) => {
                            const num = parseFloat(text) || 0;
                            setPaymentConfirmationData(prev => ({
                              ...prev,
                              paymentAmount: num
                            }));
                          }}
                          keyboardType="numeric"
                          placeholder={STRINGS.MAPPING.PAYMENT_AMOUNT_PLACEHOLDER}
                        />
                      </View>
                    </>
                  )}

                  {/* 입금 확인 단계 안내 */}
                  {isDepositStage && (
                    <>
                      <View style={styles.paymentInfoCard}>
                        <Text style={styles.infoCardTitle}>입금 확인</Text>
                        <Text style={[styles.infoValue, { marginTop: SPACING.sm }]}>
                          결제가 확인되었습니다. 실제 입금 여부를 확인해주세요.
                        </Text>
                      </View>
                      <View style={styles.infoCard}>
                        <Text style={styles.infoCardTitle}>💰 ERP 등록 안내</Text>
                        <Text style={[styles.infoValue, { marginTop: SPACING.sm }]}>
                          입금 확인 시 ERP 시스템에 현금 수입 거래가 자동 등록됩니다.{'\n'}
                          실제 입금이 확인된 경우에만 진행해주세요.
                        </Text>
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>입금 참조번호</Text>
                        <TextInput
                          style={styles.formInput}
                          value={paymentConfirmationData.depositReference || paymentConfirmationData.paymentReference || ''}
                          onChangeText={(text) => setPaymentConfirmationData(prev => ({
                            ...prev,
                            depositReference: text
                          }))}
                          placeholder="입금 참조번호 입력 (예: 계좌이체 거래번호 등)"
                        />
                      </View>
                    </>
                  )}

                  {/* 관리자 승인 단계 안내 */}
                  {isApprovalStage && (
                    <>
                      <View style={styles.paymentInfoCard}>
                        <Text style={styles.infoCardTitle}>관리자 승인 (최종 승인)</Text>
                        <Text style={[styles.infoValue, { marginTop: SPACING.sm }]}>
                          입금 확인이 완료되었으며, ERP 시스템에 현금 수입 거래가 등록되었습니다.{'\n'}
                          최종 승인 시 매칭이 활성화되어 스케줄 등록이 가능해집니다.
                        </Text>
                      </View>
                      <View style={styles.successCard}>
                        <Text style={styles.successTitle}>✅ ERP 등록 완료</Text>
                        <Text style={styles.successText}>
                          입금 확인 단계에서 ERP 현금 수입 거래가 자동 등록되었습니다.
                        </Text>
                      </View>
                    </>
                  )}
                </ScrollView>
              );
            })()}

            {/* 모달 푸터 */}
            <View style={styles.modalFooter}>
              <MGButton
                variant="primary"
                size="medium"
                onPress={handleClosePaymentConfirmationModal}
                disabled={isConfirmingPayment}
                style={styles.modalCancelButton}
              >
                {STRINGS.COMMON.CANCEL}
              </MGButton>
              <MGButton
                variant="primary"
                size="medium"
                onPress={handleConfirmMappingPayment}
                loading={isConfirmingPayment}
                style={styles.modalSubmitButton}
              >
                {selectedMappingForPayment?.status === 'PENDING_PAYMENT' 
                  ? STRINGS.MAPPING.CONFIRM_PAYMENT 
                  : selectedMappingForPayment?.status === 'PAYMENT_CONFIRMED'
                  ? '입금 확인'
                  : (selectedMappingForPayment?.status === 'DEPOSIT_PENDING' || selectedMappingForPayment?.status === 'ACTIVE_PENDING')
                  ? '승인'
                  : STRINGS.MAPPING.CONFIRM_PAYMENT}
              </MGButton>
            </View>
          </View>
        </View>
      </Modal>

      {/* 입금 확인 확인 다이얼로그 */}
      <ConfirmModal
        isOpen={showDepositConfirmModal}
        onClose={() => {
          setShowDepositConfirmModal(false);
          setShowPaymentConfirmationModal(true); // 원래 모달로 돌아가기
        }}
        onConfirm={handleConfirmDeposit}
        title="입금 확인"
        message={`실제 입금이 확인되었나요?\n\n입금 확인 시 ERP 시스템에 현금 수입 거래가 자동 등록됩니다.\n실제 입금이 확인된 경우에만 진행해주세요.`}
        confirmText="입금 확인"
        cancelText="취소"
        type="warning"
      />

      {/* 매핑 수정 모달 (ERP 등록 전 - PENDING_PAYMENT 상태일 때만) */}
      <Modal
        visible={showEditMappingModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseEditMappingModal}
        presentationStyle="overFullScreen"
        statusBarTranslucent={true}
      >
        <View style={centeredModalOverlayStyle}>
          <View style={styles.paymentModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>매핑 정보 수정</Text>
              <TouchableOpacity
                onPress={handleCloseEditMappingModal}
                style={styles.modalCloseButton}
                hitSlop={TOUCH_TARGET.closeButton}
              >
                <X size={SIZES.ICON.MD} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.paymentFormScroll} 
              contentContainerStyle={styles.paymentFormContainer}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {selectedMappingForPayment ? (() => {
                const mappingInfo = getMappingInfo(selectedMappingForPayment);
                
                return (
                  <>
                    {/* 매핑 정보 */}
                    <View style={styles.paymentInfoCard}>
                      <View style={styles.infoCardHeader}>
                        <Text style={styles.infoCardTitle}>매칭 정보</Text>
                      </View>
                      <View style={styles.infoCardContent}>
                        <View style={styles.infoRow}>
                          <Users size={SIZES.ICON.SM} color={COLORS.primary} />
                          <Text style={styles.infoLabel}>상담사</Text>
                          <Text style={styles.infoValue}>{mappingInfo.consultantName || '정보 없음'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Users size={SIZES.ICON.SM} color={COLORS.success} />
                          <Text style={styles.infoLabel}>내담자</Text>
                          <Text style={styles.infoValue}>{mappingInfo.clientName || '정보 없음'}</Text>
                        </View>
                      </View>
                    </View>

                    {/* 경고 문구 */}
                    <View style={styles.warningCard}>
                      <Text style={styles.warningTitle}>⚠️ 수정 안내</Text>
                      <View style={styles.warningTextContainer}>
                        <Text style={styles.warningText}>
                          • 결제 확인 전 상태에서만 수정 가능합니다.
                        </Text>
                        <Text style={styles.warningText}>
                          • 결제 확인 후에는 ERP에 등록되어 수정이 불가능합니다.
                        </Text>
                        <Text style={styles.warningText}>
                          • 잘못된 패키지 선택 시 지금 수정해주세요.
                        </Text>
                        <Text style={styles.warningText}>
                          • 패키지 정보를 정확히 확인 후 수정해주세요.
                        </Text>
                      </View>
                    </View>
                  </>
                );
              })() : (
                <View style={styles.modalLoading}>
                  <Text style={styles.modalLoadingText}>매핑 정보를 불러오는 중...</Text>
                </View>
              )}

              {/* 패키지명 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>패키지명</Text>
                {loadingMappingOptions ? (
                  <UnifiedLoading text="로딩 중..." size="small" />
                ) : packageOptionsForMapping.length > 0 ? (
                  <FlatList
                    data={packageOptionsForMapping}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.codeValue || item.value}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.packageOptionButton,
                          editingMappingData.packageName === item.label && styles.packageOptionButtonSelected
                        ]}
                        onPress={() => {
                          setEditingMappingData(prev => ({
                            ...prev,
                            packageName: item.label || item.value,
                            totalSessions: item.sessions || prev.totalSessions,
                            packagePrice: item.price || prev.packagePrice
                          }));
                        }}
                      >
                        <Text style={[
                          styles.packageOptionText,
                          editingMappingData.packageName === item.label && styles.packageOptionTextSelected
                        ]}>
                          {item.label || item.value}
                        </Text>
                        {item.price > 0 && (
                          <Text style={styles.packageOptionPrice}>
                            {item.price.toLocaleString()}원
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                  />
                ) : (
                  <TextInput
                    style={styles.formInput}
                    value={editingMappingData.packageName || ''}
                    onChangeText={(text) => setEditingMappingData(prev => ({
                      ...prev,
                      packageName: text
                    }))}
                    placeholder="패키지명 입력"
                  />
                )}
              </View>

              {/* 패키지 가격 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>패키지 가격</Text>
                <TextInput
                  style={styles.formInput}
                  value={editingMappingData.packagePrice ? editingMappingData.packagePrice.toString() : ''}
                  onChangeText={(text) => {
                    const num = parseInt(text.replace(/,/g, ''), 10) || 0;
                    setEditingMappingData(prev => ({
                      ...prev,
                      packagePrice: num
                    }));
                  }}
                  keyboardType="numeric"
                  placeholder="가격 입력"
                />
              </View>

              {/* 결제 방법 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>결제 방법</Text>
                {loadingMappingOptions ? (
                  <UnifiedLoading text="로딩 중..." size="small" />
                ) : (
                  <View style={styles.paymentMethodButtons}>
                    {(paymentMethodOptions.length > 0 ? paymentMethodOptions : []).map((option) => {
                      const method = option.value || option.label;
                      return (
                        <TouchableOpacity
                          key={method}
                          style={[
                            styles.paymentMethodButton,
                            editingMappingData.paymentMethod === method && styles.paymentMethodButtonSelected
                          ]}
                          onPress={() => {
                            const newReference = generatePaymentReference(method);
                            setEditingMappingData(prev => ({
                              ...prev,
                              paymentMethod: method,
                              paymentReference: newReference || prev.paymentReference
                            }));
                          }}
                        >
                          <Text style={[
                            styles.paymentMethodButtonText,
                            editingMappingData.paymentMethod === method && styles.paymentMethodButtonTextSelected
                          ]}>
                            {option.label || option.value}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* 결제 참조번호 */}
              {editingMappingData.paymentMethod && editingMappingData.paymentMethod !== PAYMENT_METHODS.CASH && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>결제 참조번호</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editingMappingData.paymentReference || ''}
                    onChangeText={(text) => setEditingMappingData(prev => ({
                      ...prev,
                      paymentReference: text
                    }))}
                    placeholder="참조번호 입력"
                  />
                </View>
              )}

              {/* 총 회기 수 (읽기 전용 - 패키지 선택 시 자동 변경) */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>총 회기 수</Text>
                <View style={styles.readOnlyValueContainer}>
                  <Text style={styles.readOnlyValue}>
                    {editingMappingData.totalSessions ? editingMappingData.totalSessions.toString() : '0'} 회
                  </Text>
                  <Text style={styles.readOnlyHint}>패키지 선택 시 자동으로 변경됩니다</Text>
                </View>
              </View>
            </ScrollView>

            {/* 모달 푸터 */}
            <View style={styles.modalFooter}>
              <MGButton
                variant="primary"
                size="medium"
                onPress={handleCloseEditMappingModal}
                disabled={isUpdatingMapping}
                style={styles.modalCancelButton}
              >
                {STRINGS.COMMON.CANCEL}
              </MGButton>
              <MGButton
                variant="primary"
                size="medium"
                onPress={handleUpdateMapping}
                loading={isUpdatingMapping}
                style={styles.modalSubmitButton}
              >
                수정 완료
              </MGButton>
            </View>
          </View>
        </View>
      </Modal>
    </SimpleLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  debugInfo: {
    backgroundColor: COLORS.yellow100 || '#FFF9E6',
    borderWidth: 2,
    borderColor: COLORS.warning || '#FFA500',
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    minHeight: 80,
  },
  debugInfoLoading: {
    backgroundColor: COLORS.blue100 || '#E6F3FF',
    borderColor: COLORS.primary || '#3b82f6',
  },
  debugInfoError: {
    backgroundColor: COLORS.red100 || '#FFE6E6',
    borderColor: COLORS.error || '#ef4444',
  },
  debugText: {
    fontSize: TYPOGRAPHY.fontSize.sm || 12,
    color: COLORS.dark || '#000000',
    fontFamily: TYPOGRAPHY.fontFamily.regular || 'System',
    lineHeight: 18,
  },
  debugTextError: {
    color: COLORS.error || '#ef4444',
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  // 통계 및 필터 스타일은 Presentational 컴포넌트로 이동됨
  sessionList: {
    gap: SPACING.md,
  },
  sessionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  sessionDate: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
  },
  sessionStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusBadgeScheduled: {
    backgroundColor: COLORS.primaryLight,
  },
  statusBadgeCompleted: {
    backgroundColor: COLORS.successLight,
  },
  statusBadgeCancelled: {
    backgroundColor: COLORS.errorLight,
  },
  statusBadgePending: {
    backgroundColor: COLORS.warningLight,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },
  statusTextScheduled: {
    color: COLORS.white,
  },
  statusTextCompleted: {
    color: COLORS.white,
  },
  statusTextCancelled: {
    color: COLORS.white,
  },
  statusTextPending: {
    color: COLORS.white,
  },
  sessionDetails: {
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  sessionDetail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    flex: 1,
    justifyContent: 'center',
  },
  detailButton: {
    backgroundColor: COLORS.primary,
  },
  detailButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },
  completeButton: {
    backgroundColor: COLORS.successLight,
  },
  cancelButton: {
    backgroundColor: COLORS.errorLight,
  },
  approveButton: {
    backgroundColor: COLORS.primaryLight,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray500,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.error,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.sm,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  createButtonContainer: {
    marginBottom: SPACING.lg,
  },
  createButton: {
    marginBottom: SPACING.sm,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    height: '100%', // 전체 높이로 탭 바 완전히 덮기
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  modalDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    marginBottom: SPACING.lg,
  },
  modalLoading: {
    padding: SPACING['2xl'],
  },
  mappingList: {
    flex: 1,
    maxHeight: '70%',
  },
  mappingListContent: {
    paddingBottom: SPACING.xl,
  },
  mappingItemWrapper: {
    marginBottom: SPACING.md,
    gap: SPACING.xs,
    width: '100%',
    paddingHorizontal: SPACING.sm,
  },
  mappingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    width: '100%',
    minHeight: 80,
  },
  mappingItemContent: {
    flex: 1,
    minWidth: 0, // 텍스트 잘림 방지
  },
  mappingItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  mappingItemTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    flex: 1,
    flexShrink: 1, // 텍스트 잘림 방지
  },
  mappingItemDetails: {
    gap: SPACING.xs,
    width: '100%',
  },
  mappingItemDetail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    flexShrink: 1,
  },
  mappingItemDetailError: {
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  mappingItemStatus: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray500,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  mappingItemStatusError: {
    color: COLORS.error,
  },
  mappingItemDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.gray100,
  },
  extendSessionsButton: {
    marginTop: SPACING.xs,
    borderWidth: 0, // 테두리 제거
    borderColor: 'transparent', // 테두리 색상 제거
  },
  extendSessionsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  extendSessionsButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  mappingCardGrid: {
    gap: SPACING.md,
  },
  mappingCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  mappingCardDisabled: {
    opacity: 0.6,
    backgroundColor: COLORS.gray100,
  },
  mappingCardContent: {
    marginBottom: SPACING.sm,
  },
  mappingCardHeader: {
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  mappingCardConsultant: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
  },
  mappingCardClient: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.gray700,
  },
  mappingCardSessions: {
    marginTop: SPACING.xs,
  },
  mappingCardSessionsText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  mappingCardRemainingText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  mappingCardNoSessionsText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  mappingCardStatusContainer: {
    marginTop: SPACING.xs,
    alignSelf: 'flex-start',
    borderWidth: 0, // 테두리 제거
    borderColor: 'transparent', // 테두리 색상 제거
  },
  mappingCardStatusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.dark, // 배경이 밝으므로 어두운 색 사용
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    borderWidth: 0, // 테두리 제거
    borderColor: 'transparent', // 테두리 색상 제거
  },
  // 상태별 텍스트 색상 (선택적으로 사용 가능)
  mappingCardStatusTextPending: {
    color: COLORS.warning,
  },
  mappingCardStatusTextPaymentConfirmed: {
    color: COLORS.primary, // 또는 COLORS.info
  },
  mappingCardStatusTextActivePending: {
    color: COLORS.warning,
  },
  mappingCardStatusTextActive: {
    color: COLORS.success,
  },
  mappingCardActions: {
    marginTop: SPACING.sm,
  },
  mainTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  mainTabActive: {
    backgroundColor: COLORS.primary,
  },
  mainTabText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.mediumGray,
  },
  mainTabTextActive: {
    color: COLORS.white,
  },
  viewModeTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  viewModeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  viewModeTabActive: {
    backgroundColor: COLORS.primary,
  },
  viewModeTabText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.mediumGray,
  },
  viewModeTabTextActive: {
    color: COLORS.white,
  },
  modalEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
  },
  modalEmptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.gray600,
    marginTop: SPACING.md,
  },
  modalEmptyDesc: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  guideContainer: {
    gap: SPACING.md,
  },
  guideText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.dark,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * TYPOGRAPHY.fontSize.base,
  },
  selectedMappingInfo: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  selectedMappingTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  selectedMappingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  formContainer: {
    width: '100%',
    flex: 1,
    minHeight: 0,
  },
  formContentContainer: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    width: '100%',
    flexGrow: 1,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  formLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  formInput: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
  },
  textArea: {
    minHeight: 80,
  },
  timeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  timeInput: {
    flex: 1,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  modalButton: {
    flex: 1,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  modalButtonTextSecondary: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  calendarSection: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
    overflow: 'hidden',
    width: '100%',
  },
  calendarWrapper: {
    width: '100%',
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  calendarStyle: {
    width: '100%',
    alignSelf: 'stretch',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
    marginBottom: SPACING.md,
  },
  modalBody: {
    flex: 1,
    padding: SPACING.md,
  },
  timeSection: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  timeAdjustContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  selectedTimeDisplay: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  timeDisplayItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeDisplayLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  timeDisplayValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
  },
  timelineContainer: {
    marginVertical: SPACING.md,
  },
  timeline: {
    height: SIZES.TIMELINE.HEIGHT,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    position: 'relative',
  },
  timelineHour: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SIZES.TIMELINE.SEPARATOR_HEIGHT,
    paddingLeft: SPACING.sm,
  },
  timelineHourText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray500,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SPACING.xs,
  },
  timeRange: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: SIZES.BORDER_WIDTH.THIN,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  timeRangeContent: {
    padding: SPACING.xs,
  },
  timeRangeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  timeHandle: {
    position: 'absolute',
    left: SPACING.xs,
    right: SPACING.xs,
    width: '100%',
    height: SIZES.TIMELINE.HANDLE_HEIGHT,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  timeHandleStart: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  timeHandleEnd: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  selectedTimeDisplay: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
  },
  timeDisplayItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeDisplayLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  timeDisplayValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  selectedDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  quickTimeButtons: {
    marginBottom: SPACING.lg,
  },
  quickTimeLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.gray600,
    marginBottom: SPACING.sm,
  },
  quickTimeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  quickTimeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: SIZES.BORDER_WIDTH.THIN,
    borderColor: COLORS.border,
  },
  quickTimeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.dark,
  },
  selectedDateIconContainer: {
    marginRight: SPACING.md,
  },
  selectedDateTextContainer: {
    flex: 1,
  },
  selectedDateLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  selectedDateValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
  },
  selectedDateClearButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.white,
  },
  dateHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  dateHintText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    fontStyle: 'italic',
  },
  timeHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  timeHintText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    fontStyle: 'italic',
    flex: 1,
  },
  sectionDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    marginBottom: SPACING.md,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  timeSlotButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 70,
    alignItems: 'center',
  },
  timeSlotButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  timeSlotButtonConflict: {
    backgroundColor: COLORS.gray200,
    opacity: 0.6,
  },
  timeSlotButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.dark,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  timeSlotButtonTextSelected: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  timeSlotButtonTextConflict: {
    color: COLORS.gray500,
    textDecorationLine: 'line-through',
  },
  durationSection: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  durationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  durationButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  durationButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.dark,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  durationButtonTextSelected: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  timeAdjustGroup: {
    flex: 1,
  },
  timeAdjustLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  timeAdjustControls: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  timeAdjustButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  timeAdjustButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  timeAdjustButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  // 세션 추가 모달 스타일
  sessionExtensionInfo: {
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  sessionExtensionForm: {
    marginBottom: SPACING.lg,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  quickSessionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickSessionButton: {
    flex: 1,
    minWidth: '18%',
    maxWidth: '30%',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSessionButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  quickSessionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textAlign: 'center',
  },
  quickSessionButtonTextSelected: {
    color: COLORS.white,
  },
  sessionInputContainer: {
    marginBottom: SPACING.lg,
  },
  sessionInputLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.sm,
  },
  sessionInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    width: '100%',
  },
  sessionInputButton: {
    width: SIZES.INPUT_BUTTON.MD,
    height: SIZES.INPUT_BUTTON.MD,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInputButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.dark,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    lineHeight: TYPOGRAPHY.fontSize.xl,
  },
  sessionInputValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: SPACING.md,
    minHeight: 50,
  },
  sessionInputValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.dark,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
  },
  sessionInputUnit: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.mediumGray,
    marginLeft: SPACING.xs,
  },
  readOnlyValueContainer: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  readOnlyValue: {
    ...TYPOGRAPHY.body1,
    color: COLORS.dark,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
  },
  readOnlyHint: {
    ...TYPOGRAPHY.body2,
    color: COLORS.mediumGray,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  packageList: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  packageCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  packageCardContent: {
    flex: 1,
  },
  packageCardName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  packageCardNameSelected: {
    color: COLORS.primary,
  },
  packageCardDetails: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  packageCardDetail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
  },
  packageCardDetailSelected: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  packageCardCheck: {
    marginLeft: SPACING.sm,
  },
  selectedPackageInfo: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  selectedPackageLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  selectedPackageName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
    marginBottom: SPACING.sm,
  },
  selectedPackageDetails: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  selectedPackageDetail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray700,
  },
  requestList: {
    gap: SPACING.md,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  requestInfo: {
    flex: 1,
  },
  requestClient: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  requestConsultant: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
  },
  requestStatusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  // 상태별 배지 배경색
  requestStatusBadgePending: {
    backgroundColor: COLORS.warningLight,
  },
  requestStatusBadgePaymentConfirmed: {
    backgroundColor: COLORS.primaryLight,
  },
  requestStatusBadgeAdminApproved: {
    backgroundColor: COLORS.successLight,
  },
  requestStatusBadgeCompleted: {
    backgroundColor: COLORS.successLight,
  },
  requestStatusBadgeRejected: {
    backgroundColor: COLORS.errorLight,
  },
  requestStatusBadgeDefault: {
    backgroundColor: COLORS.gray100,
  },
  requestStatusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },
  // 상태별 텍스트 색상 (모두 흰색으로 통일)
  requestStatusTextPending: {
    color: COLORS.white,
  },
  requestStatusTextPaymentConfirmed: {
    color: COLORS.white,
  },
  requestStatusTextAdminApproved: {
    color: COLORS.white,
  },
  requestStatusTextCompleted: {
    color: COLORS.white,
  },
  requestStatusTextRejected: {
    color: COLORS.white,
  },
  requestStatusTextDefault: {
    color: COLORS.white,
  },
  requestDetails: {
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  requestSessions: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  requestPackage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
  },
  requestDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray500,
  },
  requestReason: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.sm,
  },
  requestReasonLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginRight: SPACING.xs,
  },
  requestReasonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  requestActionButton: {
    flex: 1,
  },
  requestActionButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  requestFinalStatus: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
    textAlign: 'center',
    flex: 1,
    paddingVertical: SPACING.sm,
  },
  sessionExtensionResult: {
    backgroundColor: COLORS.primaryLight20,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  sessionExtensionResultLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.xs,
  },
  sessionExtensionResultValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  // 신규 매칭 생성 관련 스타일 (백엔드 수정 없이 프론트엔드만 추가)
  newMappingButtonContainer: {
    marginBottom: SPACING.lg,
  },
  newMappingButton: {
    width: '100%',
  },
  newMappingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  newMappingButtonText: {
    ...TYPOGRAPHY.body1,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },
  consultantSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  consultantSelectInfo: {
    flex: 1,
  },
  consultantSelectName: {
    ...TYPOGRAPHY.body1,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.xs / 2,
  },
  consultantSelectEmail: {
    ...TYPOGRAPHY.body2,
    color: COLORS.gray600,
  },
  selectedConsultantInfo: {
    padding: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  selectedConsultantHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  selectedConsultantContent: {
    flex: 1,
  },
  selectedConsultantLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  selectedConsultantName: {
    ...TYPOGRAPHY.body1,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  selectedConsultantEmail: {
    ...TYPOGRAPHY.body2,
    color: COLORS.gray600,
  },
  changeConsultantButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.sm,
  },
  changeConsultantButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  clientListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  clientListItemInfo: {
    flex: 1,
  },
  clientListItemName: {
    ...TYPOGRAPHY.body1,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  clientListItemEmail: {
    ...TYPOGRAPHY.body2,
    color: COLORS.gray600,
  },
  clientListItemAction: {
    marginLeft: SPACING.md,
  },
  paymentInfoSection: {
    padding: SPACING.md,
  },
  pairInfoText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.dark,
    marginBottom: SPACING.xs / 2,
  },
  paymentInfoCard: {
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  infoCardHeader: {
    marginBottom: SPACING.md,
  },
  infoCardTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  infoCardContent: {
    gap: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  infoLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.gray600,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    minWidth: 60,
  },
  infoCard: {
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  warningCard: {
    backgroundColor: COLORS.warningBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  warningTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.warningDark,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.xs,
  },
  warningTextContainer: {
    marginTop: SPACING.xs,
  },
  warningText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.warningDark,
    lineHeight: TYPOGRAPHY.fontSize.base * 1.8,
    marginBottom: SPACING.xs,
  },
  successCard: {
    backgroundColor: COLORS.successBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    alignItems: 'flex-start',
    gap: SPACING.xs,
  },
  successTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.successDark,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.xs,
    lineHeight: TYPOGRAPHY.fontSize.lg * TYPOGRAPHY.lineHeight.normal,
    width: '100%',
  },
  successText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.successDark,
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
    width: '100%',
  },
  infoValue: {
    ...TYPOGRAPHY.body1,
    color: COLORS.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    flex: 1,
  },
  infoValueAmount: {
    ...TYPOGRAPHY.body1,
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    flex: 1,
  },
  paymentModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  paymentModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    width: '100%',
    maxWidth: SIZES.MODAL.MAX_WIDTH,
    maxHeight: '90%',
    flex: 1,
    flexDirection: 'column',
    ...SHADOWS.lg,
  },
  paymentFormScroll: {
    flex: 1,
    minHeight: 300,
  },
  paymentFormContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  sessionsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sessionsButton: {
    width: SIZES.INPUT_BUTTON.SM,
    height: SIZES.INPUT_BUTTON.SM,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionsButtonText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  sessionsInput: {
    flex: 1,
    ...TYPOGRAPHY.body1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    textAlign: 'center',
    color: COLORS.dark,
  },
  paymentMethodButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  paymentMethodButton: {
    flex: 1,
    minWidth: 100,
    padding: SPACING.md,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  paymentMethodButtonSelected: {
    backgroundColor: COLORS.primary20,
  },
  paymentMethodButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.dark,
  },
  paymentMethodButtonTextSelected: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  packageOptionButton: {
    padding: SPACING.md,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 120,
    alignItems: 'center',
  },
  packageOptionButtonSelected: {
    backgroundColor: COLORS.primary20,
  },
  packageOptionText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.dark,
    marginBottom: SPACING.xs / 2,
  },
  packageOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  packageOptionPrice: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
  },
  responsibilityOptionButton: {
    padding: SPACING.md,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 100,
    alignItems: 'center',
  },
  responsibilityOptionButtonSelected: {
    backgroundColor: COLORS.primary20,
  },
  responsibilityOptionText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.dark,
  },
  responsibilityOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.md,
  },
  modalCancelButton: {
    minWidth: 100,
  },
  modalSubmitButton: {
    minWidth: 120,
    marginLeft: SPACING.sm,
  },
});

// 드래그 가능한 시간 슬라이더 컴포넌트
const TimeSlider = ({ startTime, endTime, onStartTimeChange, onEndTimeChange }) => {
  const TIMELINE_HEIGHT = SIZES.TIMELINE.HEIGHT;
  const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23시

  // 시간을 Y 위치로 변환 (0시 = top, 23시 = bottom)
  const timeToY = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    return (totalMinutes / (24 * 60)) * TIMELINE_HEIGHT;
  };

  // Y 위치를 시간으로 변환
  const yToTime = (y) => {
    const clampedY = Math.max(0, Math.min(TIMELINE_HEIGHT, y));
    const totalMinutes = (clampedY / TIMELINE_HEIGHT) * (24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor((totalMinutes % 60) / 30) * 30; // 30분 단위로 스냅
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const startY = timeToY(startTime);
  const endY = timeToY(endTime);

  // 타임라인 터치 처리
  const handleTimelinePress = (event) => {
    const { locationY } = event.nativeEvent;
    const time = yToTime(locationY);
    
    // 시작 시간보다 가까우면 시작 시간 변경, 종료 시간보다 가까우면 종료 시간 변경
    const startDist = Math.abs(locationY - startY);
    const endDist = Math.abs(locationY - endY);
    
    if (startDist < endDist && locationY < endY - 30) {
      // 시작 시간 업데이트 (종료 시간보다 최소 30분 전)
      onStartTimeChange(time);
    } else if (endDist < startDist && locationY > startY + 30) {
      // 종료 시간 업데이트 (시작 시간보다 최소 30분 후)
      onEndTimeChange(time);
    }
  };

  // 시간을 분으로 변환 (스케줄 생성용)
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // 분을 시간으로 변환 (스케줄 생성용)
  const minutesToTime = (minutes) => {
    const clamped = Math.max(0, Math.min(24 * 60, minutes));
    const hours = Math.floor(clamped / 60);
    const mins = Math.floor(clamped % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.timelineContainer}>
      <View
        onTouchEnd={(event) => {
          const { locationY } = event.nativeEvent;
          handleTimelinePress(event);
        }}
      >
        <View style={styles.timeline}>
          {/* 시간 라벨 */}
          {HOURS.map((hour) => (
            <TouchableOpacity
              key={hour}
              style={[styles.timelineHour, { top: (hour / 24) * TIMELINE_HEIGHT }]}
              onPress={() => {
                const time = `${hour.toString().padStart(2, '0')}:00`;
                if (hour < 12) {
                  onStartTimeChange(time);
                } else {
                  onEndTimeChange(time);
                }
              }}
            >
              <Text style={styles.timelineHourText}>{hour}시</Text>
            </TouchableOpacity>
          ))}

          {/* 선택된 시간 범위 */}
          <View
            style={[
              styles.timeRange,
              {
                top: Math.min(startY, endY),
                height: Math.abs(endY - startY),
              },
            ]}
          >
            <View style={styles.timeRangeContent}>
              <Text style={styles.timeRangeText}>
                {Math.abs(Math.floor((endY - startY) / (TIMELINE_HEIGHT / 24)))}시간
              </Text>
            </View>
          </View>

          {/* 시작 시간 핸들 (터치 가능) */}
          <TouchableOpacity
            style={[
              styles.timeHandle,
              styles.timeHandleStart,
              { top: startY - 8 },
            ]}
            activeOpacity={0.7}
            onPressIn={() => {}}
          />

          {/* 종료 시간 핸들 (터치 가능) */}
          <TouchableOpacity
            style={[
              styles.timeHandle,
              styles.timeHandleEnd,
              { top: endY - 8 },
            ]}
            activeOpacity={0.7}
            onPressIn={() => {}}
          />
        </View>
      </View>
      
      {/* 시간 표시 및 조정 버튼 */}
      <View style={styles.timeAdjustButtons}>
        <View style={styles.timeAdjustGroup}>
          <Text style={styles.timeAdjustLabel}>{STRINGS.SESSION.START_TIME}</Text>
          <View style={styles.timeAdjustControls}>
            <TouchableOpacity
              style={styles.timeAdjustButton}
              onPress={() => {
                const [hours, minutes] = startTime.split(':').map(Number);
                const newMinutes = (hours * 60 + minutes - 30);
                if (newMinutes >= 0) {
                  onStartTimeChange(minutesToTime(newMinutes));
                }
              }}
            >
              <Text style={styles.timeAdjustButtonText}>-{STRINGS.SESSION.TIME_ADJUST_30MIN}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.timeAdjustButton}
              onPress={() => {
                const [hours, minutes] = startTime.split(':').map(Number);
                const newMinutes = (hours * 60 + minutes + 30);
                const endMinutes = timeToMinutes(endTime);
                if (newMinutes < endMinutes - 30) {
                  onStartTimeChange(minutesToTime(newMinutes));
                }
              }}
            >
              <Text style={styles.timeAdjustButtonText}>+{STRINGS.SESSION.TIME_ADJUST_30MIN}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.timeAdjustGroup}>
          <Text style={styles.timeAdjustLabel}>{STRINGS.SESSION.END_TIME}</Text>
          <View style={styles.timeAdjustControls}>
            <TouchableOpacity
              style={styles.timeAdjustButton}
              onPress={() => {
                const [hours, minutes] = endTime.split(':').map(Number);
                const newMinutes = (hours * 60 + minutes - 30);
                const startMinutes = timeToMinutes(startTime);
                if (newMinutes > startMinutes + 30) {
                  onEndTimeChange(minutesToTime(newMinutes));
                }
              }}
            >
              <Text style={styles.timeAdjustButtonText}>-{STRINGS.SESSION.TIME_ADJUST_30MIN}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.timeAdjustButton}
              onPress={() => {
                const [hours, minutes] = endTime.split(':').map(Number);
                const newMinutes = (hours * 60 + minutes + 30);
                if (newMinutes <= 24 * 60) {
                  onEndTimeChange(minutesToTime(newMinutes));
                }
              }}
            >
              <Text style={styles.timeAdjustButtonText}>+{STRINGS.SESSION.TIME_ADJUST_30MIN}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default SessionManagement;

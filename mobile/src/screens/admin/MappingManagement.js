/**
 * 매칭 관리 화면
 *
 * 웹의 frontend/src/components/admin/MappingManagement.js를 참고
 */

/**
 * 매칭 관리 화면 (Container Component)
 * 
 * 웹의 frontend/src/components/admin/MappingManagement.js를 참고
 * Presentational/Container 분리 패턴 적용
 * - 로직만 담당 (데이터 fetching, 상태 관리, 비즈니스 로직)
 * - UI는 Presentational 컴포넌트에 위임
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Modal, FlatList, TextInput } from 'react-native';
import { Users, Link, Unlink, Plus, Search, Filter, X } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import DashboardSection from '../../components/DashboardSection';
import MGButton from '../../components/MGButton';
import { DEFAULT_MAPPING_CONFIG, PAYMENT_METHOD_OPTIONS, PAYMENT_METHODS } from '../../constants/mapping';
import { generatePaymentReference } from '../../utils/paymentReference';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPost, apiDelete } from '../../api/client';
import { ADMIN_API, COMMON_CODE_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES, { TOUCH_TARGET } from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';
import NotificationService from '../../services/NotificationService';
// Presentational 컴포넌트들
import MappingStats from '../../components/admin/MappingManagement/MappingStats';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MappingManagement = () => {
  const { user } = useSession();
  const [mappings, setMappings] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showAddMappingModal, setShowAddMappingModal] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [isCreatingMapping, setIsCreatingMapping] = useState(false);
  
  // 결제 정보 입력 단계
  const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
  const [selectedClientForMapping, setSelectedClientForMapping] = useState(null);
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
  
  // 동적으로 로드된 옵션들
  const [paymentMethodOptions, setPaymentMethodOptions] = useState([]);
  const [packageOptions, setPackageOptions] = useState([]);
  const [responsibilityOptions, setResponsibilityOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // 세션 상태 모달
  const [showSessionStatusModal, setShowSessionStatusModal] = useState(false);
  const [selectedMappingForSession, setSelectedMappingForSession] = useState(null);
  
  // 세션 추가 모달 (SessionManagement와 동일)
  const [showSessionExtensionModal, setShowSessionExtensionModal] = useState(false);
  const [selectedMappingForExtension, setSelectedMappingForExtension] = useState(null);
  const [extensionSessions, setExtensionSessions] = useState(10);
  const [isExtendingSessions, setIsExtendingSessions] = useState(false);
  
  // 결제 확인 모달
  const [showPaymentConfirmationModal, setShowPaymentConfirmationModal] = useState(false);
  const [selectedMappingForPayment, setSelectedMappingForPayment] = useState(null);
  const [paymentConfirmationData, setPaymentConfirmationData] = useState({
    paymentMethod: DEFAULT_MAPPING_CONFIG.PAYMENT_METHOD,
    paymentReference: '',
    paymentAmount: 0
  });
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  const insets = useSafeAreaInsets();

  const modalOverlayStyle = useMemo(
    () => [styles.modalOverlay, { paddingBottom: Math.max(insets.bottom, SPACING['2xl']) }],
    [insets.bottom]
  );


  // 데이터 로드
  const loadData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 매칭, 상담사, 내담자 데이터 동시 로드
      // API가 실패하거나 응답이 없어도 기본값으로 처리
      const results = await Promise.allSettled([
        apiGet(ADMIN_API.GET_MAPPINGS).catch(err => {
          console.log('매칭 데이터 로드 실패 (기본값 사용):', err);
          return { success: false, data: [] };
        }),
        apiGet(ADMIN_API.GET_ALL_USERS).catch(err => {
          console.log('사용자 데이터 로드 실패 (기본값 사용):', err);
          return { success: false, data: [] };
        }),
        apiGet(ADMIN_API.GET_ALL_USERS).catch(err => {
          console.log('사용자 데이터 로드 실패 (기본값 사용):', err);
          return { success: false, data: [] };
        }),
      ]);

      const [mappingsRes, consultantsRes, clientsRes] = results.map(r => 
        r.status === 'fulfilled' ? r.value : { success: false, data: [] }
      );

      // 매칭 데이터 설정
      if (mappingsRes?.success && Array.isArray(mappingsRes?.data)) {
        setMappings(mappingsRes.data);
      } else if (mappingsRes?.data && Array.isArray(mappingsRes.data)) {
        // 응답이 배열로 직접 오는 경우
        setMappings(mappingsRes.data);
      } else {
        setMappings([]);
      }

      // 상담사 데이터 설정
      if (consultantsRes?.success && Array.isArray(consultantsRes?.data)) {
        const consultantList = consultantsRes.data.filter(user => user.role === 'CONSULTANT');
        setConsultants(consultantList);
      } else if (Array.isArray(consultantsRes?.data)) {
        // 응답이 배열로 직접 오는 경우
        const consultantList = consultantsRes.data.filter(user => user.role === 'CONSULTANT');
        setConsultants(consultantList);
      } else {
        setConsultants([]);
      }

      // 내담자 데이터 설정
      if (clientsRes?.success && Array.isArray(clientsRes?.data)) {
        const clientList = clientsRes.data.filter(user => user.role === 'CLIENT');
        setClients(clientList);
      } else if (Array.isArray(clientsRes?.data)) {
        // 응답이 배열로 직접 오는 경우
        const clientList = clientsRes.data.filter(user => user.role === 'CLIENT');
        setClients(clientList);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      // 에러가 발생해도 기본값으로 설정하여 로딩이 끝나도록 보장
      setMappings([]);
      setConsultants([]);
      setClients([]);
      setError(STRINGS.ERROR.LOAD_FAILED || '데이터를 불러오는데 실패했습니다.');
    } finally {
      // 항상 로딩 상태 종료 (무한 로딩 방지)
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // 매칭된 클라이언트 목록 가져오기 (웹과 동일한 로직)
  // ACTIVE 뿐만 아니라 PENDING_PAYMENT, PAYMENT_CONFIRMED 등도 매칭으로 간주
  const getMappedClients = useCallback((consultantId) => {
    return clients.filter(client => {
      const mapping = mappings.find(m =>
        m.consultantId === consultantId &&
        m.clientId === client.id &&
        // 활성 매칭 또는 결제 대기 중인 매칭도 포함 (웹과 동일)
        (m.status === 'ACTIVE' || 
         m.status === 'PENDING_PAYMENT' || 
         m.status === 'PAYMENT_CONFIRMED')
      );
      return mapping !== undefined;
    });
  }, [clients, mappings]);

  // 미매칭 클라이언트 목록 가져오기 (웹과 동일한 로직)
  const getUnmappedClients = useCallback(() => {
    return clients.filter(client => {
      // 활성 매칭 또는 결제 대기 중인 매칭이 없는 클라이언트만 반환 (웹과 동일)
      const hasMapping = mappings.some(m =>
        m.clientId === client.id &&
        (m.status === 'ACTIVE' || 
         m.status === 'PENDING_PAYMENT' || 
         m.status === 'PAYMENT_CONFIRMED')
      );
      return !hasMapping;
    });
  }, [clients, mappings]);

  // 선택된 상담사에 대한 미매칭 클라이언트 목록 가져오기
  const getUnmappedClientsForConsultant = useCallback((consultantId) => {
    if (!consultantId || clients.length === 0) {
      console.log('⚠️ 내담자 필터링 실패 - 상담사 ID 없음 또는 내담자 목록 비어있음');
      return [];
    }
    
    const mappedClientIds = getMappedClients(consultantId).map(c => c.id);
    console.log('📋 매핑 확인:', {
      상담사_ID: consultantId,
      매핑된_내담자_IDs: mappedClientIds,
      매핑된_내담자_수: mappedClientIds.length
    });
    
    // 활성 내담자만 필터링 (삭제되지 않은 내담자만 표시)
    // 필드가 없으면 활성으로 간주, 있으면 false/null만 통과
    const filteredClients = clients.filter(client => {
      // 역할 확인 (CLIENT만)
      if (client.role !== 'CLIENT') {
        return false;
      }
      
      // 매핑 여부 확인
      const isNotMapped = !mappedClientIds.includes(client.id);
      
      // 삭제 필드 확인 (필드가 없으면 활성으로 간주)
      let isActive = true;
      if ('isDeleted' in client && client.isDeleted !== undefined && client.isDeleted !== null) {
        isActive = client.isDeleted === false;
      }
      if (isActive && 'deletedAt' in client && client.deletedAt !== undefined && client.deletedAt !== null) {
        isActive = client.deletedAt === null || client.deletedAt === '';
      }
      
      const result = isNotMapped && isActive;
      
      if (!result && client.role === 'CLIENT') {
        console.log(`  ❌ 제외된 내담자: ${client.name} (매핑됨: ${!isNotMapped}, 활성: ${isActive})`);
      }
      
      return result;
    });
    
    console.log('📋 내담자 필터링 결과:', {
      상담사_ID: consultantId,
      전체_내담자_수: clients.length,
      CLIENT_역할_내담자_수: clients.filter(c => c.role === 'CLIENT').length,
      전체_내담자_샘플: clients.slice(0, 5).map(c => ({ 
        id: c.id, 
        name: c.name, 
        role: c.role,
        isDeleted: c.isDeleted, 
        deletedAt: c.deletedAt 
      })),
      매핑된_내담자_IDs: mappedClientIds,
      필터링_후_내담자_수: filteredClients.length,
      필터링_된_내담자: filteredClients.map(c => ({ 
        id: c.id, 
        name: c.name,
        email: c.email
      }))
    });
    
    return filteredClients;
  }, [clients, getMappedClients]);

  // 매칭 생성 (결제 정보 포함)
  const handleCreateMappingWithPayment = async () => {
    if (!selectedConsultant || !selectedClientForMapping) {
      NotificationService.error('상담사와 내담자를 선택해주세요.');
      return;
    }
    
    if (isCreatingMapping) {
      return;
    }

    try {
      setIsCreatingMapping(true);
      
      // 웹 버전과 동일한 데이터 구조
      const mappingData = {
        consultantId: selectedConsultant.id,
        clientId: selectedClientForMapping.id,
        startDate: new Date().toISOString().split('T')[0], // 오늘 날짜
        status: 'PENDING_PAYMENT', // 결제 대기 상태
        notes: paymentInfo.notes || '',
        responsibility: paymentInfo.responsibility || DEFAULT_MAPPING_CONFIG.RESPONSIBILITY,
        specialConsiderations: paymentInfo.specialConsiderations || '',
        paymentStatus: 'PENDING', // 결제 대기
        // 회기 관리 시스템 필수 필드
        totalSessions: paymentInfo.totalSessions || DEFAULT_MAPPING_CONFIG.TOTAL_SESSIONS,
        remainingSessions: paymentInfo.totalSessions || DEFAULT_MAPPING_CONFIG.TOTAL_SESSIONS,
        packageName: paymentInfo.packageName || DEFAULT_MAPPING_CONFIG.PACKAGE_NAME,
        packagePrice: paymentInfo.packagePrice || DEFAULT_MAPPING_CONFIG.PACKAGE_PRICE,
        paymentAmount: paymentInfo.packagePrice || DEFAULT_MAPPING_CONFIG.PACKAGE_PRICE,
        paymentMethod: paymentInfo.paymentMethod || DEFAULT_MAPPING_CONFIG.PAYMENT_METHOD,
        paymentReference: paymentInfo.paymentReference || '',
        mappingType: 'NEW' // 신규 배정
      };

      console.log('매칭 생성 데이터:', mappingData);
      
      const response = await apiPost(ADMIN_API.CREATE_MAPPING, mappingData);

      if (response?.success) {
        NotificationService.success('배정이 생성되었습니다. (결제 대기 상태)');
        handleClosePaymentInfoModal();
        setShowAddMappingModal(false);
        setSelectedConsultant(null);
        await loadData();
      } else {
        throw new Error(response?.message || '배정 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('매칭 생성 실패:', error);
      NotificationService.error(error.message || '배정 생성에 실패했습니다.');
    } finally {
      setIsCreatingMapping(false);
    }
  };

  // 매칭 추가 모달 열기
  const handleOpenAddMappingModal = (consultant) => {
    setSelectedConsultant(consultant);
    setShowAddMappingModal(true);
  };

  // 매칭 추가 모달 닫기
  const handleCloseAddMappingModal = () => {
    setShowAddMappingModal(false);
    setSelectedConsultant(null);
  };

  // 내담자 선택 및 결제 정보 입력 단계로 이동
  const handleSelectClient = (client) => {
    if (!selectedConsultant) {
      NotificationService.error('상담사를 먼저 선택해주세요.');
      return;
    }
    
    // 결제 정보 입력 모달 열기
    setSelectedClientForMapping(client);
    
    // 결제 참조번호 자동 생성
    const referenceNumber = generatePaymentReference(paymentInfo.paymentMethod);
    setPaymentInfo(prev => ({
      ...prev,
      paymentReference: referenceNumber || ''
    }));
    
    // 매칭 추가 모달 닫고 결제 정보 입력 모달 열기
    setShowAddMappingModal(false);
    setShowPaymentInfoModal(true);
  };
  
  // 결제 정보 모달 닫기
  const handleClosePaymentInfoModal = () => {
    setShowPaymentInfoModal(false);
    setSelectedClientForMapping(null);
    // 결제 정보 초기화
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
  };
  
  // 세션 상태 모달 닫기
  const handleCloseSessionStatusModal = () => {
    setShowSessionStatusModal(false);
    setSelectedMappingForSession(null);
  };
  
  // 세션 추가 모달 열기
  const handleOpenSessionExtensionModal = (mapping) => {
    setSelectedMappingForExtension(mapping);
    setExtensionSessions(10);
    setShowSessionExtensionModal(true);
  };
  
  // 세션 추가 모달 닫기
  const handleCloseSessionExtensionModal = () => {
    setShowSessionExtensionModal(false);
    setSelectedMappingForExtension(null);
    setExtensionSessions(10);
  };
  
  // 세션 추가 처리
  const handleExtendSessions = async () => {
    if (!selectedMappingForExtension) {
      NotificationService.error('배정 정보가 없습니다.');
      return;
    }
    
    if (extensionSessions <= 0 || extensionSessions > 1000) {
      NotificationService.error('세션 개수는 1~1000개 사이여야 합니다.');
      return;
    }
    
    try {
      setIsExtendingSessions(true);
      
      const response = await apiPost(ADMIN_API.EXTEND_SESSIONS(selectedMappingForExtension.id), {
        additionalSessions: extensionSessions,
        packageName: `세션 ${extensionSessions}회 추가`,
        packagePrice: 0,
      });
      
      if (response?.success) {
        NotificationService.success(`세션 ${extensionSessions}개가 추가되었습니다.`);
        await loadData(); // 배정 목록 새로고침
        handleCloseSessionExtensionModal();
      } else {
        throw new Error(response?.message || '세션 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('세션 추가 실패:', error);
      NotificationService.error(error.message || '세션 추가에 실패했습니다.');
    } finally {
      setIsExtendingSessions(false);
    }
  };
  
  // 매칭 정보 가져오기 (이름 해석용)
  const getMappingInfo = useCallback((mapping) => {
    const consultant = consultants.find(c => c.id === mapping?.consultantId);
    const client = clients.find(c => c.id === mapping?.clientId);
    const totalSessions = mapping?.totalSessions || 0;
    const remainingSessions = mapping?.remainingSessions || 0;
    const usedSessions = totalSessions - remainingSessions;
    
    return {
      consultantName: consultant?.name || '알 수 없음',
      clientName: client?.name || '알 수 없음',
      remainingSessions,
      totalSessions,
      usedSessions,
    };
  }, [consultants, clients]);
  
  // 공통코드 옵션 로드 (결제 방법, 패키지, 책임자) - 웹 버전과 동일한 로직
  const loadCommonCodeOptions = useCallback(async () => {
    try {
      setLoadingOptions(true);
      
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
          // 기본값 사용
          setPaymentMethodOptions(PAYMENT_METHOD_OPTIONS.map(method => ({
            value: method,
            label: method,
            codeValue: method
          })));
        }
      } catch (error) {
        console.error('결제 방법 코드 로드 실패:', error);
        // 기본값 사용
        setPaymentMethodOptions(PAYMENT_METHOD_OPTIONS.map(method => ({
          value: method,
          label: method,
          codeValue: method
        })));
      }
      
      // 패키지 옵션 로드 (웹 버전과 동일한 로직)
      try {
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
              // SINGLE_30000 -> 30000
              const priceStr = code.codeValue.replace('SINGLE_', '');
              const parsedPrice = parseInt(priceStr, 10);
              // NaN 체크 (가격이 codeDescription에 없을 때만 코드값에서 추출)
              if (!isNaN(parsedPrice) && parsedPrice > 0 && price === 0) {
                price = parsedPrice;
              } else if (isNaN(parsedPrice) || parsedPrice === 0) {
                console.warn(`단회기 가격 파싱 실패: ${code.codeValue} -> ${priceStr}`);
                price = price || 30000; // codeDescription 값이 있으면 우선 사용
              }
            } else {
              // 그 외 패키지는 extraData와 codeDescription에서 가져오기
              // (위에서 이미 처리했으므로 여기서는 기본값만 설정)
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
              // SINGLE_ 패키지는 코드값 그대로 사용 (SINGLE_30000, SINGLE_35000 등)
              label = code.codeValue;
            } else {
              label = code.codeLabel || code.koreanName || code.codeValue;
            }
            
            return {
              value: code.codeValue,
              label: label,
              sessions: sessions,
              price: price,
              icon: code.icon,
              color: code.colorCode,
              description: code.codeDescription,
              codeValue: code.codeValue
            };
          });
          setPackageOptions(options);
          console.log('✅ 패키지 옵션 로드 완료:', options.length, '개', options);
        }
      } catch (error) {
        console.error('패키지 옵션 로드 실패:', error);
      }
      
      // 책임자 옵션 로드
      try {
        const responsibilityResponse = await apiGet(COMMON_CODE_API.GET_RESPONSIBILITY_OPTIONS);
        if (responsibilityResponse && Array.isArray(responsibilityResponse) && responsibilityResponse.length > 0) {
          const options = responsibilityResponse.map(code => ({
            value: code.codeValue,
            label: code.codeLabel || code.koreanName,
            codeValue: code.codeValue
          }));
          setResponsibilityOptions(options);
        }
      } catch (error) {
        console.error('책임자 옵션 로드 실패:', error);
      }
    } catch (error) {
      console.error('공통코드 옵션 로드 실패:', error);
    } finally {
      setLoadingOptions(false);
    }
  }, []);
  
  // 결제 정보 모달이 열릴 때 옵션 로드
  useEffect(() => {
    if (showPaymentInfoModal) {
      loadCommonCodeOptions();
    }
  }, [showPaymentInfoModal, loadCommonCodeOptions]);
  
  // 결제 방법 변경 시 참조번호 자동 생성
  const handlePaymentMethodChange = (method) => {
    const referenceNumber = generatePaymentReference(method);
    setPaymentInfo(prev => ({
      ...prev,
      paymentMethod: method,
      paymentReference: referenceNumber || ''
    }));
  };

  // 결제 확인 처리
  const handleConfirmPayment = useCallback(async () => {
    if (!selectedMappingForPayment) {
      NotificationService.error('매핑 정보를 찾을 수 없습니다.');
      return;
    }

    if (isConfirmingPayment) {
      return;
    }

    try {
      setIsConfirmingPayment(true);

      const response = await apiPost(
        ADMIN_API.CONFIRM_MAPPING_PAYMENT(selectedMappingForPayment.id),
        {
          paymentMethod: paymentConfirmationData.paymentMethod,
          paymentReference: paymentConfirmationData.paymentMethod === PAYMENT_METHODS.CASH 
            ? null 
            : paymentConfirmationData.paymentReference,
          paymentAmount: paymentConfirmationData.paymentAmount
        }
      );

      if (response?.success) {
        NotificationService.success('✅ 결제 확인 완료! ERP 시스템에 미수금 거래가 자동 등록되었습니다.');
        setShowPaymentConfirmationModal(false);
        setSelectedMappingForPayment(null);
        await loadData(); // 배정 목록 새로고침
      } else {
        NotificationService.error(response?.message || '결제 확인에 실패했습니다.');
      }
    } catch (error) {
      console.error('결제 확인 실패:', error);
      NotificationService.error(error?.message || '결제 확인에 실패했습니다.');
    } finally {
      setIsConfirmingPayment(false);
    }
  }, [selectedMappingForPayment, paymentConfirmationData, isConfirmingPayment, loadData]);

  // 결제 확인 모달 닫기
  const handleClosePaymentConfirmationModal = useCallback(() => {
    setShowPaymentConfirmationModal(false);
    setSelectedMappingForPayment(null);
    setPaymentConfirmationData({
      paymentMethod: DEFAULT_MAPPING_CONFIG.PAYMENT_METHOD,
      paymentReference: '',
      paymentAmount: 0
    });
  }, []);

  // 결제 방법 변경 시 참조번호 자동 생성 (결제 확인 모달용)
  const handlePaymentMethodChangeForConfirmation = useCallback((method) => {
    const referenceNumber = generatePaymentReference(method);
    setPaymentConfirmationData(prev => ({
      ...prev,
      paymentMethod: method,
      paymentReference: referenceNumber || ''
    }));
  }, []);

  // 매칭 삭제
  const deleteMapping = async (mappingId) => {
    Alert.alert(
      STRINGS.COMMON.CONFIRM,
      STRINGS.MAPPING.DELETE_CONFIRM || '정말로 이 배정을 해제하시겠습니까?',
      [
        { text: STRINGS.COMMON.CANCEL, style: 'cancel' },
        {
          text: STRINGS.COMMON.DELETE,
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiDelete(ADMIN_API.DELETE_MAPPING(mappingId));

              if (response?.success) {
                Alert.alert(
                  STRINGS.SUCCESS.SUCCESS,
                  STRINGS.MAPPING.MAPPING_DELETED || '배정이 해제되었습니다.',
                  [
                    { text: STRINGS.COMMON.CONFIRM, onPress: loadData },
                  ]
                );
              } else {
                throw new Error(STRINGS.ERROR.DELETE_FAILED || '배정 해제에 실패했습니다.');
              }
            } catch (error) {
              console.error('매칭 삭제 실패:', error);
              Alert.alert(STRINGS.ERROR.ERROR, STRINGS.ERROR.DELETE_FAILED || '배정 해제에 실패했습니다.');
            }
          }
        }
      ]
    );
  };


  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.ADMIN.MAPPING_MANAGEMENT}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.ADMIN.MAPPING_MANAGEMENT}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 통계 카드 - Presentational 컴포넌트 사용 */}
        <MappingStats
          mappings={mappings}
          consultants={consultants}
          clients={clients}
          unmappedClientsCount={getUnmappedClients().length}
        />

        {/* 상담사별 매칭 현황 */}
        <DashboardSection title={STRINGS.MAPPING.CONSULTANT_MAPPINGS || '상담사별 배정 현황'} icon={<Users size={SIZES.ICON.MD} color={COLORS.primary} />}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <MGButton
                variant="primary"
                size="small"
                onPress={loadData}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>{STRINGS.COMMON.RETRY}</Text>
              </MGButton>
            </View>
          ) : consultants.length > 0 ? (
            <View style={styles.consultantList}>
              {consultants.map((consultant, consultantIndex) => {
                const mappedClients = getMappedClients(consultant.id);
                return (
                  <View key={`consultant-${consultant.id}-${consultantIndex}`} style={styles.consultantCard}>
                    <View style={styles.consultantHeader}>
                      <View style={styles.consultantInfo}>
                        <Text style={styles.consultantName}>{consultant.name}</Text>
                        <Text style={styles.consultantEmail}>{consultant.email}</Text>
                      </View>
                      <View style={styles.consultantStats}>
                        <Text style={styles.clientCount}>
                          {STRINGS.MAPPING.MAPPED_CLIENTS || '배정된 내담자'}: {mappedClients.length}
                        </Text>
                      </View>
                    </View>

                    {mappedClients.length > 0 ? (
                      <View style={styles.mappedClients}>
                        {mappedClients.map((client, clientIndex) => {
                          // 웹과 동일: ACTIVE뿐만 아니라 PENDING_PAYMENT, PAYMENT_CONFIRMED도 표시
                          const mapping = mappings.find(m =>
                            m.consultantId === consultant.id &&
                            m.clientId === client.id &&
                            (m.status === 'ACTIVE' || 
                             m.status === 'PENDING_PAYMENT' || 
                             m.status === 'PAYMENT_CONFIRMED')
                          );
                          // 고유한 키 생성: mapping.id가 있으면 사용, 없으면 consultant-client-index 조합 사용
                          const uniqueKey = mapping?.id 
                            ? `mapping-${mapping.id}` 
                            : `consultant-${consultant.id}-client-${client.id}-${clientIndex}`;
                          const remainingSessions = mapping?.remainingSessions || 0;
                          const totalSessions = mapping?.totalSessions || 0;
                          const usedSessions = totalSessions - remainingSessions;
                          const needsSessionExtension = remainingSessions === 0;
                          
                          return (
                            <TouchableOpacity
                              key={uniqueKey}
                              style={styles.clientItem}
                              onPress={() => {
                                console.log('📋 세션 상태 모달 열기 - 매핑 정보:', mapping);
                                if (mapping) {
                                  setSelectedMappingForSession(mapping);
                                  setShowSessionStatusModal(true);
                                } else {
                                  console.error('❌ 매핑 정보가 없습니다.');
                                  NotificationService.error('매핑 정보를 불러올 수 없습니다.');
                                }
                              }}
                              activeOpacity={0.7}
                            >
                              <View style={styles.clientInfo}>
                                <View style={styles.clientInfoHeader}>
                                  <Text style={styles.clientName}>{client.name}</Text>
                                  {needsSessionExtension && (
                                    <View style={styles.sessionWarningBadge}>
                                      <Text style={styles.sessionWarningText}>세션 없음</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={styles.clientEmail}>{client.email}</Text>
                                <View style={styles.sessionInfoRow}>
                                  <Text style={styles.sessionInfoText}>
                                    📊 {usedSessions}/{totalSessions}회기
                                  </Text>
                                  <Text style={[
                                    styles.remainingSessionsText,
                                    needsSessionExtension && styles.remainingSessionsTextWarning
                                  ]}>
                                    남은: {remainingSessions}회
                                  </Text>
                                </View>
                                <Text style={styles.mappingDate}>
                                  {STRINGS.MAPPING.MAPPED_DATE || '배정일'}: {new Date(mapping.createdAt).toLocaleDateString('ko-KR')}
                                </Text>
                              </View>
                              <View style={styles.clientItemActions}>
                                {/* 결제 대기 상태일 때 결제 확인 버튼 */}
                                {mapping?.status === 'PENDING_PAYMENT' && (
                                  <MGButton
                                    variant="success"
                                    size="small"
                                    onPress={(e) => {
                                      e.stopPropagation();
                                      setSelectedMappingForPayment(mapping);
                                      const paymentMethod = mapping.paymentMethod || DEFAULT_MAPPING_CONFIG.PAYMENT_METHOD;
                                      setPaymentConfirmationData({
                                        paymentMethod: paymentMethod,
                                        paymentReference: generatePaymentReference(paymentMethod) || '',
                                        paymentAmount: mapping.packagePrice || mapping.paymentAmount || 0
                                      });
                                      setShowPaymentConfirmationModal(true);
                                    }}
                                    style={styles.confirmPaymentButton}
                                  >
                                    <Text style={styles.confirmPaymentButtonText}>{STRINGS.MAPPING.CONFIRM_PAYMENT}</Text>
                                  </MGButton>
                                )}
                                {needsSessionExtension && (
                                  <MGButton
                                    variant="warning"
                                    size="small"
                                    onPress={(e) => {
                                      e.stopPropagation();
                                      setSelectedMappingForExtension(mapping);
                                      setExtensionSessions(10);
                                      setShowSessionExtensionModal(true);
                                    }}
                                    style={styles.extendSessionButton}
                                  >
                                    <Text style={styles.extendSessionButtonText}>회기 추가</Text>
                                  </MGButton>
                                )}
                                <TouchableOpacity
                                  style={styles.unlinkButton}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    deleteMapping(mapping.id);
                                  }}
                                >
                                  <Unlink size={SIZES.ICON.SM} color={COLORS.error} />
                                </TouchableOpacity>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : (
                      <View style={styles.noClients}>
                        <Text style={styles.noClientsText}>
                          {STRINGS.MAPPING.NO_MAPPED_CLIENTS || '배정된 내담자가 없습니다.'}
                        </Text>
                      </View>
                    )}

                    {/* 매칭 추가 버튼 */}
                    <View style={styles.addMappingContainer}>
                      <MGButton
                        variant="success"
                        size="small"
                        onPress={() => handleOpenAddMappingModal(consultant)}
                        style={styles.addButton}
                      >
                        <View style={styles.addButtonContent}>
                          <Plus size={SIZES.ICON.SM} color={COLORS.white} />
                          <Text style={styles.addButtonText}>{STRINGS.MAPPING.ADD_MAPPING || '내담자 배정'}</Text>
                        </View>
                      </MGButton>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Users size={SIZES.ICON['2XL']} color={COLORS.gray400} />
              <Text style={styles.emptyText}>{STRINGS.CONSULTANT.NO_CONSULTANTS}</Text>
            </View>
          )}
        </DashboardSection>

        {/* 미매칭 내담자 목록 */}
        {getUnmappedClients().length > 0 && (
          <DashboardSection title={STRINGS.MAPPING.UNMAPPED_CLIENTS} icon={<Unlink size={SIZES.ICON.MD} color={COLORS.warning} />}>
            <View style={styles.unmappedClients}>
              {getUnmappedClients().map((client) => (
                <View key={client.id} style={styles.unmappedClientCard}>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{client.name}</Text>
                    <Text style={styles.clientEmail}>{client.email}</Text>
                    <Text style={styles.clientStatus}>
                      {STRINGS.USER.CREATED_AT}: {new Date(client.createdAt).toLocaleDateString('ko-KR')}
                    </Text>
                  </View>
                  <MGButton
                    variant="primary"
                    size="small"
                    onPress={() => {
                      // TODO: 매칭 생성 모달 열기
                      // setShowCreateMappingModal(true);
                      // setSelectedClient(client);
                    }}
                    style={styles.matchButton}
                  >
                    <Text style={styles.matchButtonText}>{STRINGS.MAPPING.CREATE_MAPPING || '배정하기'}</Text>
                  </MGButton>
                </View>
              ))}
            </View>
          </DashboardSection>
        )}
      </ScrollView>

      {/* 매칭 추가 모달 */}
      <Modal
        visible={showAddMappingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseAddMappingModal}
      >
        <View style={modalOverlayStyle}>
          <View style={styles.modalContent}>
            {/* 모달 헤더 */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {STRINGS.MAPPING.ADD_MAPPING || '내담자 배정'}
              </Text>
              <TouchableOpacity
                onPress={handleCloseAddMappingModal}
                style={styles.modalCloseButton}
                hitSlop={TOUCH_TARGET.closeButton}
              >
                <X size={SIZES.ICON.MD} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            {/* 상담사 선택 */}
            {!selectedConsultant && (
              <View style={styles.consultantSelectionSection}>
                <Text style={styles.sectionTitle}>상담사 선택</Text>
                <FlatList
                  data={consultants}
                  keyExtractor={(item) => `consultant-select-${item.id}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.consultantSelectItem}
                      onPress={() => setSelectedConsultant(item)}
                    >
                      <View style={styles.consultantSelectInfo}>
                        <Text style={styles.consultantSelectName}>{item.name}</Text>
                        <Text style={styles.consultantSelectEmail}>{item.email}</Text>
                      </View>
                      <View style={styles.consultantSelectAction}>
                        <Users size={SIZES.ICON.SM} color={COLORS.primary} />
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.modalEmptyState}>
                      <Users size={SIZES.ICON.XL} color={COLORS.gray400} />
                      <Text style={styles.modalEmptyText}>
                        등록된 상담사가 없습니다.
                      </Text>
                    </View>
                  }
                />
              </View>
            )}

            {/* 상담사 정보 및 변경 버튼 */}
            {selectedConsultant && (
              <View style={styles.selectedConsultantInfo}>
                <View style={styles.selectedConsultantHeader}>
                  <View style={styles.selectedConsultantContent}>
                    <Text style={styles.selectedConsultantLabel}>선택된 상담사</Text>
                    <Text style={styles.selectedConsultantName}>{selectedConsultant.name}</Text>
                    <Text style={styles.selectedConsultantEmail}>{selectedConsultant.email}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changeConsultantButton}
                    onPress={() => setSelectedConsultant(null)}
                  >
                    <Text style={styles.changeConsultantButtonText}>변경</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 활성 내담자 목록 */}
            {selectedConsultant && (
              <View style={styles.modalBody}>
                <Text style={styles.sectionTitle}>활성 내담자 목록</Text>
                {(() => {
                  const unmappedClients = getUnmappedClientsForConsultant(selectedConsultant.id);
                  console.log('📋 매칭 모달 - 상담사:', selectedConsultant.name, 'ID:', selectedConsultant.id);
                  console.log('📋 매칭 모달 - 전체 내담자 수:', clients.length);
                  console.log('📋 매칭 모달 - 전체 내담자 샘플:', clients.slice(0, 5).map(c => ({ id: c.id, name: c.name, role: c.role, isDeleted: c.isDeleted })));
                  console.log('📋 매칭 모달 - 활성 미매칭 내담자 수:', unmappedClients.length);
                  console.log('📋 매칭 모달 - 활성 미매칭 내담자 목록:', unmappedClients.map(c => ({ id: c.id, name: c.name, email: c.email })));
                  
                  return unmappedClients.length > 0 ? (
                    <FlatList
                      data={unmappedClients}
                      keyExtractor={(item) => `client-${item.id}`}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.clientListItem}
                          onPress={() => handleSelectClient(item)}
                          disabled={isCreatingMapping}
                        >
                          <View style={styles.clientListItemInfo}>
                            <Text style={styles.clientListItemName}>{item.name}</Text>
                            <Text style={styles.clientListItemEmail}>{item.email}</Text>
                          </View>
                          <View style={styles.clientListItemAction}>
                            <Link size={SIZES.ICON.SM} color={COLORS.primary} />
                          </View>
                        </TouchableOpacity>
                      )}
                      showsVerticalScrollIndicator={true}
                      ListEmptyComponent={
                        <View style={styles.modalEmptyState}>
                          <Text style={styles.modalEmptyText}>
                            배정 가능한 활성 내담자가 없습니다.
                          </Text>
                        </View>
                      }
                    />
                  ) : (
                    <View style={styles.modalEmptyState}>
                      <Users size={SIZES.ICON.XL} color={COLORS.gray400} />
                      <Text style={styles.modalEmptyText}>
                        이 상담사와 배정 가능한 활성 내담자가 없습니다.
                      </Text>
                    </View>
                  );
                })()}
              </View>
            )}

            {/* 모달 푸터 */}
            <View style={styles.modalFooter}>
              <MGButton
                variant="outline"
                size="medium"
                onPress={handleCloseAddMappingModal}
                disabled={isCreatingMapping}
                style={styles.modalCancelButton}
              >
                {STRINGS.COMMON.CANCEL || '취소'}
              </MGButton>
            </View>

            {/* 로딩 오버레이 */}
            {isCreatingMapping && (
              <View style={styles.modalLoadingOverlay}>
                <UnifiedLoading text={STRINGS.COMMON.LOADING} size="large" />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 결제 정보 입력 모달 */}
      <Modal
        visible={showPaymentInfoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClosePaymentInfoModal}
      >
        <View style={modalOverlayStyle}>
          <View style={styles.paymentModalContent}>
            {/* 모달 헤더 */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{STRINGS.MAPPING.PAYMENT_INFO_TITLE}</Text>
              <TouchableOpacity
                onPress={handleClosePaymentInfoModal}
                style={styles.modalCloseButton}
                hitSlop={TOUCH_TARGET.closeButton}
              >
                <X size={SIZES.ICON.MD} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            {/* 선택된 상담사 및 내담자 정보 */}
            {selectedConsultant && selectedClientForMapping && (
              <View style={styles.paymentInfoSection}>
                <View style={styles.selectedPairInfo}>
                  <Text style={styles.pairInfoLabel}>{STRINGS.MAPPING.PAYMENT_INFO_SECTION}</Text>
                  <Text style={styles.pairInfoText}>
                    상담사: {selectedConsultant.name}
                  </Text>
                  <Text style={styles.pairInfoText}>
                    내담자: {selectedClientForMapping.name}
                  </Text>
                </View>
              </View>
            )}

            {/* 결제 정보 입력 폼 */}
            <ScrollView style={styles.paymentFormScroll} contentContainerStyle={styles.paymentFormContainer}>
              {/* 회기 수 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{STRINGS.MAPPING.SESSIONS_COUNT}</Text>
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

              {/* 패키지명 - 동적 옵션 사용 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{STRINGS.MAPPING.PACKAGE_NAME}</Text>
                {loadingOptions ? (
                  <UnifiedLoading text={STRINGS.COMMON.LOADING} size="small" />
                ) : packageOptions.length > 0 ? (
                  <FlatList
                    data={packageOptions}
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
                    placeholder={STRINGS.MAPPING.PACKAGE_NAME_PLACEHOLDER}
                  />
                )}
              </View>

              {/* 패키지 가격 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{STRINGS.MAPPING.PACKAGE_PRICE}</Text>
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
                  placeholder={STRINGS.MAPPING.PACKAGE_PRICE_PLACEHOLDER}
                />
              </View>

              {/* 결제 방법 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{STRINGS.MAPPING.PAYMENT_METHOD}</Text>
                {loadingOptions ? (
                  <UnifiedLoading text={STRINGS.COMMON.LOADING} size="small" />
                ) : (
                  <View style={styles.paymentMethodButtons}>
                    {(paymentMethodOptions.length > 0 ? paymentMethodOptions : PAYMENT_METHOD_OPTIONS.map(m => ({
                      value: m,
                      label: m,
                      codeValue: m
                    }))).map((option) => {
                      const method = typeof option === 'string' ? option : option.value || option.label;
                      return (
                        <TouchableOpacity
                          key={method}
                          style={[
                            styles.paymentMethodButton,
                            paymentInfo.paymentMethod === method && styles.paymentMethodButtonSelected
                          ]}
                          onPress={() => handlePaymentMethodChange(method)}
                        >
                          <Text style={[
                            styles.paymentMethodButtonText,
                            paymentInfo.paymentMethod === method && styles.paymentMethodButtonTextSelected
                          ]}>
                            {typeof option === 'string' ? option : option.label || option.value}
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
                  <Text style={styles.formLabel}>{STRINGS.MAPPING.PAYMENT_REFERENCE}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={paymentInfo.paymentReference}
                    onChangeText={(text) => setPaymentInfo(prev => ({
                      ...prev,
                      paymentReference: text
                    }))}
                    placeholder={STRINGS.MAPPING.PAYMENT_REFERENCE_PLACEHOLDER}
                  />
                </View>
              )}

              {/* 책임자 - 동적 옵션 사용 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{STRINGS.MAPPING.RESPONSIBILITY}</Text>
                {loadingOptions ? (
                  <UnifiedLoading text={STRINGS.COMMON.LOADING} size="small" />
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
                    placeholder={STRINGS.MAPPING.RESPONSIBILITY_PLACEHOLDER}
                  />
                )}
              </View>

              {/* 특별 고려사항 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{STRINGS.MAPPING.SPECIAL_CONSIDERATIONS}</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={paymentInfo.specialConsiderations}
                  onChangeText={(text) => setPaymentInfo(prev => ({
                    ...prev,
                    specialConsiderations: text
                  }))}
                  placeholder={STRINGS.MAPPING.SPECIAL_CONSIDERATIONS_PLACEHOLDER}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* 메모 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{STRINGS.MAPPING.NOTES}</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={paymentInfo.notes}
                  onChangeText={(text) => setPaymentInfo(prev => ({
                    ...prev,
                    notes: text
                  }))}
                  placeholder={STRINGS.MAPPING.NOTES_PLACEHOLDER}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* 모달 푸터 */}
            <View style={styles.modalFooter}>
              <MGButton
                variant="outline"
                size="medium"
                onPress={handleClosePaymentInfoModal}
                disabled={isCreatingMapping}
                style={styles.modalCancelButton}
              >
                취소
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

            {/* 로딩 오버레이 */}
            {isCreatingMapping && (
              <View style={styles.modalLoadingOverlay}>
                <UnifiedLoading text={STRINGS.MAPPING.CREATING_MAPPING} size="large" />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 세션 상태 모달 */}
      <Modal
        visible={showSessionStatusModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseSessionStatusModal}
      >
        <View style={modalOverlayStyle}>
          <View style={styles.paymentModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>세션 상태</Text>
              <TouchableOpacity
                onPress={handleCloseSessionStatusModal}
                style={styles.modalCloseButton}
                hitSlop={TOUCH_TARGET.closeButton}
              >
                <X size={SIZES.ICON.MD} color={COLORS.dark} />
              </TouchableOpacity>
            </View>
            
            {selectedMappingForSession ? (
              <ScrollView 
                style={styles.paymentFormScroll} 
                contentContainerStyle={styles.sessionStatusContentContainer}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {(() => {
                  const mappingInfo = getMappingInfo(selectedMappingForSession);
                  const remainingSessions = selectedMappingForSession?.remainingSessions || 0;
                  const totalSessions = selectedMappingForSession?.totalSessions || 0;
                  const usedSessions = mappingInfo.usedSessions;
                  
                  return (
                    <>
                      {/* 매칭 정보 */}
                      <View style={styles.sessionStatusSection}>
                        <Text style={styles.sessionStatusLabel}>배정 정보</Text>
                        <Text style={styles.sessionStatusText}>
                          상담사: {mappingInfo.consultantName}
                        </Text>
                        <Text style={styles.sessionStatusText}>
                          내담자: {mappingInfo.clientName}
                        </Text>
                      </View>
                      
                      {/* 세션 현황 */}
                      <View style={styles.sessionStatusSection}>
                        <Text style={styles.sessionStatusLabel}>회기 현황</Text>
                        <View style={styles.sessionStatsGrid}>
                          <View style={styles.sessionStatCard}>
                            <Text style={styles.sessionStatNumber}>{totalSessions}</Text>
                            <Text style={styles.sessionStatLabel}>총 회기</Text>
                          </View>
                          <View style={[styles.sessionStatCard, styles.sessionStatCardUsed]}>
                            <Text style={styles.sessionStatNumber}>{usedSessions}</Text>
                            <Text style={styles.sessionStatLabel}>사용 회기</Text>
                          </View>
                          <View style={[styles.sessionStatCard, styles.sessionStatCardRemaining]}>
                            <Text style={[styles.sessionStatNumber, remainingSessions === 0 && styles.sessionStatNumberWarning]}>
                              {remainingSessions}
                            </Text>
                            <Text style={styles.sessionStatLabel}>남은 회기</Text>
                          </View>
                        </View>
                      </View>
                      
                      {/* 패키지 정보 */}
                      {selectedMappingForSession.packageName && (
                        <View style={styles.sessionStatusSection}>
                          <Text style={styles.sessionStatusLabel}>패키지</Text>
                          <Text style={styles.sessionStatusText}>
                            {selectedMappingForSession.packageName}
                          </Text>
                          {selectedMappingForSession.packagePrice > 0 && (
                            <Text style={styles.sessionStatusText}>
                              가격: {selectedMappingForSession.packagePrice.toLocaleString()}원
                            </Text>
                          )}
                        </View>
                      )}
                      
                      {/* 경고 메시지 */}
                      {remainingSessions === 0 && (
                        <View style={styles.sessionWarningBox}>
                          <Text style={styles.sessionWarningBoxText}>
                            ⚠️ 남은 세션이 없습니다. 회기 추가가 필요합니다.
                          </Text>
                        </View>
                      )}
                    </>
                  );
                })()}
              </ScrollView>
            ) : (
              <ScrollView 
                style={styles.paymentFormScroll} 
                contentContainerStyle={styles.sessionStatusEmptyContainer}
              >
                <View style={styles.sessionStatusSection}>
                  <Text style={styles.sessionStatusText}>매핑 정보를 불러올 수 없습니다.</Text>
                </View>
              </ScrollView>
            )}
            
            <View style={styles.modalFooter}>
              {selectedMappingForSession && (selectedMappingForSession?.remainingSessions || 0) === 0 && (
                <MGButton
                  variant="warning"
                  size="medium"
                  onPress={() => {
                    handleCloseSessionStatusModal();
                    handleOpenSessionExtensionModal(selectedMappingForSession);
                  }}
                  style={styles.modalSubmitButton}
                >
                  회기 추가
                </MGButton>
              )}
              <MGButton
                variant="outline"
                size="medium"
                onPress={handleCloseSessionStatusModal}
                style={styles.modalCancelButton}
              >
                닫기
              </MGButton>
            </View>
          </View>
        </View>
      </Modal>

      {/* 세션 추가 모달 (SessionManagement와 동일) */}
      <Modal
        visible={showSessionExtensionModal}
        animationType="slide"
        transparent={true}
        presentationStyle="overFullScreen"
        statusBarTranslucent={true}
        onRequestClose={handleCloseSessionExtensionModal}
      >
        <View style={modalOverlayStyle}>
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
                  <Text style={styles.sessionExtensionLabel}>배정 정보</Text>
                  <Text style={styles.sessionExtensionText}>
                    {mappingInfo.consultantName} - {mappingInfo.clientName}
                  </Text>
                  <Text style={styles.sessionExtensionText}>
                    현재 세션: {mappingInfo.remainingSessions || 0}회
                  </Text>
                </View>
              );
            })()}

            <View style={styles.sessionExtensionForm}>
              <Text style={styles.sessionExtensionLabel}>추가할 세션 개수</Text>
              
              {/* 빠른 선택 버튼 */}
              <View style={styles.quickSessionButtons}>
                {[5, 10, 20, 30, 50, 100].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.quickSessionButton,
                      extensionSessions === count && styles.quickSessionButtonSelected
                    ]}
                    onPress={() => setExtensionSessions(count)}
                  >
                    <Text style={[
                      styles.quickSessionButtonText,
                      extensionSessions === count && styles.quickSessionButtonTextSelected
                    ]}>
                      {count}회
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 직접 입력 */}
              <View style={styles.sessionInputContainer}>
                <View style={styles.sessionInputRow}>
                  <Text style={styles.sessionExtensionLabel}>직접 입력:</Text>
                  <View style={styles.sessionInputWrapper}>
                    <TouchableOpacity
                      style={styles.sessionInputButton}
                      onPress={() => setExtensionSessions(Math.max(1, extensionSessions - 1))}
                    >
                      <Text style={styles.sessionInputButtonText}>−</Text>
                    </TouchableOpacity>
                    <View style={styles.sessionInputValueContainer}>
                      <Text style={styles.sessionInputValue}>{extensionSessions}</Text>
                      <Text style={styles.sessionInputUnit}>회</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.sessionInputButton}
                      onPress={() => setExtensionSessions(Math.min(1000, extensionSessions + 1))}
                    >
                      <Text style={styles.sessionInputButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* 예상 결과 */}
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
            </View>

            {/* 버튼 */}
            <View style={styles.modalButtonContainer}>
              <MGButton
                variant="secondary"
                size="medium"
                fullWidth
                onPress={handleCloseSessionExtensionModal}
                disabled={isExtendingSessions}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonTextSecondary}>취소</Text>
              </MGButton>
              <MGButton
                variant="primary"
                size="medium"
                fullWidth
                loading={isExtendingSessions}
                onPress={handleExtendSessions}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>세션 추가</Text>
              </MGButton>
            </View>
          </View>
        </View>
      </Modal>

      {/* 결제 확인 모달 */}
      <Modal
        visible={showPaymentConfirmationModal}
        animationType="slide"
        transparent={true}
        presentationStyle="overFullScreen"
        statusBarTranslucent={true}
        onRequestClose={handleClosePaymentConfirmationModal}
      >
        <View style={modalOverlayStyle}>
          <View style={styles.paymentModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{STRINGS.MAPPING.CONFIRM_PAYMENT_TITLE}</Text>
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
              return (
                <ScrollView 
                  style={styles.paymentFormScroll} 
                  contentContainerStyle={styles.paymentFormContainer}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* 매핑 정보 */}
                  <View style={styles.paymentInfoSection}>
                    <Text style={styles.pairInfoText}>
                      상담사: {mappingInfo.consultantName}
                    </Text>
                    <Text style={styles.pairInfoText}>
                      내담자: {mappingInfo.clientName}
                    </Text>
                    <Text style={styles.pairInfoText}>
                      금액: {selectedMappingForPayment.packagePrice || selectedMappingForPayment.paymentAmount || 0}원
                    </Text>
                  </View>

                  {/* 결제 방법 */}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>결제 방법</Text>
                    {loadingOptions ? (
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
                onPress={handleConfirmPayment}
                loading={isConfirmingPayment}
                style={styles.modalSubmitButton}
              >
                {STRINGS.MAPPING.CONFIRM_PAYMENT}
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
  contentContainer: {
    padding: SPACING.md,
  },
  // 통계 스타일은 Presentational 컴포넌트로 이동됨
  consultantList: {
    gap: SPACING.md,
  },
  consultantCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  consultantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  consultantInfo: {
    flex: 1,
  },
  consultantName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  consultantEmail: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
  },
  consultantStats: {
    alignItems: 'flex-end',
  },
  clientCount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  mappedClients: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  clientInfo: {
    flex: 1,
    paddingRight: SPACING.lg,
  },
  clientName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  clientEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  mappingDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
  },
  unlinkButton: {
    padding: SPACING.xs,
  },
  noClients: {
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
  },
  noClientsText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
  },
  addMappingContainer: {
    alignItems: 'flex-start',
  },
  addButton: {
    marginTop: SPACING.sm,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  unmappedClients: {
    gap: SPACING.sm,
  },
  unmappedClientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  clientStatus: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
  },
  matchButton: {
    marginTop: 0,
  },
  matchButtonText: {
    color: COLORS.white,
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
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
    paddingBottom: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
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
  selectedConsultantInfo: {
    padding: SPACING.md,
    backgroundColor: COLORS.primary10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedConsultantLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  selectedConsultantName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  selectedConsultantEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
  },
  modalBody: {
    flex: 1,
    minHeight: 200,
    maxHeight: 400,
    padding: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SPACING.md,
  },
  clientStatusBadge: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    marginTop: SPACING.xs / 2,
  },
  clientListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  clientListItemInfo: {
    flex: 1,
  },
  clientListItemName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  clientListItemEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
  },
  clientListItemAction: {
    marginLeft: SPACING.md,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalCancelButton: {
    minWidth: 100,
  },
  modalEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalEmptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  modalLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 상담사 선택 섹션 스타일
  consultantSelectionSection: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 300,
  },
  sectionTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SPACING.md,
  },
  consultantSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  consultantSelectInfo: {
    flex: 1,
  },
  consultantSelectName: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SPACING.xs / 2,
  },
  consultantSelectEmail: {
    ...TYPOGRAPHY.body2,
    color: COLORS.gray600,
  },
  consultantSelectAction: {
    padding: SPACING.xs,
  },
  selectedConsultantHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  selectedConsultantContent: {
    flex: 1,
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
    fontWeight: '600',
  },
  // 결제 정보 입력 모달 스타일
  paymentModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
    paddingBottom: SPACING.lg,
    flex: 1,
    flexDirection: 'column',
  },
  paymentInfoSection: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedPairInfo: {
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  pairInfoLabel: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  pairInfoText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.dark,
    marginBottom: SPACING.xs / 2,
  },
  paymentFormScroll: {
    flex: 1,
  },
  paymentFormContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  formInput: {
    ...TYPOGRAPHY.body1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.dark,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sessionsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sessionsButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionsButtonText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  sessionsInput: {
    flex: 1,
    ...TYPOGRAPHY.body1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  paymentMethodButtonSelected: {
    backgroundColor: COLORS.primary20,
    borderColor: COLORS.primary,
  },
  paymentMethodButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.dark,
  },
  paymentMethodButtonTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalSubmitButton: {
    minWidth: 120,
    marginLeft: SPACING.sm,
  },
  // 패키지 옵션 버튼 스타일
  packageOptionButton: {
    padding: SPACING.md,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 120,
    alignItems: 'center',
  },
  packageOptionButtonSelected: {
    backgroundColor: COLORS.primary20,
    borderColor: COLORS.primary,
  },
  packageOptionText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.dark,
    marginBottom: SPACING.xs / 2,
  },
  packageOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  packageOptionPrice: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
  },
  // 책임자 옵션 버튼 스타일
  responsibilityOptionButton: {
    padding: SPACING.md,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 100,
    alignItems: 'center',
  },
  responsibilityOptionButtonSelected: {
    backgroundColor: COLORS.primary20,
    borderColor: COLORS.primary,
  },
  responsibilityOptionText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.dark,
  },
  responsibilityOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  // 세션 정보 표시 스타일
  clientInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs / 2,
  },
  sessionWarningBadge: {
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.xs,
  },
  sessionWarningText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    fontWeight: '600',
  },
  sessionInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
    flexWrap: 'wrap',
  },
  sessionInfoText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.dark,
    fontWeight: '600',
  },
  remainingSessionsText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.success,
    fontWeight: '600',
  },
  remainingSessionsTextWarning: {
    color: COLORS.error,
  },
  clientItemActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    flexShrink: 0,
  },
  extendSessionButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  extendSessionButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
  },
  // 세션 상태 모달 스타일
  sessionStatusEmptyContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    minHeight: SIZES.MODAL.MIN_HEIGHT_EMPTY,
  },
  sessionStatusContentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    minHeight: SIZES.MODAL.MIN_HEIGHT_CONTENT,
  },
  sessionStatusSection: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sessionStatusLabel: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SPACING.md,
  },
  sessionStatusText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  sessionStatsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  sessionStatCard: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  sessionStatCardUsed: {
    backgroundColor: COLORS.primary10,
  },
  sessionStatCardRemaining: {
    backgroundColor: COLORS.success10,
  },
  sessionStatNumber: {
    ...TYPOGRAPHY.h2,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: SPACING.xs / 2,
  },
  sessionStatLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
  },
  sessionStatNumberWarning: {
    color: COLORS.error,
  },
  sessionWarningBox: {
    backgroundColor: COLORS.error10,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error30,
  },
  sessionWarningBoxText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.error,
    fontWeight: '600',
  },
  // 세션 추가 모달 스타일 (SessionManagement와 동일)
  sessionExtensionInfo: {
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  sessionExtensionLabel: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  sessionExtensionText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.dark,
    marginBottom: SPACING.xs / 2,
  },
  sessionExtensionForm: {
    marginBottom: SPACING.lg,
  },
  quickSessionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickSessionButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSessionButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickSessionButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.dark,
    fontWeight: '600',
  },
  quickSessionButtonTextSelected: {
    color: COLORS.white,
  },
  sessionInputContainer: {
    marginBottom: SPACING.lg,
  },
  sessionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  sessionInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    overflow: 'hidden',
  },
  sessionInputButton: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInputButtonText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.dark,
    fontWeight: 'bold',
  },
  sessionInputValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    minWidth: 80,
    justifyContent: 'center',
  },
  sessionInputValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.dark,
    fontWeight: 'bold',
    marginRight: SPACING.xs,
  },
  sessionInputUnit: {
    ...TYPOGRAPHY.body2,
    color: COLORS.gray600,
  },
  sessionExtensionResult: {
    backgroundColor: COLORS.success10,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  sessionExtensionResultLabel: {
    ...TYPOGRAPHY.body2,
    color: COLORS.gray600,
    marginBottom: SPACING.xs / 2,
  },
  sessionExtensionResultValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.success,
    fontWeight: 'bold',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButton: {
    flex: 1,
  },
  modalButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  modalButtonTextSecondary: {
    ...TYPOGRAPHY.button,
    color: COLORS.dark,
  },
  modalDescription: {
    ...TYPOGRAPHY.body1,
    color: COLORS.gray600,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  // 결제 확인 버튼 스타일
  confirmPaymentButton: {
    marginRight: SPACING.xs,
  },
  confirmPaymentButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default MappingManagement;


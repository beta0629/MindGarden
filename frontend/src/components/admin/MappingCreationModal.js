import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedModal from '../common/modals/UnifiedModal';
import {
  User,
  Package,
  UserCircle,
  CreditCard,
  Link2,
  CheckCircle,
  Search,
  Check,
  AlertCircle
} from 'lucide-react';
import { apiGet, apiPost } from '../../utils/ajax';
import { getAllConsultantsWithStats } from '../../utils/consultantHelper';
import notificationManager from '../../utils/notification';
import SearchInput from '../dashboard-v2/atoms/SearchInput';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import Avatar from '../common/Avatar';
import BadgeSelect from '../common/BadgeSelect';
import { DEFAULT_MAPPING_CONFIG } from '../../constants/mapping';
import { toDisplayString } from '../../utils/safeDisplay';
import SafeText from '../common/SafeText';
import '../schedule/ScheduleB0KlA.css';
import './MappingCreationModal.css';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_ADMIN_CLIENTS_WITH_MAPPING_INFO = '/api/v1/admin/clients/with-mapping-info';
/**
 * 매칭 생성 모달 - 플로우형 UI (상담사 → 패키지 → 내담자 → 결제)
 * B0KlA 토큰, mg-v2-* 클래스, lucide-react 아이콘 적용
 *
 * @author Core Solution
 * @since 2024-12-19
 * @updated 2025-02-22 - 전면 재구성 (플로우형)
 */
const STEPS_CONFIG = [
  { key: 1, labelKey: 'admin:mappingCreation.step.consultant', labelFallback: '상담사', icon: User },
  { key: 2, labelKey: 'admin:mappingCreation.step.package', labelFallback: '패키지', icon: Package },
  { key: 3, labelKey: 'admin:mappingCreation.step.client', labelFallback: '내담자', icon: UserCircle },
  { key: 4, labelKey: 'admin:mappingCreation.step.paymentLabel', labelFallback: '결제', icon: CreditCard },
  { key: 5, labelKey: 'admin:mappingCreation.step.complete', labelFallback: '완료', icon: CheckCircle }
];

const MappingCreationModal = ({ isOpen, onClose, onMappingCreated }) => {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [consultants, setConsultants] = useState([]);
  const [clients, setClients] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [consultantSearchTerm, setConsultantSearchTerm] = useState('');
  const [filteredConsultants, setFilteredConsultants] = useState([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState([]);
  const [clientFilterStatus, setClientFilterStatus] = useState('ALL');
  const [clientSortBy, setClientSortBy] = useState('name');
  const [loading, setLoading] = useState(false);
  const [packageOptions, setPackageOptions] = useState([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = useState([]);
  const [responsibilityOptions, setResponsibilityOptions] = useState([]);
  const [loadingPackageCodes, setLoadingPackageCodes] = useState(false);

  const [paymentInfo, setPaymentInfo] = useState({
    totalSessions: DEFAULT_MAPPING_CONFIG.TOTAL_SESSIONS,
    packageName: DEFAULT_MAPPING_CONFIG.PACKAGE_NAME,
    packagePrice: DEFAULT_MAPPING_CONFIG.PACKAGE_PRICE,
    paymentMethod: 'BANK_TRANSFER',
    paymentReference: '',
    responsibility: DEFAULT_MAPPING_CONFIG.RESPONSIBILITY,
    specialConsiderations: '',
    notes: '',
    // 옵션 B (예약 우선 매칭): ADVANCE = 선납 입금(현행) / SAME_DAY_CARD = 사후 카드 결제
    paymentTiming: 'ADVANCE'
  });

  const generateReferenceNumber = (method = 'BANK_TRANSFER') => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    if (method === 'CASH') return `CASH_${timestamp}`;
    if (method === 'CARD') return `CARD_${timestamp}`;
    if (method === 'BANK_TRANSFER') return `BANK_${timestamp}`;
    return `${method}_${timestamp}`;
  };

  const loadPackageCodes = useCallback(async() => {
    try {
      setLoadingPackageCodes(true);
      const { getTenantCodes } = await import('../../utils/commonCodeApi');
      const response = await getTenantCodes('CONSULTATION_PACKAGE');
      if (response && response.length > 0) {
        const options = response.map(code => {
          let sessions = 20;
          let price = 0;
          if (code.codeValue.startsWith('SINGLE_')) {
            sessions = 1;
            const priceStr = code.codeValue.replace('SINGLE_', '');
            price = parseInt(priceStr, 10) || 0;
            if (code.extraData) {
              try {
                const extra = JSON.parse(code.extraData);
                if (extra.price != null) price = parseFloat(extra.price) || price;
              } catch (e) {
                console.warn('SINGLE_ extraData parse failed:', code.codeValue);
              }
            }
          } else if (code.extraData) {
            try {
              const extra = JSON.parse(code.extraData);
              if (extra.price != null) price = parseFloat(extra.price) || 0;
              if (extra.sessions != null) sessions = parseInt(extra.sessions, 10) || 20;
            } catch (e) {
              console.warn('Package extraData parse failed:', code.codeValue);
            }
            if (price === 0 && code.codeDescription) {
              const p = parseFloat(code.codeDescription);
              if (!isNaN(p) && p > 0) price = p;
            }
          }
          let label = code.koreanName || code.codeLabel || code.codeValue;
          if (code.codeValue === 'BASIC') label = t('admin:mappingCreation.package.basic');
          if (code.codeValue === 'STANDARD') label = t('admin:mappingCreation.package.standard');
          if (code.codeValue === 'PREMIUM') label = t('admin:mappingCreation.package.premium');
          if (code.codeValue === 'VIP') label = t('admin:mappingCreation.package.vip');
          return { value: code.codeValue, label, sessions, price };
        });
        setPackageOptions(options);
      } else {
        notificationManager.warning(t('admin:mappingCreation.error.noPackage'));
        setPackageOptions([]);
      }
    } catch (error) {
      console.error('패키지 코드 로드 실패:', error);
      notificationManager.error(t('admin:mappingCreation.error.packageLoad'));
      setPackageOptions([]);
    } finally {
      setLoadingPackageCodes(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const lastPkg = localStorage.getItem('lastUsedPackage');
      const lastMethod = localStorage.getItem('lastUsedPaymentMethod');
      if (lastPkg) {
        try {
          const saved = JSON.parse(lastPkg);
          const found = packageOptions.find(p => p.label === saved.packageName || p.value === saved.packageName);
          if (found) {
            setPaymentInfo(prev => ({
              ...prev,
              packageName: found.label,
              totalSessions: found.sessions || saved.totalSessions,
              packagePrice: found.price || saved.packagePrice
            }));
          }
        } catch (e) {
          console.warn('lastUsedPackage parse failed');
        }
      }
        if (lastMethod && paymentMethodOptions.some(m => m.value === lastMethod)) {
        setPaymentInfo(prev => ({
          ...prev,
          paymentMethod: lastMethod,
          paymentReference: generateReferenceNumber(lastMethod)
        }));
      } else if (!paymentInfo.paymentReference) {
        setPaymentInfo(prev => ({ ...prev, paymentReference: generateReferenceNumber(prev.paymentMethod) }));
      }
    }
  }, [isOpen, packageOptions, paymentMethodOptions]);

  useEffect(() => {
    if (isOpen) {
      loadConsultants();
      loadClients();
      loadMappings();
      loadCodeOptions();
      loadPackageCodes();
    }
  }, [isOpen, loadPackageCodes]);

  useEffect(() => {
    if (consultantSearchTerm.trim() === '') {
      setFilteredConsultants(consultants);
    } else {
      const q = consultantSearchTerm.toLowerCase();
      setFilteredConsultants(consultants.filter(c =>
        c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
      ));
    }
  }, [consultants, consultantSearchTerm]);

  useEffect(() => {
    let filtered = clients;
    if (clientSearchTerm.trim()) {
      const q = clientSearchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
      );
    }
    if (clientFilterStatus !== 'ALL') {
      filtered = filtered.filter(client => {
        const hasMapping = mappings.some(m => m.clientId === client.id && m.status === clientFilterStatus);
        return clientFilterStatus === 'NO_MAPPING' ? !hasMapping : hasMapping;
      });
    }
    filtered = filtered.sort((a, b) => {
      if (clientSortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (clientSortBy === 'email') return (a.email || '').localeCompare(b.email || '');
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    setFilteredClients(filtered);
  }, [clientSearchTerm, clientFilterStatus, clientSortBy, clients, mappings]);

  const loadConsultants = async() => {
    try {
      const list = await getAllConsultantsWithStats();
      if (list?.length) {
        setConsultants(list.map(item => {
          const c = item.consultant || {};
          return {
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            role: c.role,
            profileImageUrl: c.profileImageUrl ?? null,
            currentClients: item.currentClients || 0,
            totalClients: item.totalClients || 0
          };
        }));
      } else setConsultants([]);
    } catch (e) {
      console.error('상담사 목록 로드 오류:', e);
      setConsultants([]);
    }
  };

  const loadClients = async() => {
    try {
      const res = await apiGet(API_ADMIN_CLIENTS_WITH_MAPPING_INFO);
      const arr = res?.clients ?? (Array.isArray(res) ? res : []);
      setClients(arr);
    } catch (e) {
      console.error('내담자 목록 로드 실패:', e);
      setClients([]);
    }
  };

  const loadMappings = async() => {
    try {
      const res = await apiGet(API_ENDPOINTS.ADMIN.MAPPINGS.LIST);
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.mappings) ? res.mappings : Array.isArray(res) ? res : [];
      setMappings(list);
    } catch (e) {
      console.error('매칭 로드 실패:', e);
    }
  };

  const loadCodeOptions = async() => {
    try {
      const { getTenantCodes } = await import('../../utils/commonCodeApi');
      const paymentCodes = await getTenantCodes('PAYMENT_METHOD');
      if (paymentCodes?.length) {
        setPaymentMethodOptions(paymentCodes.map(c => ({ value: c.codeValue, label: c.codeLabel || c.koreanName })));
      }
      const respCodes = await getTenantCodes('RESPONSIBILITY');
      if (respCodes?.length) {
        setResponsibilityOptions(respCodes.map(c => ({ value: c.codeValue, label: c.codeLabel || c.koreanName })));
      }
    } catch (e) {
      console.error('코드 옵션 로드 오류:', e);
    }
  };

  const handleCreateMapping = async() => {
    // P0 핫픽스 2026-05-28: 신규 매칭 생성 진입 가드 강화.
    // 누락된 필드는 후속 CheckoutSameDayModal/결제 흐름에서 NPE를 유발한다.
    if (!selectedConsultant?.id || !selectedClient?.id) {
      notificationManager.warning(t('admin:mappingCreation.warn.selectBoth'));
      return;
    }
    if (!paymentInfo.packageName
        || !((paymentInfo.totalSessions || 0) > 0)
        || !((paymentInfo.packagePrice || 0) > 0)) {
      notificationManager.error(t('admin:mappingCreation.warn.missingPackage', '패키지·회기수·가격을 모두 선택해 주세요.'));
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const isSameDayCard = paymentInfo.paymentTiming === 'SAME_DAY_CARD';
      const mappingData = {
        consultantId: selectedConsultant.id,
        clientId: selectedClient.id,
        startDate: new Date().toISOString().split('T')[0],
        status: 'PENDING_PAYMENT',
        notes: paymentInfo.notes,
        responsibility: paymentInfo.responsibility,
        specialConsiderations: paymentInfo.specialConsiderations,
        paymentStatus: 'PENDING',
        totalSessions: paymentInfo.totalSessions,
        // 옵션 B 사후 카드 결제: 신규 매칭에 회기를 즉시 부여하지 않고 PENDING_PAYMENT 유지.
        // confirmDeposit (checkoutSameDayCard 내부) 단계에서 totalSessions를 채운다.
        remainingSessions: isSameDayCard ? 0 : paymentInfo.totalSessions,
        packageName: paymentInfo.packageName,
        packagePrice: paymentInfo.packagePrice,
        paymentAmount: paymentInfo.packagePrice,
        paymentMethod: paymentInfo.paymentMethod,
        paymentReference: paymentInfo.paymentReference,
        mappingType: 'NEW',
        // P0 핫픽스 2026-05-28 (사용자 보고 + PAYMENT_TIMING_NULL_DEBUG.md H1):
        // 옵션 B 결제 방식 의도(ADVANCE / SAME_DAY_CARD)를 백엔드에 전달.
        // 백엔드 ConsultantClientMappingCreateRequest.paymentTiming 으로 바인딩되어
        // consultant_client_mappings.payment_timing 컬럼에 저장된다.
        // 이전: 필드 누락 → Jackson null 바인딩 → DB NULL → 사이드바 SAME_DAY_CARD 분기 깨짐.
        paymentTiming: paymentInfo.paymentTiming
      };
      const response = await apiPost(API_ENDPOINTS.ADMIN.MAPPINGS.LIST, mappingData);
      if (paymentInfo.packageName) {
        localStorage.setItem('lastUsedPackage', JSON.stringify({
          packageName: paymentInfo.packageName,
          totalSessions: paymentInfo.totalSessions,
          packagePrice: paymentInfo.packagePrice
        }));
      }
      if (paymentInfo.paymentMethod) {
        localStorage.setItem('lastUsedPaymentMethod', paymentInfo.paymentMethod);
      }
      notificationManager.success(
        t('admin:mappingCreation.success', {
          consultant: toDisplayString(selectedConsultant.name),
          client: toDisplayString(selectedClient.name)
        })
      );
      setStep(5);
      // 옵션 B: 사후 카드 분기는 새 매핑 ID를 후속 모달에 전달하기 위해 응답에서 추출.
      // P0 핫픽스 2026-05-28: CheckoutSameDayModal 진입 가드를 위해 매핑 식별·상담사·내담자·패키지 정보를 모두 함께 전달.
      const createdMappingId = response?.data?.id ?? response?.id ?? null;
      onMappingCreated?.({
        paymentTiming: paymentInfo.paymentTiming,
        mappingId: createdMappingId,
        consultantId: selectedConsultant.id,
        consultantName: selectedConsultant.name,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        packageName: paymentInfo.packageName,
        packagePrice: paymentInfo.packagePrice,
        totalSessions: paymentInfo.totalSessions
      });
    } catch (apiError) {
      const msg = apiError?.response?.data?.message || apiError?.message || t('admin:mappingCreation.error.createFailed');
      notificationManager.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setSelectedConsultant(null);
    setSelectedClient(null);
    // P0 핫픽스 2026-05-28: default 패키지 강제 제거 — 초기 state 와 동일하게 0/null 로 초기화.
    setPaymentInfo({
      totalSessions: 0,
      packageName: null,
      packagePrice: 0,
      paymentMethod: 'BANK_TRANSFER',
      paymentReference: '',
      responsibility: '',
      specialConsiderations: '',
      notes: '',
      paymentTiming: 'ADVANCE'
    });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // P0 핫픽스 2026-05-28 + 사용자 요청 step swap:
  // step 1=상담사, 2=내담자, 3=패키지(가드 강화), 4=결제(timing 확정).
  const canProceed = () => {
    if (step === 1) return !!selectedConsultant?.id;
    if (step === 2) return !!selectedClient?.id;
    if (step === 3) {
      return !!paymentInfo.packageName
        && (paymentInfo.totalSessions || 0) > 0
        && (paymentInfo.packagePrice || 0) > 0;
    }
    if (step === 4) {
      return ['ADVANCE', 'SAME_DAY_CARD'].includes(paymentInfo.paymentTiming);
    }
    return true;
  };

  const renderActions = () => (
    <div className="mg-modal__actions mg-v2-mapping-creation-modal__actions">
      {step > 1 && step < 5 && (
        <MGButton
          type="button"
          variant="outline"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading })}
          onClick={() => setStep(step - 1)}
          disabled={loading}
          preventDoubleClick={false}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        >
          {t('common:action.prev')}
        </MGButton>
      )}
      {step < 4 && (
        <MGButton
          type="button"
          variant="primary"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
          onClick={() => step <= 3 && setStep(step + 1)}
          disabled={!canProceed()}
          preventDoubleClick={false}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        >
          {t('common:action.next')}
        </MGButton>
      )}
      {step === 4 && (
        <MGButton
          type="button"
          variant="primary"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading })}
          onClick={handleCreateMapping}
          disabled={loading}
          loading={loading}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          preventDoubleClick={false}
        >
          {t('admin:mappingCreation.createMapping')}
        </MGButton>
      )}
      {step === 5 && (
        <MGButton
          type="button"
          variant="primary"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
          onClick={handleClose}
          preventDoubleClick={false}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        >
          {t('admin:actions.done')}
        </MGButton>
      )}
    </div>
  );

  const modalContent = (
    <div className="mg-v2-mapping-creation-modal-wrapper">
      <div className="mg-v2-ad-b0kla mg-v2-mapping-creation-modal">
        {/* 진행 단계 표시기 (mg-v2-ad-stepper - 스케줄 모달과 동일) */}
        <nav className="mg-v2-ad-stepper" aria-label={t('admin:mappingCreation.aria.steps')}>
          {STEPS_CONFIG.map((s, index) => {
            const Icon = s.icon;
            const isCompleted = step > s.key;
            const isCurrent = step === s.key;
            let statusClass = 'pending';
            if (isCompleted) statusClass = 'completed';
            if (isCurrent) statusClass = 'current';

            return (
              <React.Fragment key={s.key}>
                <div className={`mg-v2-ad-stepper__item ${statusClass}`}>
                  <div className="mg-v2-ad-stepper__icon">
                    {isCompleted ? <Check size={18} strokeWidth={2.5} /> : <Icon size={18} strokeWidth={isCurrent ? 2.5 : 2} />}
                  </div>
                  <SafeText className="mg-v2-ad-stepper__title" tag="span">{t(s.labelKey, s.labelFallback)}</SafeText>
                </div>
                {index < STEPS_CONFIG.length - 1 && (
                  <div className={`mg-v2-ad-stepper__line ${isCompleted ? 'completed' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* 1단계: 상담사 */}
        {step === 1 && (
          <section className="mg-v2-mapping-creation-modal__step-content">
            <h3 className="mg-v2-mapping-creation-modal__step-title">{t('admin:mappingCreation.step.selectConsultant')}</h3>
            <div className="mg-v2-mapping-creation-modal__search">
              <SearchInput
                value={consultantSearchTerm}
                onChange={setConsultantSearchTerm}
                placeholder={t('admin:mappingCreation.searchConsultantPlaceholder')}
              />
              <span className="mg-v2-mapping-creation-modal__count">
                {consultantSearchTerm
                  ? t('admin:mappingCreation.peopleCount', { count: filteredConsultants.length })
                  : t('admin:mappingCreation.totalPeople', { count: consultants.length })}
              </span>
            </div>
            <div className="mg-v2-mapping-creation-modal__grid">
              {filteredConsultants.length > 0 ? (
                filteredConsultants.map(c => (
                  <MGButton
                    key={c.id}
                    type="button"
                    variant="outline"
                    aria-pressed={selectedConsultant?.id === c.id}
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'md',
                      loading: false,
                      className: `mg-v2-mapping-creation-modal__card ${selectedConsultant?.id === c.id ? 'mg-v2-mapping-creation-modal__card--selected' : ''}`
                    })}
                    onClick={() => setSelectedConsultant(c)}
                    preventDoubleClick={false}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  >
                    <Avatar
                      profileImageUrl={c.profileImageUrl}
                      displayName={toDisplayString(c.name)}
                      className="mg-v2-mapping-creation-modal__avatar"
                    />
                    <div className="mg-v2-mapping-creation-modal__card-info">
                      <strong><SafeText tag="span">{c.name}</SafeText></strong>
                      <span title={toDisplayString(c.email) || undefined}>{toDisplayString(c.email)}</span>
                    </div>
                  </MGButton>
                ))
              ) : (
                <div className="mg-v2-mapping-creation-modal__empty">
                  <Search size={32} />
                  <p>{t('common:state.noResult')}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 3단계: 패키지 (사용자 요청 2026-05-28 step swap — 이전: 2단계) */}
        {step === 3 && (
          <section className="mg-v2-mapping-creation-modal__step-content">
            <h3 className="mg-v2-mapping-creation-modal__step-title">{t('admin:mappingCreation.step.selectPackage')}</h3>
            {loadingPackageCodes ? (
              <div className="mg-v2-mapping-creation-modal__loading">{t('admin:mappingCreation.packageLoading')}</div>
            ) : !packageOptions.length || packageOptions.every(p => !p.price || p.price <= 0) ? (
              <div className="mg-v2-mapping-creation-modal__missing-pkg">
                <AlertCircle size={40} />
                <h4>{t('admin:mappingCreation.noPackageData')}</h4>
                <p>{t('admin:mappingCreation.noPackageHint')}</p>
                <MGButton
                  type="button"
                  variant="primary"
                  size="medium"
                  className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
                  onClick={() => { onClose(); navigate('/admin/common-codes'); }}
                  preventDoubleClick={false}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                >
                  {t('admin:mappingCreation.goToCommonCodes')}
                </MGButton>
              </div>
            ) : (
              <div className="mg-v2-mapping-creation-modal__pkg-grid">
                {packageOptions.filter(p => p.price > 0).map(pkg => (
                  <MGButton
                    key={pkg.value}
                    type="button"
                    variant="outline"
                    aria-pressed={paymentInfo.packageName === pkg.label}
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'md',
                      loading: false,
                      className: `mg-v2-mapping-creation-modal__pkg-card ${paymentInfo.packageName === pkg.label ? 'mg-v2-mapping-creation-modal__pkg-card--selected' : ''}`
                    })}
                    onClick={() => setPaymentInfo(prev => ({
                      ...prev,
                      packageName: pkg.label,
                      totalSessions: pkg.sessions,
                      packagePrice: pkg.price
                    }))}
                    preventDoubleClick={false}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  >
                    <strong><SafeText tag="span">{pkg.label}</SafeText></strong>
                    <span>{t('admin:mappingCreation.packageSummary', { sessions: pkg.sessions, price: pkg.price.toLocaleString() })}</span>
                  </MGButton>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 2단계: 내담자 (사용자 요청 2026-05-28 step swap — 이전: 3단계) */}
        {step === 2 && (
          <section className="mg-v2-mapping-creation-modal__step-content">
            <h3 className="mg-v2-mapping-creation-modal__step-title">{t('admin:mappingCreation.step.selectClient')}</h3>
            <div className="mg-v2-mapping-creation-modal__filters">
              <SearchInput
                value={clientSearchTerm}
                onChange={setClientSearchTerm}
                placeholder={t('admin:mappingCreation.searchClientPlaceholder')}
              />
              <div className="mg-v2-mapping-creation-modal__filter-row">
                <BadgeSelect
                  size="small"
                  value={clientFilterStatus}
                  onChange={(val) => setClientFilterStatus(val)}
                  options={[
                    { value: 'ALL', label: t('admin:labels.all') },
                    { value: 'NO_MAPPING', label: t('admin:mappingCreation.filter.noMapping') },
                    { value: 'ACTIVE', label: t('admin:labels.active') },
                    { value: 'INACTIVE', label: t('admin:labels.inactive') },
                    { value: 'TERMINATED', label: t('admin:mappingCreation.filter.terminated') }
                  ]}
                  placeholder={t('admin:messages.pleaseSelect')}
                  className="mg-v2-form-badge-select mg-v2-mapping-creation-modal__select"
                />
                <BadgeSelect
                  size="small"
                  value={clientSortBy}
                  onChange={(val) => setClientSortBy(val)}
                  options={[
                    { value: 'name', label: t('admin:mappingCreation.sort.name') },
                    { value: 'email', label: t('admin:mappingCreation.sort.email') },
                    { value: 'createdAt', label: t('admin:mappingCreation.sort.createdAt') }
                  ]}
                  placeholder={t('admin:messages.pleaseSelect')}
                  className="mg-v2-form-badge-select mg-v2-mapping-creation-modal__select"
                />
              </div>
              <span className="mg-v2-mapping-creation-modal__count">{t('admin:mappingCreation.peopleCount', { count: filteredClients.length })}</span>
            </div>
            <div className="mg-v2-mapping-creation-modal__grid">
              {filteredClients.length > 0 ? (
                filteredClients.map(c => (
                  <MGButton
                    key={c.id}
                    type="button"
                    variant="outline"
                    aria-pressed={selectedClient?.id === c.id}
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'md',
                      loading: false,
                      className: `mg-v2-mapping-creation-modal__card ${selectedClient?.id === c.id ? 'mg-v2-mapping-creation-modal__card--selected' : ''}`
                    })}
                    onClick={() => setSelectedClient(c)}
                    preventDoubleClick={false}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  >
                    <Avatar
                      profileImageUrl={c.profileImageUrl}
                      displayName={toDisplayString(c.name)}
                      className="mg-v2-mapping-creation-modal__avatar"
                    />
                    <div className="mg-v2-mapping-creation-modal__card-info">
                      <strong><SafeText tag="span">{c.name}</SafeText></strong>
                      <span title={toDisplayString(c.email) || undefined}>{toDisplayString(c.email)}</span>
                    </div>
                  </MGButton>
                ))
              ) : (
                <div className="mg-v2-mapping-creation-modal__empty">
                  <Search size={32} />
                  <p>{t('common:state.noResult')}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 4단계: 결제 */}
        {step === 4 && (
          <section className="mg-v2-mapping-creation-modal__step-content">
            <h3 className="mg-v2-mapping-creation-modal__step-title">{t('admin:mappingCreation.step.payment')}</h3>
            {/* 옵션 B: 결제 방식 선택 (선납 / 사후 카드) — 합의서 §0 Q4 */}
            <fieldset
              className="mg-v2-mapping-creation-modal__payment-timing"
              aria-labelledby="mapping-creation-payment-timing-legend"
            >
              <legend
                id="mapping-creation-payment-timing-legend"
                className="mg-v2-mapping-creation-modal__payment-timing-legend"
              >
                {t('admin:mappingCreation.paymentTiming.title')}
              </legend>
              <label className="mg-v2-mapping-creation-modal__payment-timing-option">
                <input
                  type="radio"
                  name="mapping-creation-payment-timing"
                  value="ADVANCE"
                  checked={paymentInfo.paymentTiming === 'ADVANCE'}
                  onChange={() => setPaymentInfo(prev => ({ ...prev, paymentTiming: 'ADVANCE' }))}
                />
                <span>{t('admin:mappingCreation.paymentTiming.advance')}</span>
              </label>
              <label className="mg-v2-mapping-creation-modal__payment-timing-option">
                <input
                  type="radio"
                  name="mapping-creation-payment-timing"
                  value="SAME_DAY_CARD"
                  checked={paymentInfo.paymentTiming === 'SAME_DAY_CARD'}
                  onChange={() => setPaymentInfo(prev => ({ ...prev, paymentTiming: 'SAME_DAY_CARD' }))}
                />
                <span>{t('admin:mappingCreation.paymentTiming.sameDayCard')}</span>
              </label>
              {paymentInfo.paymentTiming === 'SAME_DAY_CARD' && (
                <p className="mg-v2-mapping-creation-modal__payment-timing-hint">
                  {t('admin:mappingCreation.paymentTiming.sameDayCardHint')}
                </p>
              )}
            </fieldset>
            <div className="mg-v2-mapping-creation-modal__summary-bar">
              <span className="mg-v2-mapping-creation-modal__summary-segment mg-v2-mapping-creation-modal__summary-segment--person">
                <User size={16} /> {toDisplayString(selectedConsultant?.name)}
              </span>
              <span className="mg-v2-mapping-creation-modal__summary-divider" aria-hidden="true">
                <Link2 size={16} />
              </span>
              <span className="mg-v2-mapping-creation-modal__summary-segment mg-v2-mapping-creation-modal__summary-segment--person">
                <UserCircle size={16} /> {toDisplayString(selectedClient?.name)}
              </span>
              <span className="mg-v2-mapping-creation-modal__summary-separator">|</span>
              <span className="mg-v2-mapping-creation-modal__summary-segment mg-v2-mapping-creation-modal__summary-segment--product">
                {toDisplayString(paymentInfo.packageName)} · {paymentInfo.totalSessions}회
              </span>
              <span className="mg-v2-mapping-creation-modal__summary-segment mg-v2-mapping-creation-modal__summary-segment--amount">
                {paymentInfo.packagePrice != null ? `${Number(paymentInfo.packagePrice).toLocaleString()}원` : 'N/A'}
              </span>
            </div>
            <div className="mg-v2-mapping-creation-modal__form">
              <div className="mg-v2-mapping-creation-modal__form-row">
                <div className="mg-v2-mapping-creation-modal__form-group">
                  <label>{t('admin:mappingCreation.totalSessions')}</label>
                  <div className="mg-v2-mapping-creation-modal__readonly">{t('admin:mappingCreation.sessionUnit', { count: paymentInfo.totalSessions })}</div>
                </div>
                <div className="mg-v2-mapping-creation-modal__form-group">
                  <label>{t('admin:mappingCreation.packagePrice')}</label>
                  <div className="mg-v2-mapping-creation-modal__readonly">{paymentInfo.packagePrice?.toLocaleString()}{t('admin:mappingCreation.currency')}</div>
                </div>
              </div>
              <div className="mg-v2-mapping-creation-modal__form-group">
                <label>{t('admin:labels.paymentMethod')}</label>
                <BadgeSelect
                  value={paymentInfo.paymentMethod}
                  onChange={(m) => {
                    setPaymentInfo(prev => ({ ...prev, paymentMethod: m, paymentReference: generateReferenceNumber(m) }));
                  }}
                  options={paymentMethodOptions.length
                    ? paymentMethodOptions.map(m => ({ value: m.value, label: m.label }))
                    : [
                        { value: 'BANK_TRANSFER', label: t('admin:labels.bankTransfer') },
                        { value: 'CARD', label: t('admin:labels.creditCard') },
                        { value: 'CASH', label: t('admin:labels.cash') }
                      ]}
                  placeholder={t('admin:messages.pleaseSelect')}
                  className="mg-v2-mapping-creation-modal__input"
                  aria-label={t('admin:labels.paymentMethod')}
                />
              </div>
              <div className="mg-v2-mapping-creation-modal__form-group">
                <label>{t('admin:mappingCreation.paymentReference')}</label>
                <input
                  type="text"
                  value={paymentInfo.paymentReference}
                  onChange={e => setPaymentInfo(prev => ({ ...prev, paymentReference: e.target.value }))}
                  placeholder={t('admin:mappingCreation.autoGenerate')}
                  className="mg-v2-mapping-creation-modal__input"
                />
              </div>
              <div className="mg-v2-mapping-creation-modal__form-group">
                <label>{t('admin:mappingCreation.responsibility')}</label>
                <BadgeSelect
                  value={paymentInfo.responsibility}
                  onChange={(val) => setPaymentInfo(prev => ({ ...prev, responsibility: val }))}
                  options={responsibilityOptions.map(r => ({ value: r.label, label: r.label }))}
                  placeholder={t('admin:messages.pleaseSelect')}
                  className="mg-v2-mapping-creation-modal__input"
                  aria-label={t('admin:mappingCreation.responsibility')}
                />
              </div>
              <div className="mg-v2-mapping-creation-modal__form-group">
                <label>{t('admin:mappingCreation.specialConsiderations')}</label>
                <textarea
                  value={paymentInfo.specialConsiderations}
                  onChange={e => setPaymentInfo(prev => ({ ...prev, specialConsiderations: e.target.value }))}
                  placeholder={t('admin:mappingCreation.specialConsiderationsPlaceholder')}
                  rows={2}
                  className="mg-v2-mapping-creation-modal__input"
                />
              </div>
              <div className="mg-v2-mapping-creation-modal__form-group">
                <label>{t('common:label.memo')}</label>
                <textarea
                  value={paymentInfo.notes}
                  onChange={e => setPaymentInfo(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={t('admin:mappingCreation.notesPlaceholder')}
                  rows={2}
                  className="mg-v2-mapping-creation-modal__input"
                />
              </div>
            </div>
          </section>
        )}

        {/* 5단계: 완료 */}
        {step === 5 && (
          <section className="mg-v2-mapping-creation-modal__step-content mg-v2-mapping-creation-modal__completion">
            <div className="mg-v2-mapping-creation-modal__success-icon">
              <CheckCircle size={48} />
            </div>
            <h3>{t('admin:mappingCreation.completionTitle')}</h3>
            <div className="mg-v2-mapping-creation-modal__completion-summary">
              <p><strong>{t('admin:labels.consultant')}:</strong> {toDisplayString(selectedConsultant?.name)}</p>
              <p><strong>{t('admin:labels.client')}:</strong> {toDisplayString(selectedClient?.name)}</p>
              <p><strong>{t('admin:mappingCreation.step.package')}:</strong> {toDisplayString(paymentInfo.packageName)}</p>
              <p><strong>{t('admin:mappingCreation.sessionPrice')}:</strong> {paymentInfo.totalSessions}{t('admin:mappingCreation.sessionUnitShort')} · {paymentInfo.packagePrice?.toLocaleString()}{t('admin:mappingCreation.currency')}</p>
            </div>
            {paymentInfo.paymentTiming === 'SAME_DAY_CARD' && (
              <p className="mg-v2-mapping-creation-modal__completion-notice">
                {t('admin:mappingCreation.paymentTiming.sameDayCardCompletionNotice')}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('admin:mappingCreation.title')}
      size="large"
      className="mg-v2-ad-b0kla"
      backdropClick={false}
      showCloseButton={true}
      loading={loading}
      actions={renderActions()}
    >
      {modalContent}
    </UnifiedModal>
  );
};

export default MappingCreationModal;

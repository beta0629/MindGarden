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
import Avatar from '../common/Avatar';
import BadgeSelect from '../common/BadgeSelect';
import { DEFAULT_MAPPING_CONFIG } from '../../constants/mapping';
import { toDisplayString } from '../../utils/safeDisplay';
import SafeText from '../common/SafeText';
import '../schedule/ScheduleB0KlA.css';
import './MappingCreationModal.css';

/**
 * 매칭 생성 모달 - 플로우형 UI (상담사 → 패키지 → 내담자 → 결제)
 * B0KlA 토큰, mg-v2-* 클래스, lucide-react 아이콘 적용
 *
 * @author Core Solution
 * @since 2024-12-19
 * @updated 2025-02-22 - 전면 재구성 (플로우형)
 */
const STEPS_CONFIG = [
  { key: 1, label: '상담사', icon: User },
  { key: 2, label: '패키지', icon: Package },
  { key: 3, label: '내담자', icon: UserCircle },
  { key: 4, label: '결제', icon: CreditCard },
  { key: 5, label: '완료', icon: CheckCircle }
];

const MappingCreationModal = ({ isOpen, onClose, onMappingCreated }) => {
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
    notes: ''
  });

  const generateReferenceNumber = (method = 'BANK_TRANSFER') => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    if (method === 'CASH') return `CASH_${timestamp}`;
    if (method === 'CARD') return `CARD_${timestamp}`;
    if (method === 'BANK_TRANSFER') return `BANK_${timestamp}`;
    return `${method}_${timestamp}`;
  };

  const loadPackageCodes = useCallback(async () => {
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
          if (code.codeValue === 'BASIC') label = '기본 패키지';
          if (code.codeValue === 'STANDARD') label = '표준 패키지';
          if (code.codeValue === 'PREMIUM') label = '프리미엄 패키지';
          if (code.codeValue === 'VIP') label = 'VIP 패키지';
          return { value: code.codeValue, label, sessions, price };
        });
        setPackageOptions(options);
      } else {
        notificationManager.warning('상담 패키지가 등록되지 않았습니다. 공통코드 관리에서 등록해주세요.');
        setPackageOptions([]);
      }
    } catch (error) {
      console.error('패키지 코드 로드 실패:', error);
      notificationManager.error('패키지 정보를 불러오는 중 오류가 발생했습니다.');
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

  const loadConsultants = async () => {
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

  const loadClients = async () => {
    try {
      const res = await apiGet('/api/v1/admin/clients/with-mapping-info');
      const arr = res?.clients ?? (Array.isArray(res) ? res : []);
      setClients(arr);
    } catch (e) {
      console.error('내담자 목록 로드 실패:', e);
      setClients([]);
    }
  };

  const loadMappings = async () => {
    try {
      const res = await apiGet('/api/v1/admin/mappings');
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.mappings) ? res.mappings : Array.isArray(res) ? res : [];
      setMappings(list);
    } catch (e) {
      console.error('매칭 로드 실패:', e);
    }
  };

  const loadCodeOptions = async () => {
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

  const handleCreateMapping = async () => {
    if (!selectedConsultant || !selectedClient) {
      notificationManager.warning('상담사와 내담자를 모두 선택해주세요.');
      return;
    }
    setLoading(true);
    try {
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
        remainingSessions: paymentInfo.totalSessions,
        packageName: paymentInfo.packageName,
        packagePrice: paymentInfo.packagePrice,
        paymentAmount: paymentInfo.packagePrice,
        paymentMethod: paymentInfo.paymentMethod,
        paymentReference: paymentInfo.paymentReference,
        mappingType: 'NEW'
      };
      await apiPost('/api/v1/admin/mappings', mappingData);
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
        `매칭이 완료되었습니다! 상담사: ${toDisplayString(selectedConsultant.name)}, 내담자: ${toDisplayString(selectedClient.name)}`
      );
      setStep(5);
      onMappingCreated?.();
    } catch (apiError) {
      const msg = apiError?.response?.data?.message || apiError?.message || '매칭 생성 중 오류가 발생했습니다.';
      notificationManager.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setSelectedConsultant(null);
    setSelectedClient(null);
    setPaymentInfo({
      totalSessions: DEFAULT_MAPPING_CONFIG.TOTAL_SESSIONS,
      packageName: DEFAULT_MAPPING_CONFIG.PACKAGE_NAME,
      packagePrice: DEFAULT_MAPPING_CONFIG.PACKAGE_PRICE,
      paymentMethod: 'BANK_TRANSFER',
      paymentReference: '',
      responsibility: DEFAULT_MAPPING_CONFIG.RESPONSIBILITY,
      specialConsiderations: '',
      notes: ''
    });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const canProceed = () => {
    if (step === 1) return !!selectedConsultant;
    if (step === 2) return !!paymentInfo.packageName;
    if (step === 3) return !!selectedClient;
    return true;
  };

  const renderActions = () => (
    <div className="mg-modal__actions mg-v2-mapping-creation-modal__actions">
      {step > 1 && step < 5 && (
        <MGButton
          type="button"
          variant="outline"
          size="medium"
          onClick={() => setStep(step - 1)}
          disabled={loading}
          preventDoubleClick={false}
        >
          이전
        </MGButton>
      )}
      {step < 4 && (
        <MGButton
          type="button"
          variant="primary"
          size="medium"
          onClick={() => step <= 3 && setStep(step + 1)}
          disabled={!canProceed()}
          preventDoubleClick={false}
        >
          다음
        </MGButton>
      )}
      {step === 4 && (
        <MGButton
          type="button"
          variant="primary"
          size="medium"
          onClick={handleCreateMapping}
          disabled={loading}
          loading={loading}
          loadingText="생성 중..."
          preventDoubleClick={false}
        >
          {loading ? '생성 중...' : '매칭 생성'}
        </MGButton>
      )}
      {step === 5 && (
        <MGButton
          type="button"
          variant="primary"
          size="medium"
          onClick={handleClose}
          preventDoubleClick={false}
        >
          <CheckCircle size={18} />
          완료
        </MGButton>
      )}
    </div>
  );

  const modalContent = (
    <div className="mg-v2-mapping-creation-modal-wrapper">
      <div className="mg-v2-ad-b0kla mg-v2-mapping-creation-modal">
        {/* 진행 단계 표시기 (mg-v2-ad-stepper - 스케줄 모달과 동일) */}
        <nav className="mg-v2-ad-stepper" aria-label="매칭 생성 단계">
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
                  <SafeText className="mg-v2-ad-stepper__title" tag="span">{s.label}</SafeText>
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
            <h3 className="mg-v2-mapping-creation-modal__step-title">상담사를 선택하세요</h3>
            <div className="mg-v2-mapping-creation-modal__search">
              <SearchInput
                value={consultantSearchTerm}
                onChange={setConsultantSearchTerm}
                placeholder="상담사 이름 또는 이메일로 검색..."
              />
              <span className="mg-v2-mapping-creation-modal__count">
                {consultantSearchTerm ? `${filteredConsultants.length}명` : `총 ${consultants.length}명`}
              </span>
            </div>
            <div className="mg-v2-mapping-creation-modal__grid">
              {filteredConsultants.length > 0 ? (
                filteredConsultants.map(c => (
                  <MGButton
                    key={c.id}
                    type="button"
                    variant="outline"
                    className={`mg-v2-mapping-creation-modal__card ${selectedConsultant?.id === c.id ? 'mg-v2-mapping-creation-modal__card--selected' : ''}`}
                    onClick={() => setSelectedConsultant(c)}
                    preventDoubleClick={false}
                  >
                    <Avatar
                      profileImageUrl={c.profileImageUrl}
                      displayName={toDisplayString(c.name)}
                      className="mg-v2-mapping-creation-modal__avatar"
                    />
                    <div className="mg-v2-mapping-creation-modal__card-info">
                      <strong><SafeText tag="span">{c.name}</SafeText></strong>
                      <span>{toDisplayString(c.email)}</span>
                    </div>
                  </MGButton>
                ))
              ) : (
                <div className="mg-v2-mapping-creation-modal__empty">
                  <Search size={32} />
                  <p>검색 결과가 없습니다</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 2단계: 패키지 */}
        {step === 2 && (
          <section className="mg-v2-mapping-creation-modal__step-content">
            <h3 className="mg-v2-mapping-creation-modal__step-title">패키지를 선택하세요</h3>
            {loadingPackageCodes ? (
              <div className="mg-v2-mapping-creation-modal__loading">패키지 로딩 중...</div>
            ) : !packageOptions.length || packageOptions.every(p => !p.price || p.price <= 0) ? (
              <div className="mg-v2-mapping-creation-modal__missing-pkg">
                <AlertCircle size={40} />
                <h4>패키지 데이터가 등록되지 않았습니다</h4>
                <p>공통코드 관리에서 패키지를 등록해주세요.</p>
                <MGButton
                  type="button"
                  variant="primary"
                  size="medium"
                  onClick={() => { onClose(); navigate('/admin/common-codes'); }}
                  preventDoubleClick={false}
                >
                  공통코드 관리로 이동
                </MGButton>
              </div>
            ) : (
              <div className="mg-v2-mapping-creation-modal__pkg-grid">
                {packageOptions.filter(p => p.price > 0).map(pkg => (
                  <MGButton
                    key={pkg.value}
                    type="button"
                    variant="outline"
                    className={`mg-v2-mapping-creation-modal__pkg-card ${paymentInfo.packageName === pkg.label ? 'mg-v2-mapping-creation-modal__pkg-card--selected' : ''}`}
                    onClick={() => setPaymentInfo(prev => ({
                      ...prev,
                      packageName: pkg.label,
                      totalSessions: pkg.sessions,
                      packagePrice: pkg.price
                    }))}
                    preventDoubleClick={false}
                  >
                    <Package size={24} />
                    <strong><SafeText tag="span">{pkg.label}</SafeText></strong>
                    <span>{pkg.sessions}회기 · {pkg.price.toLocaleString()}원</span>
                  </MGButton>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 3단계: 내담자 */}
        {step === 3 && (
          <section className="mg-v2-mapping-creation-modal__step-content">
            <h3 className="mg-v2-mapping-creation-modal__step-title">내담자를 선택하세요</h3>
            <div className="mg-v2-mapping-creation-modal__filters">
              <SearchInput
                value={clientSearchTerm}
                onChange={setClientSearchTerm}
                placeholder="내담자 이름 또는 이메일로 검색..."
              />
              <div className="mg-v2-mapping-creation-modal__filter-row">
                <BadgeSelect
                  size="small"
                  value={clientFilterStatus}
                  onChange={(val) => setClientFilterStatus(val)}
                  options={[
                    { value: 'ALL', label: '전체' },
                    { value: 'NO_MAPPING', label: '매칭 없음' },
                    { value: 'ACTIVE', label: '활성' },
                    { value: 'INACTIVE', label: '비활성' },
                    { value: 'TERMINATED', label: '종료됨' }
                  ]}
                  placeholder="선택하세요"
                  className="mg-v2-form-badge-select mg-v2-mapping-creation-modal__select"
                />
                <BadgeSelect
                  size="small"
                  value={clientSortBy}
                  onChange={(val) => setClientSortBy(val)}
                  options={[
                    { value: 'name', label: '이름순' },
                    { value: 'email', label: '이메일순' },
                    { value: 'createdAt', label: '등록일순' }
                  ]}
                  placeholder="선택하세요"
                  className="mg-v2-form-badge-select mg-v2-mapping-creation-modal__select"
                />
              </div>
              <span className="mg-v2-mapping-creation-modal__count">{filteredClients.length}명</span>
            </div>
            <div className="mg-v2-mapping-creation-modal__grid">
              {filteredClients.length > 0 ? (
                filteredClients.map(c => (
                  <MGButton
                    key={c.id}
                    type="button"
                    variant="outline"
                    className={`mg-v2-mapping-creation-modal__card ${selectedClient?.id === c.id ? 'mg-v2-mapping-creation-modal__card--selected' : ''}`}
                    onClick={() => setSelectedClient(c)}
                    preventDoubleClick={false}
                  >
                    <Avatar
                      profileImageUrl={c.profileImageUrl}
                      displayName={toDisplayString(c.name)}
                      className="mg-v2-mapping-creation-modal__avatar"
                    />
                    <div className="mg-v2-mapping-creation-modal__card-info">
                      <strong><SafeText tag="span">{c.name}</SafeText></strong>
                      <span>{toDisplayString(c.email)}</span>
                    </div>
                  </MGButton>
                ))
              ) : (
                <div className="mg-v2-mapping-creation-modal__empty">
                  <Search size={32} />
                  <p>검색 결과가 없습니다</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 4단계: 결제 */}
        {step === 4 && (
          <section className="mg-v2-mapping-creation-modal__step-content">
            <h3 className="mg-v2-mapping-creation-modal__step-title">결제 정보</h3>
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
                  <label>총 세션</label>
                  <div className="mg-v2-mapping-creation-modal__readonly">{paymentInfo.totalSessions}회</div>
                </div>
                <div className="mg-v2-mapping-creation-modal__form-group">
                  <label>패키지 가격</label>
                  <div className="mg-v2-mapping-creation-modal__readonly">{paymentInfo.packagePrice?.toLocaleString()}원</div>
                </div>
              </div>
              <div className="mg-v2-mapping-creation-modal__form-group">
                <label>결제 방법</label>
                <BadgeSelect
                  value={paymentInfo.paymentMethod}
                  onChange={(m) => {
                    setPaymentInfo(prev => ({ ...prev, paymentMethod: m, paymentReference: generateReferenceNumber(m) }));
                  }}
                  options={paymentMethodOptions.length
                    ? paymentMethodOptions.map(m => ({ value: m.value, label: m.label }))
                    : [
                        { value: 'BANK_TRANSFER', label: '계좌이체' },
                        { value: 'CARD', label: '신용카드' },
                        { value: 'CASH', label: '현금' }
                      ]}
                  placeholder="선택하세요"
                  className="mg-v2-mapping-creation-modal__input"
                  aria-label="결제 방법"
                />
              </div>
              <div className="mg-v2-mapping-creation-modal__form-group">
                <label>결제 참조번호</label>
                <input
                  type="text"
                  value={paymentInfo.paymentReference}
                  onChange={e => setPaymentInfo(prev => ({ ...prev, paymentReference: e.target.value }))}
                  placeholder="자동 생성"
                  className="mg-v2-mapping-creation-modal__input"
                />
              </div>
              <div className="mg-v2-mapping-creation-modal__form-group">
                <label>담당 업무</label>
                <BadgeSelect
                  value={paymentInfo.responsibility}
                  onChange={(val) => setPaymentInfo(prev => ({ ...prev, responsibility: val }))}
                  options={responsibilityOptions.map(r => ({ value: r.label, label: r.label }))}
                  placeholder="선택하세요"
                  className="mg-v2-mapping-creation-modal__input"
                  aria-label="담당 업무"
                />
              </div>
              <div className="mg-v2-mapping-creation-modal__form-group">
                <label>특별 고려사항</label>
                <textarea
                  value={paymentInfo.specialConsiderations}
                  onChange={e => setPaymentInfo(prev => ({ ...prev, specialConsiderations: e.target.value }))}
                  placeholder="내담자 특이사항"
                  rows={2}
                  className="mg-v2-mapping-creation-modal__input"
                />
              </div>
              <div className="mg-v2-mapping-creation-modal__form-group">
                <label>메모</label>
                <textarea
                  value={paymentInfo.notes}
                  onChange={e => setPaymentInfo(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="추가 메모"
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
            <h3>매칭이 완료되었습니다!</h3>
            <div className="mg-v2-mapping-creation-modal__completion-summary">
              <p><strong>상담사:</strong> {toDisplayString(selectedConsultant?.name)}</p>
              <p><strong>내담자:</strong> {toDisplayString(selectedClient?.name)}</p>
              <p><strong>패키지:</strong> {toDisplayString(paymentInfo.packageName)}</p>
              <p><strong>세션/가격:</strong> {paymentInfo.totalSessions}회 · {paymentInfo.packagePrice?.toLocaleString()}원</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title="새 매칭 생성"
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

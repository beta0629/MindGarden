import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedNotification from '../common/UnifiedNotification';
import UnifiedLoading from '../common/UnifiedLoading';
import SimpleLayout from '../layout/SimpleLayout';
import MGButton from '../common/MGButton';
import UnifiedModal from '../common/modals/UnifiedModal';
import UnifiedFilterSearch from '../ui/FilterSearch/UnifiedFilterSearch';
import OnboardingRequestCard from './OnboardingRequestCard';
import {
  getOnboardingRequests,
  getOnboardingRequestDetail,
  formatDate,
  getOnboardingStatusCodes,
  getRiskLevelCodes,
  convertCodesToMap,
  convertCodesToOptions
} from '../../utils/onboardingService';
import {
  DEFAULT_RISK_LEVEL,
  DEFAULT_COLORS,
  DEFAULT_BG_COLORS,
  MESSAGES,
  CODE_GROUPS
} from '../../constants/onboarding';
import './OnboardingStatus.css';

/**
 * 온보딩 상태 조회 페이지
/**
 * 온보딩 요청 상태를 조회하는 컴포넌트
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-20
 */
const OnboardingStatus = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [statusCodes, setStatusCodes] = useState([]);
  const [statusCodesMap, setStatusCodesMap] = useState({});
  const [riskLevelCodesMap, setRiskLevelCodesMap] = useState({});

  const quickFilterOptions = useMemo(() => {
    return [
      { value: '', label: MESSAGES.ALL },
      ...statusCodes.map(code => ({
        value: code.value,
        label: code.label
      }))
    ];
  }, [statusCodes]);

  useEffect(() => {
    loadCommonCodes();
  }, []);

  useEffect(() => {
    if (!loadingCodes) {
      loadRequests();
    }
  }, [selectedStatus, loadingCodes]);

  const loadCommonCodes = async () => {
    try {
      setLoadingCodes(true);
      
      const statusCodesData = await getOnboardingStatusCodes();
      const statusOptions = convertCodesToOptions(statusCodesData);
      setStatusCodes(statusOptions);
      
      const statusMap = convertCodesToMap(statusCodesData);
      setStatusCodesMap(statusMap);
      
      const riskLevelCodesData = await getRiskLevelCodes();
      const riskLevelMap = convertCodesToMap(riskLevelCodesData);
      setRiskLevelCodesMap(riskLevelMap);
    } catch (err) {
      console.error('공통 코드 로드 실패:', err);
    } finally {
      setLoadingCodes(false);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const requestsData = await getOnboardingRequests(selectedStatus || null);
      setRequests(requestsData);
    } catch (err) {
      console.error('온보딩 요청 목록 조회 실패:', err);
      const errorMessage = err.message || MESSAGES.LOAD_ERROR;
      setError(errorMessage);
      UnifiedNotification.show({
        type: 'error',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRequestDetail = async (id) => {
    try {
      const detail = await getOnboardingRequestDetail(id);
      setSelectedRequest(detail);
      setShowDetail(true);
    } catch (err) {
      console.error('온보딩 요청 상세 조회 실패:', err);
      UnifiedNotification.show({
        type: 'error',
        message: MESSAGES.DETAIL_LOAD_ERROR,
        duration: 5000
      });
    }
  };

  const getStatusLabel = (status) => {
    if (statusCodesMap[status]) {
      return statusCodesMap[status].nameKo || statusCodesMap[status].nameEn || status;
    }
    return status;
  };

  const getRiskLevelLabel = (riskLevel) => {
    const level = riskLevel || DEFAULT_RISK_LEVEL;
    if (riskLevelCodesMap[level]) {
      return riskLevelCodesMap[level].nameKo || riskLevelCodesMap[level].nameEn || level;
    }
    return level;
  };

  const handleFilterChange = (filters) => {
    if (filters.status !== undefined) {
      setSelectedStatus(filters.status || '');
    }
  };

  return (
    <SimpleLayout title="온보딩 요청 현황">
      <div className="onboarding-status">
        <div className="mg-container mg-container--xl">
          <div className="mg-v2-header mg-v2-header--with-actions mg-v2-mb-lg">
            <h1 className="mg-v2-heading mg-v2-heading--h1">온보딩 요청 현황</h1>
            <MGButton
              variant="primary"
              size="medium"
              onClick={() => navigate('/onboarding/request')}
            >
              {MESSAGES.NEW_REQUEST}
            </MGButton>
          </div>

          <UnifiedFilterSearch
            onSearch={() => {}} // 검색 기능 필요 시 추가
            onFilterChange={handleFilterChange}
            quickFilterOptions={quickFilterOptions}
            compact={true}
            enableHashtag={false}
          />

          {error && (
            <div className="mg-v2-alert mg-v2-alert--error mg-v2-mt-md">
              {error}
            </div>
          )}

          {loading ? (
            <UnifiedLoading type="page" text={MESSAGES.LOADING} />
          ) : requests.length === 0 ? (
            <div className="mg-v2-empty-state mg-v2-mt-lg">
              <p className="mg-v2-text mg-v2-text--secondary">{MESSAGES.NO_REQUESTS}</p>
            </div>
          ) : (
          <div className="mg-grid-responsive mg-v2-mt-md">
            {requests.map((request) => (
              <OnboardingRequestCard
                key={request.id}
                request={request}
                statusLabel={getStatusLabel(request.status)}
                riskLevelLabel={getRiskLevelLabel(request.riskLevel)}
                onDetailClick={loadRequestDetail}
              />
            ))}
          </div>
        )}
        </div>

        <UnifiedModal
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
          title="온보딩 요청 상세"
          size="medium"
          variant="detail"
        >
          {selectedRequest && (
            <div className="mg-v2-modal-body">
              <div className="mg-v2-detail-field">
                <label className="mg-v2-detail-label">회사명:</label>
                <div className="mg-v2-detail-value">{selectedRequest.tenantName}</div>
              </div>
              <div className="mg-v2-detail-field">
                <label className="mg-v2-detail-label">업종:</label>
                <div className="mg-v2-detail-value">{selectedRequest.businessType || '-'}</div>
              </div>
              <div className="mg-v2-detail-field">
                <label className="mg-v2-detail-label">요청자:</label>
                <div className="mg-v2-detail-value">{selectedRequest.requestedBy || '-'}</div>
              </div>
              <div className="mg-v2-detail-field">
                <label className="mg-v2-detail-label">위험도:</label>
                <div className="mg-v2-detail-value">
                  <span className={`mg-v2-badge mg-v2-badge--${(selectedRequest.riskLevel || DEFAULT_RISK_LEVEL).toLowerCase()}`}>
                    {getRiskLevelLabel(selectedRequest.riskLevel)}
                  </span>
                </div>
              </div>
              <div className="mg-v2-detail-field">
                <label className="mg-v2-detail-label">상태:</label>
                <div className="mg-v2-detail-value">
                  <span className={`mg-v2-badge mg-v2-badge--${(selectedRequest.status || '').toLowerCase()}`}>
                    {getStatusLabel(selectedRequest.status)}
                  </span>
                </div>
              </div>
              <div className="mg-v2-detail-field">
                <label className="mg-v2-detail-label">요청일시:</label>
                <div className="mg-v2-detail-value">{formatDate(selectedRequest.createdAt)}</div>
              </div>
              {selectedRequest.note && (
                <div className="mg-v2-detail-field">
                  <label className="mg-v2-detail-label">비고:</label>
                  <div className="mg-v2-detail-value">{selectedRequest.note}</div>
                </div>
              )}
            </div>
          )}
        </UnifiedModal>
      </div>
    </SimpleLayout>
  );
};

export default OnboardingStatus;

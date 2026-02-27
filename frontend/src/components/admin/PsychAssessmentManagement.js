/**
 * 심리검사 리포트 관리 (관리자 페이지)
 *
 * MappingManagementPage와 동일한 디자인·레이아웃 적용
 * ContentArea + ContentHeader + PsychKpiSection + PsychUploadSection + PsychDocumentListBlock
 *
 * @author Core Solution
 * @since 2026-02-27
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import UnifiedLoading from '../common/UnifiedLoading';
import PsychKpiSection from './psych-assessment/organisms/PsychKpiSection';
import PsychUploadSection from './psych-assessment/organisms/PsychUploadSection';
import PsychDocumentListBlock from './psych-assessment/organisms/PsychDocumentListBlock';
import MGModal from '../common/MGModal';
import ComingSoon from '../common/ComingSoon';
import { useSession } from '../../contexts/SessionContext';
import { RoleUtils } from '../../constants/roles';
import { useWidget } from '../../hooks/useWidget';
import notificationManager from '../../utils/notification';
import StandardizedApi from '../../utils/standardizedApi';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './PsychAssessmentManagementPage.css';

const CLIENTS_WITH_MAPPING_URL = '/api/v1/admin/clients/with-mapping-info';

const PsychAssessmentManagement = ({ user: propUser }) => {
  const { user: sessionUser } = useSession();
  const user = propUser || sessionUser;

  const [uploadType, setUploadType] = useState('TCI');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  /** 업로드 직후 서버 목록 갱신 전까지 보여줄 낙관적 문서 (documentId 기준 서버 데이터로 대체됨) */
  const [optimisticDocuments, setOptimisticDocuments] = useState([]);
  /** AI 리포트 보기 모달 */
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadClients = async () => {
      setClientsLoading(true);
      try {
        const res = await StandardizedApi.get(CLIENTS_WITH_MAPPING_URL);
        if (cancelled) return;
        const raw = res?.data ?? res;
        const list = raw?.clients ?? (Array.isArray(raw) ? raw : []);
        setClients(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancelled) {
          console.error('내담자 목록 로드 실패:', e);
          setClients([]);
        }
      } finally {
        if (!cancelled) setClientsLoading(false);
      }
    };
    loadClients();
    return () => { cancelled = true; };
  }, []);

  const widgetConfig = useMemo(() => {
    const dataSource = {
      type: 'multi-api',
      cache: false,
      refreshInterval: 60000,
      fetcher: StandardizedApi.get,
      endpoints: [
        {
          url: '/api/v1/assessments/psych/stats',
          key: 'stats',
          fallback: {}
        },
        {
          url: '/api/v1/assessments/psych/documents/recent',
          key: 'recent',
          fallback: []
        }
      ],
      transform: (input) => {
        if (!Array.isArray(input)) return input;
        const [statsRes, recentRes] = input;
        const stats = statsRes?.data ?? statsRes ?? {};
        const recentRaw = recentRes?.data ?? recentRes;
        return {
          stats: stats && typeof stats === 'object' && !Array.isArray(stats) ? stats : {},
          recent: Array.isArray(recentRaw) ? recentRaw : []
        };
      }
    };

    return {
      config: {
        title: '심리검사 리포트(AI)',
        subtitle: 'TCI/MMPI 업로드 · 처리상태 · 리포트 생성',
        dataSource
      }
    };
  }, []);

  // user 준비 후에만 API 호출 + initialLoadKey로 user 채워질 때 effect 재실행 보장 (tenantId 400·목록 미표시 방지)
  const {
    data,
    loading,
    refresh
  } = useWidget(widgetConfig.config, user, {
    immediate: !!(user && user.id),
    initialLoadKey: user?.id ?? null,
    cache: false,
    retryCount: 2
  });

  const stats = data?.stats || {};
  const recent = data?.recent || [];
  const recentLoadError = !!data?._loadErrors?.recent;

  // user가 비동기로 채워질 때 한 번 로드 보장 (initialLoadKey만으로 누락될 수 있는 타이밍 보완)
  const prevUserIdRef = useRef(user?.id);
  useEffect(() => {
    if (user?.id && prevUserIdRef.current !== user.id) {
      prevUserIdRef.current = user.id;
      refresh();
    }
  }, [user?.id, refresh]);

  // 서버 목록에 반영된 문서는 낙관적 목록에서 제거 (documentId 기준)
  useEffect(() => {
    if (!recent?.length) return;
    const serverIds = new Set(recent.map((d) => String(d.documentId)));
    setOptimisticDocuments((prev) => prev.filter((d) => !serverIds.has(String(d.documentId))));
  }, [recent]);

  // 표시 목록: 아직 서버에 없는 낙관적 문서 + 서버 목록 (최신순 유지)
  const displayDocuments = (() => {
    const serverIds = new Set((recent || []).map((d) => String(d.documentId)));
    const pending = (optimisticDocuments || []).filter((d) => !serverIds.has(String(d.documentId)));
    return [...pending, ...(recent || [])];
  })();

  const handlePickFile = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      notificationManager.show('PDF 파일만 업로드할 수 있습니다.', 'warning');
      return;
    }
    setUploadFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    handlePickFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      notificationManager.show('업로드할 PDF 파일을 선택해주세요.', 'warning');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('type', uploadType);
      form.append('file', uploadFile);
      if (clientId != null && clientId !== '') {
        form.append('clientId', String(clientId));
      }

      const res = await StandardizedApi.postFormData('/api/v1/assessments/psych/documents', form);
      if (res?.success === false) {
        throw new Error(res?.message || '업로드에 실패했습니다.');
      }
      notificationManager.show('업로드가 완료되었습니다. 추출 작업이 진행됩니다.', 'success');
      const payload = res?.data ?? res;
      if (payload?.documentId != null) {
        setOptimisticDocuments((prev) => [
          {
            documentId: payload.documentId,
            assessmentType: payload.assessmentType ?? uploadType,
            status: payload.status ?? 'OCR_PENDING',
            originalFilename: uploadFile?.name ?? '업로드된 파일',
            createdAt: new Date().toISOString()
          },
          ...prev
        ]);
      }
      setUploadFile(null);
      refresh();
    } catch (e) {
      notificationManager.show(e?.message || '업로드에 실패했습니다.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateReport = async (documentId) => {
    if (!documentId) return;
    try {
      const res = await StandardizedApi.post(`/api/v1/assessments/psych/documents/${documentId}/report`, {});
      if (res?.success === false) {
        throw new Error(res?.message || '리포트 생성에 실패했습니다.');
      }
      notificationManager.show('리포트 생성 요청이 완료되었습니다.', 'success');
      refresh();
    } catch (e) {
      notificationManager.show(e?.message || '리포트 생성에 실패했습니다.', 'error');
    }
  };

  const handleViewReport = async (documentId) => {
    if (!documentId) return;
    setReportLoading(true);
    setReportContent(null);
    setReportModalOpen(true);
    try {
      const res = await StandardizedApi.get(`/api/v1/assessments/psych/documents/${documentId}/report`);
      const data = res?.data ?? res;
      if (data?.reportMarkdown != null) {
        setReportContent(data);
      } else {
        setReportContent({ reportMarkdown: '(내용 없음)', modelName: '', createdAt: '' });
      }
    } catch (e) {
      if (e?.status === 404 || e?.response?.status === 404) {
        setReportContent(null);
        notificationManager.show('아직 생성된 리포트가 없습니다. "리포트 생성" 버튼을 눌러 주세요.', 'info');
      } else {
        notificationManager.show(e?.message || '리포트를 불러오지 못했습니다.', 'error');
      }
      setReportModalOpen(false);
    } finally {
      setReportLoading(false);
    }
  };

  if (!RoleUtils.isAdmin(user) && !RoleUtils.hasRole(user, 'HQ_MASTER')) {
    return (
      <AdminCommonLayout>
        <ComingSoon
          title="접근 권한이 없습니다"
          description="관리자 권한이 필요합니다."
        />
      </AdminCommonLayout>
    );
  }

  if (loading) {
    return (
      <AdminCommonLayout>
        <div className="mg-v2-ad-b0kla mg-v2-psych-assessment-management">
          <div className="mg-v2-ad-b0kla__container">
            <UnifiedLoading type="page" text="데이터를 불러오는 중..." variant="pulse" />
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout>
      <div className="mg-v2-ad-b0kla mg-v2-psych-assessment-management">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea>
            <ContentHeader
              title="심리검사 리포트(AI)"
              subtitle="TCI/MMPI 업로드 · 처리상태 · 리포트 생성"
              actions={
                <button
                  type="button"
                  className="mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary"
                  onClick={() => refresh()}
                  title="새로고침"
                >
                  <RefreshCw size={20} />
                  새로고침
                </button>
              }
            />

            <PsychKpiSection stats={stats} />

            <PsychUploadSection
              uploadType={uploadType}
              onUploadTypeChange={setUploadType}
              uploadFile={uploadFile}
              onFilePick={handlePickFile}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onUpload={handleUpload}
              uploading={uploading}
              isDragOver={isDragOver}
              clientId={clientId}
              onClientIdChange={setClientId}
              clients={clients}
              clientsLoading={clientsLoading}
            />

            <PsychDocumentListBlock
              documents={displayDocuments}
              onGenerateReport={handleGenerateReport}
              onViewReport={handleViewReport}
              listLoadError={recentLoadError}
            />
          </ContentArea>
        </div>
      </div>

      <MGModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="AI 분석 결과"
        size="large"
        showCloseButton
      >
        {reportLoading ? (
          <UnifiedLoading type="inline" text="리포트를 불러오는 중..." />
        ) : reportContent?.reportMarkdown ? (
          <div className="mg-v2-psych-report-modal-body">
            {reportContent.modelName && (
              <p className="mg-v2-psych-report-modal-meta">
                모델: {reportContent.modelName}
                {reportContent.createdAt && ` · 생성: ${reportContent.createdAt}`}
              </p>
            )}
            <pre className="mg-v2-psych-report-modal-markdown">{reportContent.reportMarkdown}</pre>
          </div>
        ) : null}
      </MGModal>
    </AdminCommonLayout>
  );
};

export default PsychAssessmentManagement;

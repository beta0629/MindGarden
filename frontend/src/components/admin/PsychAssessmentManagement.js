/**
 * 심리검사 리포트 관리 (관리자 페이지)
 *
 * MappingManagementPage와 동일한 디자인·레이아웃 적용
 * ContentArea + ContentHeader + PsychKpiSection + PsychUploadSection + PsychDocumentListBlock
 *
 * @author Core Solution
 * @since 2026-02-27
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import UnifiedLoading from '../common/UnifiedLoading';
import PsychKpiSection from './psych-assessment/organisms/PsychKpiSection';
import PsychUploadSection from './psych-assessment/organisms/PsychUploadSection';
import PsychDocumentListBlock from './psych-assessment/organisms/PsychDocumentListBlock';
import PsychAiReportModalContent from './psych-assessment/organisms/PsychAiReportModalContent';
import UnifiedModal from '../common/modals/UnifiedModal';
import ComingSoon from '../common/ComingSoon';
import { useSession } from '../../contexts/SessionContext';
import { RoleUtils, USER_ROLES, LEGACY_USER_ROLES } from '../../constants/roles';
import notificationManager from '../../utils/notification';
import StandardizedApi from '../../utils/standardizedApi';
import { toErrorMessage } from '../../utils/safeDisplay';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './PsychAssessmentManagementPage.css';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_ASSESSMENTS_PSYCH_STATS = '/api/v1/assessments/psych/stats';
const API_ASSESSMENTS_PSYCH_DOCUMENTS_RECENT = '/api/v1/assessments/psych/documents/recent';
const API_ASSESSMENTS_PSYCH_DOCUMENTS = '/api/v1/assessments/psych/documents';


const CLIENTS_WITH_MAPPING_URL = '/api/v1/admin/clients/with-mapping-info';

/** 심리검사 AI: 테넌트 관리(ADMIN)·본사 마스터·사무원(STAFF) — 백엔드는 isAuthenticated만 요구 */
const canAccessPsychAssessmentAdmin = (u) =>
  RoleUtils.isAdmin(u) ||
  RoleUtils.hasRole(u, LEGACY_USER_ROLES.HQ_MASTER) ||
  RoleUtils.hasRole(u, USER_ROLES.STAFF);

const PsychAssessmentManagement = ({ user: propUser }) => {
  const { user: sessionUser } = useSession();
  const user = propUser || sessionUser;
  const location = useLocation();
  const psychDeepLinkSearchHandledRef = useRef(null);

  const [uploadType, setUploadType] = useState('TCI');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  /** 업로드 직후 서버 목록 갱신 전까지 보여줄 낙관적 문서 (documentId 기준 서버 데이터로 대체됨) */
  const [optimisticDocuments, setOptimisticDocuments] = useState([]);
  /** AI 리포트 보기 모달 */
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportDocumentId, setReportDocumentId] = useState(null);
  const [reportContent, setReportContent] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [generatingReportDocumentId, setGeneratingReportDocumentId] = useState(null);

  /** 일반 페이지 방식: stats/recent 직접 로드 (useWidget 미사용 — tenantId·호출 시점 이슈 회피) */
  const [stats, setStats] = useState({});
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentLoadError, setRecentLoadError] = useState(false);

  const loadStatsAndRecent = useCallback(async() => {
    if (!user?.id) return;
    setLoading(true);
    setRecentLoadError(false);
    try {
      const [statsRes, recentRes] = await Promise.all([
        StandardizedApi.get(API_ASSESSMENTS_PSYCH_STATS),
        StandardizedApi.get(API_ASSESSMENTS_PSYCH_DOCUMENTS_RECENT)
      ]);
      const statsData = statsRes?.data ?? statsRes;
      const recentData = recentRes?.data ?? recentRes;
      setStats(statsData && typeof statsData === 'object' && !Array.isArray(statsData) ? statsData : {});
      setRecent(Array.isArray(recentData) ? recentData : []);
    } catch (e) {
      console.error('심리검사 목록 로드 실패:', e);
      setRecentLoadError(true);
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const handleViewReport = useCallback(async(documentId) => {
    if (!documentId) return;
    setReportDocumentId(documentId);
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
        notificationManager.show(toErrorMessage(e, '리포트를 불러오지 못했습니다.'), 'error');
      }
      setReportModalOpen(false);
      setReportDocumentId(null);
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadClients = async() => {
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

  useEffect(() => {
    if (user?.id) {
      loadStatsAndRecent();
    } else {
      setLoading(false);
    }
  }, [user?.id, loadStatsAndRecent]);

  useEffect(() => {
    if (!user?.id || !canAccessPsychAssessmentAdmin(user)) {
      return undefined;
    }
    const params = new URLSearchParams(location.search || '');
    const docId = params.get('documentId');
    if (!docId || !/^\d+$/.test(String(docId).trim())) {
      return undefined;
    }
    const searchKey = location.search || '';
    if (psychDeepLinkSearchHandledRef.current === searchKey) {
      return undefined;
    }
    psychDeepLinkSearchHandledRef.current = searchKey;
    handleViewReport(Number(docId));
    return undefined;
  }, [location.search, handleViewReport, user]);

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

  const isPdf = (f) => f?.type === 'application/pdf';
  const isImage = (f) =>
    f?.type === 'image/jpeg' || f?.type === 'image/png';

  const handlePickFile = (files) => {
    if (!files?.length) return;
    const hasPdf = files.some(isPdf);
    const hasImage = files.some(isImage);
    if (hasPdf && hasImage) {
      notificationManager.show('한 건에는 PDF만 또는 이미지만 올릴 수 있습니다.', 'warning');
      return;
    }
    if (hasPdf && files.length > 1) {
      notificationManager.show('PDF는 1개만 선택할 수 있습니다.', 'warning');
      return;
    }
    setUploadFiles(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const fileList = e.dataTransfer?.files;
    if (fileList?.length) {
      handlePickFile(Array.from(fileList));
    }
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

  const handleUpload = async() => {
    if (!uploadFiles?.length) {
      notificationManager.show('업로드할 파일을 선택해 주세요.', 'warning');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('type', uploadType);
      const singlePdf = uploadFiles.length === 1 && isPdf(uploadFiles[0]);
      if (singlePdf) {
        form.append('file', uploadFiles[0]);
      } else {
        uploadFiles.forEach((f) => form.append('files', f));
      }
      if (clientId != null && clientId !== '') {
        form.append('clientId', String(clientId));
      }

      const res = await StandardizedApi.postFormData(API_ASSESSMENTS_PSYCH_DOCUMENTS, form);
      if (res?.success === false) {
        throw new Error(res?.message || '업로드에 실패했습니다.');
      }
      notificationManager.show('업로드가 완료되었습니다. 추출 작업이 진행됩니다.', 'success');
      const payload = res?.data ?? res;
      if (payload?.documentId != null) {
        const displayName =
          uploadFiles.length === 1
            ? uploadFiles[0]?.name ?? '업로드된 파일'
            : uploadFiles[0]?.name
              ? `${uploadFiles[0].name} 외 ${uploadFiles.length - 1}장`
              : `이미지 ${uploadFiles.length}장`;
        setOptimisticDocuments((prev) => [
          {
            documentId: payload.documentId,
            assessmentType: payload.assessmentType ?? uploadType,
            status: payload.status ?? 'OCR_PENDING',
            originalFilename: displayName,
            createdAt: new Date().toISOString()
          },
          ...prev
        ]);
      }
      setUploadFiles([]);
      loadStatsAndRecent();
    } catch (e) {
      notificationManager.show(e?.message || '업로드에 실패했습니다.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateReport = async(documentId) => {
    if (!documentId) return;
    setGeneratingReportDocumentId(documentId);
    try {
      const res = await StandardizedApi.post(`/api/v1/assessments/psych/documents/${documentId}/report`, {});
      if (res?.success === false) {
        throw new Error(res?.message || '리포트 생성에 실패했습니다.');
      }
      notificationManager.show('리포트 생성 요청이 완료되었습니다.', 'success');
      loadStatsAndRecent();
    } catch (e) {
      notificationManager.show(e?.message || '리포트 생성에 실패했습니다.', 'error');
    } finally {
      setGeneratingReportDocumentId(null);
    }
  };

  if (!canAccessPsychAssessmentAdmin(user)) {
    return (
      <ComingSoon
        title="접근 권한이 없습니다"
        description="관리자 또는 사무원(STAFF) 권한이 필요합니다."
      />
    );
  }

  if (loading) {
    return (
      <AdminCommonLayout>
        <div className="mg-v2-ad-b0kla">
          <div className="mg-v2-ad-b0kla__container">
            <ContentArea ariaLabel="심리검사 리포트 관리 본문" className="mg-v2-psych-assessment-management">
              <div aria-busy="true" aria-live="polite">
                <UnifiedLoading type="inline" text="데이터를 불러오는 중..." variant="pulse" />
              </div>
            </ContentArea>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout>
      <>
        <div className="mg-v2-ad-b0kla">
          <div className="mg-v2-ad-b0kla__container">
            <ContentArea ariaLabel="심리검사 리포트 관리 본문" className="mg-v2-psych-assessment-management">
              <ContentHeader
                title="심리검사 리포트(AI)"
                subtitle="TCI/MMPI 업로드 · 처리상태 · 리포트 생성"
                actions={
                  <MGButton
                    type="button"
                    variant="primary"
                    className={buildErpMgButtonClassName({
                      variant: 'primary',
                      size: 'md',
                      loading,
                      className: 'mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary'
                    })}
                    onClick={() => loadStatsAndRecent()}
                    title="새로고침"
                    loading={loading}
                    preventDoubleClick={true}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  >
                    새로고침
                  </MGButton>
                }
              />

              <PsychKpiSection stats={stats} />

              <PsychUploadSection
                uploadType={uploadType}
                onUploadTypeChange={setUploadType}
                uploadFiles={uploadFiles}
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
                viewReportLoading={reportLoading}
                listLoadError={recentLoadError}
                generatingReportDocumentId={generatingReportDocumentId}
              />
            </ContentArea>
          </div>
        </div>

        <UnifiedModal
          isOpen={reportModalOpen}
          onClose={() => {
            setReportDocumentId(null);
            setReportModalOpen(false);
          }}
          title="AI 분석 결과"
          size="large"
          showCloseButton
          className="mg-v2-ad-b0kla"
        >
          <PsychAiReportModalContent
            loading={reportLoading}
            reportContent={reportContent}
            reportDocumentId={reportDocumentId}
            onRegenerateReport={handleGenerateReport}
            regenerateLoading={
              generatingReportDocumentId != null &&
              String(generatingReportDocumentId) === String(reportDocumentId)
            }
            regenerateDisabled={
              generatingReportDocumentId != null &&
              String(generatingReportDocumentId) !== String(reportDocumentId)
            }
          />
        </UnifiedModal>
      </>
    </AdminCommonLayout>
  );
};

export default PsychAssessmentManagement;

/**
 * Psych Assessment Admin Widget - 대시보드 위젯
 *
 * BaseWidget 제거, Organism 조합만 사용
 * PsychKpiSection + PsychUploadSection + PsychDocumentListBlock
 *
 * @author Core Solution
 * @since 2026-02-27
 */

import React, { forwardRef, useImperativeHandle, useMemo, useState, useEffect } from 'react';
import { useWidget } from '../../../../hooks/useWidget';
import { RoleUtils } from '../../../../constants/roles';
import notificationManager from '../../../../utils/notification';
import StandardizedApi from '../../../../utils/standardizedApi';
import PsychKpiSection from '../../../admin/psych-assessment/organisms/PsychKpiSection';
import PsychUploadSection from '../../../admin/psych-assessment/organisms/PsychUploadSection';
import PsychDocumentListBlock from '../../../admin/psych-assessment/organisms/PsychDocumentListBlock';
import PsychAiReportModalContent from '../../../admin/psych-assessment/organisms/PsychAiReportModalContent';
import UnifiedModal from '../../../common/modals/UnifiedModal';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
import UnifiedLoading from '../../../common/UnifiedLoading';
import '../../../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './PsychAssessmentAdminWidget.css';

const PsychAssessmentAdminWidget = forwardRef(({ widget, user }, ref) => {
  const [uploadType, setUploadType] = useState('TCI');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [optimisticDocuments, setOptimisticDocuments] = useState([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [generatingReportDocumentId, setGeneratingReportDocumentId] = useState(null);
  const [retryLoading, setRetryLoading] = useState(false);

  const isAdminUser = RoleUtils.isAdmin(user) || RoleUtils.hasRole(user, 'HQ_MASTER');

  const widgetWithDataSource = useMemo(() => {
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
      ...widget,
      config: {
        ...widget?.config,
        title: widget?.config?.title || '심리검사 리포트(AI)',
        subtitle: widget?.config?.subtitle || 'TCI/MMPI 업로드 · 처리상태 · 리포트 생성',
        dataSource
      }
    };
  }, [widget]);

  // user 준비 후에만 API 호출 + initialLoadKey로 user 채워질 때 effect 재실행 보장
  const {
    data,
    loading,
    error,
    refresh
  } = useWidget(widgetWithDataSource.config, user, {
    immediate: !!(user && user.id),
    initialLoadKey: user?.id ?? null,
    cache: false,
    retryCount: 2
  });

  useImperativeHandle(ref, () => ({ refresh }), [refresh]);

  const stats = data?.stats || {};
  const recent = data?.recent || [];
  const recentLoadError = !!data?._loadErrors?.recent;

  useEffect(() => {
    if (!recent?.length) return;
    const serverIds = new Set(recent.map((d) => String(d.documentId)));
    setOptimisticDocuments((prev) => prev.filter((d) => !serverIds.has(String(d.documentId))));
  }, [recent]);

  const displayDocuments = (() => {
    const serverIds = new Set((recent || []).map((d) => String(d.documentId)));
    const pending = (optimisticDocuments || []).filter((d) => !serverIds.has(String(d.documentId)));
    return [...pending, ...(recent || [])];
  })();

  if (!isAdminUser) {
    return null;
  }

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

      const res = await StandardizedApi.postFormData('/api/v1/assessments/psych/documents', form);
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
      refresh();
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
      refresh();
    } catch (e) {
      notificationManager.show(e?.message || '리포트 생성에 실패했습니다.', 'error');
    } finally {
      setGeneratingReportDocumentId(null);
    }
  };

  const handleViewReport = async(documentId) => {
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

  if (loading) {
    return (
      <div className="psych-assessment-admin-widget psych-assessment-admin-widget--loading">
        <UnifiedLoading type="inline" text="데이터를 불러오는 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="psych-assessment-admin-widget psych-assessment-admin-widget--error">
        <p className="mg-text-muted">{error}</p>
        <MGButton
          type="button"
          variant="outline"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'outline',
            size: 'sm',
            loading: retryLoading,
            className: ''
          })}
          onClick={async() => {
            setRetryLoading(true);
            try {
              await refresh();
            } finally {
              setRetryLoading(false);
            }
          }}
          loading={retryLoading}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          preventDoubleClick={false}
        >
          다시 시도
        </MGButton>
      </div>
    );
  }

  return (
    <div className="psych-assessment-admin-widget mg-v2-ad-b0kla">
      <PsychKpiSection stats={stats} />
      <PsychUploadSection
        uploadType={uploadType}
        onUploadTypeChange={setUploadType}
        uploadFiles={uploadFiles}
        onFilePick={handlePickFile}
        onUpload={handleUpload}
        uploading={uploading}
        fileInputId="psych-assessment-widget-file-input"
        clientId={null}
        onClientIdChange={() => {}}
        clients={[]}
        clientsLoading={false}
      />
      <PsychDocumentListBlock
        documents={displayDocuments}
        onGenerateReport={handleGenerateReport}
        onViewReport={handleViewReport}
        listLoadError={recentLoadError}
        generatingReportDocumentId={generatingReportDocumentId}
        viewReportLoading={reportLoading}
      />

      <UnifiedModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="AI 분석 결과"
        size="large"
        showCloseButton
        className="mg-v2-ad-b0kla"
      >
        <PsychAiReportModalContent loading={reportLoading} reportContent={reportContent} />
      </UnifiedModal>
    </div>
  );
});

PsychAssessmentAdminWidget.displayName = 'PsychAssessmentAdminWidget';

export default PsychAssessmentAdminWidget;

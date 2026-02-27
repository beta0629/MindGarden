/**
 * Psych Assessment Admin Widget - 대시보드 위젯
 *
 * BaseWidget 제거, Organism 조합만 사용
 * PsychKpiSection + PsychUploadSection + PsychDocumentListBlock
 *
 * @author Core Solution
 * @since 2026-02-27
 */

import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { useWidget } from '../../../../hooks/useWidget';
import { RoleUtils } from '../../../../constants/roles';
import notificationManager from '../../../../utils/notification';
import StandardizedApi from '../../../../utils/standardizedApi';
import PsychKpiSection from '../../../admin/psych-assessment/organisms/PsychKpiSection';
import PsychUploadSection from '../../../admin/psych-assessment/organisms/PsychUploadSection';
import PsychDocumentListBlock from '../../../admin/psych-assessment/organisms/PsychDocumentListBlock';
import UnifiedLoading from '../../../common/UnifiedLoading';
import '../../../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './PsychAssessmentAdminWidget.css';

const PsychAssessmentAdminWidget = forwardRef(({ widget, user }, ref) => {
  const [uploadType, setUploadType] = useState('TCI');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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

  const {
    data,
    loading,
    error,
    refresh
  } = useWidget(widgetWithDataSource.config, user, {
    immediate: true,
    cache: false,
    retryCount: 2
  });

  useImperativeHandle(ref, () => ({ refresh }), [refresh]);

  if (!isAdminUser) {
    return null;
  }

  const stats = data?.stats || {};
  const recent = data?.recent || [];

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

      const res = await StandardizedApi.postFormData('/api/v1/assessments/psych/documents', form);
      if (res?.success === false) {
        throw new Error(res?.message || '업로드에 실패했습니다.');
      }
      notificationManager.show('업로드가 완료되었습니다. 추출 작업이 진행됩니다.', 'success');
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
        <button
          type="button"
          className="mg-v2-button mg-v2-button-outline mg-v2-button-sm"
          onClick={() => refresh()}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="psych-assessment-admin-widget mg-v2-ad-b0kla">
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
        fileInputId="psych-assessment-widget-file-input"
      />
      <PsychDocumentListBlock
        documents={recent}
        onGenerateReport={handleGenerateReport}
      />
    </div>
  );
});

PsychAssessmentAdminWidget.displayName = 'PsychAssessmentAdminWidget';

export default PsychAssessmentAdminWidget;

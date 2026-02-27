/**
 * 심리검사 리포트 관리 (관리자 페이지)
 *
 * MappingManagementPage와 동일한 디자인·레이아웃 적용
 * ContentArea + ContentHeader + PsychKpiSection + PsychUploadSection + PsychDocumentListBlock
 *
 * @author Core Solution
 * @since 2026-02-27
 */

import React, { useMemo, useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import UnifiedLoading from '../common/UnifiedLoading';
import PsychKpiSection from './psych-assessment/organisms/PsychKpiSection';
import PsychUploadSection from './psych-assessment/organisms/PsychUploadSection';
import PsychDocumentListBlock from './psych-assessment/organisms/PsychDocumentListBlock';
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

  const {
    data,
    loading,
    refresh
  } = useWidget(widgetConfig.config, user, {
    immediate: true,
    cache: false,
    retryCount: 2
  });

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
      if (clientId != null && clientId !== '') {
        form.append('clientId', String(clientId));
      }

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
              documents={recent}
              onGenerateReport={handleGenerateReport}
            />
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default PsychAssessmentManagement;

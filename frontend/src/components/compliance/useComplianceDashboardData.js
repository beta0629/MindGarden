import { useState, useEffect, useCallback } from 'react';

/**
 * 컴플라이언스 대시보드 API 상태 및 로드
 *
 * @returns {object} 상태 및 loadComplianceData
 */
export function useComplianceDashboardData() {
  const [overallStatus, setOverallStatus] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [impactAssessment, setImpactAssessment] = useState(null);
  const [breachResponse, setBreachResponse] = useState(null);
  const [educationStatus, setEducationStatus] = useState(null);
  const [policyStatus, setPolicyStatus] = useState(null);
  const [destructionStatus, setDestructionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // eslint-disable-next-line space-before-function-paren -- async 화살표는 async () 구문 필요
  const loadComplianceData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        overallRes,
        processingRes,
        impactRes,
        breachRes,
        educationRes,
        policyRes,
        destructionRes
      ] = await Promise.all([
        fetch('/api/v1/admin/compliance/overall'),
        fetch('/api/v1/admin/compliance/personal-data-processing'),
        fetch('/api/v1/admin/compliance/impact-assessment'),
        fetch('/api/v1/admin/compliance/breach-response'),
        fetch('/api/v1/admin/compliance/education'),
        fetch('/api/v1/admin/compliance/policy'),
        fetch('/api/v1/admin/personal-data-destruction/status')
      ]);

      if (overallRes.ok) {
        setOverallStatus(await overallRes.json());
      }
      if (processingRes.ok) {
        setProcessingStatus(await processingRes.json());
      }
      if (impactRes.ok) {
        setImpactAssessment(await impactRes.json());
      }
      if (breachRes.ok) {
        setBreachResponse(await breachRes.json());
      }
      if (educationRes.ok) {
        setEducationStatus(await educationRes.json());
      }
      if (policyRes.ok) {
        setPolicyStatus(await policyRes.json());
      }
      if (destructionRes.ok) {
        setDestructionStatus(await destructionRes.json());
      }
    } catch (err) {
      console.error('컴플라이언스 데이터 로드 실패:', err);
      setError('컴플라이언스 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadComplianceData();
  }, [loadComplianceData]);

  return {
    overallStatus,
    processingStatus,
    impactAssessment,
    breachResponse,
    educationStatus,
    policyStatus,
    destructionStatus,
    loading,
    error,
    loadComplianceData
  };
}

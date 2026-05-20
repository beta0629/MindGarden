import { useState, useEffect, useCallback } from 'react';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_ADMIN_COMPLIANCE_OVERALL = '/api/v1/admin/compliance/overall';
const API_ADMIN_COMPLIANCE_PERSONAL_DATA_PROCESSING = '/api/v1/admin/compliance/personal-data-processing';
const API_ADMIN_COMPLIANCE_IMPACT_ASSESSMENT = '/api/v1/admin/compliance/impact-assessment';
const API_ADMIN_COMPLIANCE_BREACH_RESPONSE = '/api/v1/admin/compliance/breach-response';
const API_ADMIN_COMPLIANCE_EDUCATION = '/api/v1/admin/compliance/education';
const API_ADMIN_COMPLIANCE_POLICY = '/api/v1/admin/compliance/policy';
const API_ADMIN_PERSONAL_DATA_DESTRUCTION_STATUS = '/api/v1/admin/personal-data-destruction/status';


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
        fetch(API_ADMIN_COMPLIANCE_OVERALL),
        fetch(API_ADMIN_COMPLIANCE_PERSONAL_DATA_PROCESSING),
        fetch(API_ADMIN_COMPLIANCE_IMPACT_ASSESSMENT),
        fetch(API_ADMIN_COMPLIANCE_BREACH_RESPONSE),
        fetch(API_ADMIN_COMPLIANCE_EDUCATION),
        fetch(API_ADMIN_COMPLIANCE_POLICY),
        fetch(API_ADMIN_PERSONAL_DATA_DESTRUCTION_STATUS)
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

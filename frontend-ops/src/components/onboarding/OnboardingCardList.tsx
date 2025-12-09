/**
 * 온보딩 카드 리스트 컴포넌트
 * 테이블 형태 대신 카드 형태로 표시
 */

import { useRouter } from "next/navigation";
import { OnboardingRequest } from "@/types/onboarding";
import { OnboardingStatus } from "@/types/shared";
import { ONBOARDING_MESSAGES } from "@/constants/onboarding";
import { getStatusLabel } from "@/utils/onboardingUtils";
import { formatOnboardingDate } from "@/utils/dateUtils";
import OpsCard from "@/components/ui/OpsCard";
import RiskBadge from "./RiskBadge";
import StatusBadge from "./StatusBadge";
import MGButton from "@/components/ui/MGButton";
import styles from "./OnboardingCardList.module.css";

interface OnboardingCardListProps {
  requests: OnboardingRequest[];
  statusFilter?: OnboardingStatus;
}

export default function OnboardingCardList({ requests, statusFilter }: OnboardingCardListProps) {
  const router = useRouter();
  const safeRequests = Array.isArray(requests) ? requests : [];
  
  if (safeRequests.length === 0) {
    return (
      <div className={styles.emptyMessage}>
        {statusFilter 
          ? ONBOARDING_MESSAGES.NO_REQUESTS_BY_STATUS(getStatusLabel(statusFilter))
          : ONBOARDING_MESSAGES.NO_REQUESTS
        }
      </div>
    );
  }
  
  const handleViewDetail = (requestId: string) => {
    router.push(`/onboarding/detail?id=${requestId}`);
  };
  
  return (
    <div className={styles.cardGrid}>
      {safeRequests.map((request) => (
        <OpsCard key={request.id} className={styles.onboardingCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>{request.tenantName}</h3>
              <p className={styles.cardSubtitle}>{request.tenantId}</p>
            </div>
            <StatusBadge status={request.status} />
          </div>
          
          <div className={styles.cardContent}>
            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>요청자</span>
                <span className={styles.metaValue}>{request.requestedBy}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>리스크</span>
                <RiskBadge level={request.riskLevel} />
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>요청 일시</span>
                <span className={styles.metaValue}>{formatOnboardingDate(request.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.cardActions}>
            <MGButton
              variant="primary"
              size="small"
              preventDoubleClick={true}
              onClick={() => handleViewDetail(String(request.id))}
            >
              {ONBOARDING_MESSAGES.VIEW_DETAIL}
            </MGButton>
          </div>
        </OpsCard>
      ))}
    </div>
  );
}


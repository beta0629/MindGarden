/**
 * 요금제 카드 리스트 컴포넌트
 * 테이블 형태 대신 카드 형태로 표시
 */

import { PricingPlan } from "@/types/pricing";
import OpsCard from "@/components/ui/OpsCard";
import MGButton from "@/components/ui/MGButton";
import styles from "./PricingCardList.module.css";

interface PricingCardListProps {
  plans: PricingPlan[];
  onEdit: (planId: string) => void;
}

export function PricingCardList({ plans, onEdit }: PricingCardListProps) {
  if (plans.length === 0) {
    return (
      <div className={styles.emptyMessage}>
        등록된 요금제가 없습니다.
      </div>
    );
  }
  
  return (
    <div className={styles.cardGrid}>
      {plans.map((plan) => (
        <OpsCard key={plan.id} className={styles.pricingCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>
                {plan.displayNameKo || plan.displayName}
              </h3>
              <p className={styles.cardSubtitle}>
                {plan.planCode} / {plan.displayName}
              </p>
            </div>
            <span className={`${styles.statusBadge} ${plan.active ? styles.statusActive : styles.statusInactive}`}>
              {plan.active ? "활성" : "비활성"}
            </span>
          </div>
          
          <div className={styles.cardContent}>
            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>기본 요금</span>
                <span className={styles.metaValue}>
                  {plan.baseFee.toLocaleString("ko-KR")} {plan.currency}
                </span>
              </div>
            </div>
          </div>
          
          <div className={styles.cardActions}>
            <MGButton
              variant="outline"
              size="small"
              onClick={() => onEdit(plan.id)}
              preventDoubleClick={true}
            >
              수정
            </MGButton>
          </div>
        </OpsCard>
      ))}
    </div>
  );
}


/**
 * 애드온 카드 리스트 컴포넌트
 * 테이블 형태 대신 카드 형태로 표시
 */

import { PricingAddon } from "@/types/pricing";
import { FEE_TYPE_LABEL } from "@/constants/pricing";
import OpsCard from "@/components/ui/OpsCard";
import MGButton from "@/components/ui/MGButton";
import styles from "./PricingCardList.module.css";

interface AddonCardListProps {
  addons: PricingAddon[];
  onEdit: (addonId: string) => void;
}

export function AddonCardList({ addons, onEdit }: AddonCardListProps) {
  if (addons.length === 0) {
    return (
      <div className={styles.emptyMessage}>
        등록된 애드온이 없습니다.
      </div>
    );
  }
  
  return (
    <div className={styles.cardGrid}>
      {addons.map((addon) => (
        <OpsCard key={addon.id} className={styles.pricingCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>
                {addon.displayNameKo || addon.displayName}
              </h3>
              <p className={styles.cardSubtitle}>{addon.addonCode}</p>
            </div>
            <span className={`${styles.statusBadge} ${addon.active ? styles.statusActive : styles.statusInactive}`}>
              {addon.active ? "활성" : "비활성"}
            </span>
          </div>
          
          <div className={styles.cardContent}>
            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>카테고리</span>
                <span className={styles.metaValue}>
                  {addon.categoryKo || addon.category || "-"}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>요금 방식</span>
                <span className={styles.metaValue}>
                  {FEE_TYPE_LABEL[addon.feeType]}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>단가</span>
                <span className={styles.metaValue}>
                  {addon.unitPrice.toLocaleString("ko-KR")} {addon.unit || ""}
                </span>
              </div>
            </div>
          </div>
          
          <div className={styles.cardActions}>
            <MGButton
              variant="outline"
              size="small"
              onClick={() => onEdit(addon.id)}
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


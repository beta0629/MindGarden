/**
 * Ops Portal 카드 컴포넌트
 * 표준화된 카드 형태 리스트를 위한 공통 컴포넌트
 */

import { ReactNode } from "react";
import styles from "./OpsCard.module.css";

interface OpsCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function OpsCard({ children, className = "", onClick }: OpsCardProps) {
  return (
    <div 
      className={`${styles.opsCard} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
}


"use client";

import { ReactNode } from "react";
import { COMPONENT_CSS } from "../constants/css-variables";

interface CardProps {
  icon?: string;
  iconColor?: "primary" | "success" | "warning";
  title: string;
  description: string;
  children?: ReactNode;
}

export default function Card({ icon, iconColor = "primary", title, description, children }: CardProps) {
  const iconClass = `trinity-card__icon trinity-card__icon--${iconColor}`;

  return (
    <div className={COMPONENT_CSS.CARD.CONTAINER}>
      {icon && <div className={iconClass}>{icon}</div>}
      <h3 className={COMPONENT_CSS.CARD.TITLE}>{title}</h3>
      <p className={COMPONENT_CSS.CARD.DESCRIPTION}>{description}</p>
      {children}
    </div>
  );
}


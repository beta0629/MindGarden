"use client";

import { ReactNode } from "react";
import { COMPONENT_CSS } from "../constants/css-variables";

interface SectionProps {
  id?: string;
  title?: string;
  bgSecondary?: boolean;
  wide?: boolean;
  children: ReactNode;
}

export default function Section({ id, title, bgSecondary, wide, children }: SectionProps) {
  const sectionClass = bgSecondary
    ? `${COMPONENT_CSS.SECTION.CONTAINER} trinity-section--bg-secondary`
    : COMPONENT_CSS.SECTION.CONTAINER;

  const contentClass = wide
    ? `${COMPONENT_CSS.SECTION.CONTENT} trinity-section__content--wide`
    : COMPONENT_CSS.SECTION.CONTENT;

  return (
    <section id={id} className={sectionClass}>
      <div className="container">
        {title && <h2 className={COMPONENT_CSS.SECTION.TITLE}>{title}</h2>}
        <div className={contentClass}>{children}</div>
      </div>
    </section>
  );
}


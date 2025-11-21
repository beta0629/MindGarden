"use client";

import Link from "next/link";
import { COMPONENT_CSS } from "../constants/css-variables";
import { TRINITY_CONSTANTS } from "../constants/trinity";

export default function Footer() {
  return (
    <footer className={COMPONENT_CSS.FOOTER.CONTAINER}>
      <div className="container">
        <div className={COMPONENT_CSS.FOOTER.GRID}>
          <div>
            <h3 className={COMPONENT_CSS.FOOTER.TITLE}>{TRINITY_CONSTANTS.COMPANY.NAME_FULL}</h3>
            <p className="trinity-footer__text">{TRINITY_CONSTANTS.COMPANY.DESCRIPTION}</p>
            <p className="trinity-footer__text" style={{ marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)', opacity: 0.8 }}>
              {TRINITY_CONSTANTS.BRANDING.CORESOLUTION_DESCRIPTION}
            </p>
          </div>
          <div>
            <h4 className={COMPONENT_CSS.FOOTER.TITLE}>서비스</h4>
            <ul className="trinity-footer__list">
              <li>
                <Link href="/about" className={COMPONENT_CSS.FOOTER.LINK}>
                  회사 소개
                </Link>
              </li>
              <li>
                <Link href="/services" className={COMPONENT_CSS.FOOTER.LINK}>
                  서비스 소개
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className={COMPONENT_CSS.FOOTER.LINK}>
                  가격 정보
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className={COMPONENT_CSS.FOOTER.LINK}>
                  서비스 신청
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className={COMPONENT_CSS.FOOTER.TITLE}>문의</h4>
            <p className="trinity-footer__text">{TRINITY_CONSTANTS.COMPANY.EMAIL}</p>
          </div>
        </div>
        <div className="trinity-footer__divider">
          <p>{TRINITY_CONSTANTS.COMPANY.COPYRIGHT}</p>
          <p style={{ marginTop: 'var(--spacing-xs)', fontSize: 'var(--font-size-xs)', opacity: 0.7 }}>
            {TRINITY_CONSTANTS.BRANDING.POWERED_BY}
          </p>
        </div>
      </div>
    </footer>
  );
}


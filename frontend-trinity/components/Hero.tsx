"use client";

import Link from "next/link";
import { COMPONENT_CSS } from "../constants/css-variables";
import { TRINITY_CONSTANTS } from "../constants/trinity";

export default function Hero() {
  return (
    <section className={COMPONENT_CSS.HERO.SECTION}>
      <div className="container">
        <h2 className={COMPONENT_CSS.HERO.TITLE}>
          소상공인을 위한<br />
          통합 솔루션
        </h2>
        <p className={COMPONENT_CSS.HERO.SUBTITLE}>
          {TRINITY_CONSTANTS.BRANDING.CORESOLUTION_TAGLINE}
        </p>
        <div className={COMPONENT_CSS.HERO.BUTTONS}>
          <Link href="/onboarding" className={COMPONENT_CSS.HERO.BUTTON_PRIMARY}>
            무료로 시작하기
          </Link>
          <Link href="#services" className={COMPONENT_CSS.HERO.BUTTON_SECONDARY}>
            서비스 알아보기
          </Link>
        </div>
      </div>
    </section>
  );
}


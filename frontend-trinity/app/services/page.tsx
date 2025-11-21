"use client";

import Header from "../../components/Header";
import Section from "../../components/Section";
import Card from "../../components/Card";
import Footer from "../../components/Footer";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import { COMPONENT_CSS } from "../../constants/css-variables";

export default function ServicesPage() {
  return (
    <div>
      <Header />
      
      <main className="trinity-page">
        <div className="container">
          <section className="trinity-section">
            <h1 className="trinity-section__title">서비스 소개</h1>
            
            <div className="trinity-section__content">
              <div className="trinity-section__text">
                <p>
                  Trinity는 소상공인을 위한 통합 솔루션을 제공합니다.
                  각 서비스는 업종별 특성에 맞춰 최적화되어 있습니다.
                </p>
              </div>

              <Section id="erp" title="ERP 시스템" bgSecondary>
                <div className="trinity-pricing">
                  <Card
                    icon="📊"
                    iconColor="primary"
                    title="ERP 시스템"
                    description="소상공인 맞춤형 재무/회계/정산 시스템으로 자동화된 급여, 정산, 세금 계산을 제공합니다."
                  />
                </div>
                <div className="trinity-section__text">
                  <h3>주요 기능</h3>
                  <ul className="trinity-list">
                    <li>자동화된 급여 계산 및 지급</li>
                    <li>업종별 맞춤 정산 시스템</li>
                    <li>세금 계산 및 신고 지원</li>
                    <li>재무제표 자동 생성</li>
                    <li>예산 관리 및 분석</li>
                  </ul>
                </div>
              </Section>

              <Section id="permission" title="권한 관리">
                <div className="trinity-pricing">
                  <Card
                    icon="🔐"
                    iconColor="success"
                    title="권한 관리"
                    description="업종별, 역할별 세밀한 권한 관리와 템플릿 기반 간편한 권한 설정을 제공합니다."
                  />
                </div>
                <div className="trinity-section__text">
                  <h3>주요 기능</h3>
                  <ul className="trinity-list">
                    <li>역할 기반 권한 관리 (RBAC)</li>
                    <li>업종별 권한 템플릿</li>
                    <li>세밀한 접근 제어</li>
                    <li>권한 감사 및 로깅</li>
                    <li>간편한 권한 설정 UI</li>
                  </ul>
                </div>
              </Section>

              <Section id="usability" title="쉬운 사용" bgSecondary>
                <div className="trinity-pricing">
                  <Card
                    icon="🚀"
                    iconColor="warning"
                    title="쉬운 사용"
                    description="직관적인 UI/UX로 누구나 쉽게 사용할 수 있으며, 최소한의 입력으로 최대한의 자동화를 제공합니다."
                  />
                </div>
                <div className="trinity-section__text">
                  <h3>주요 특징</h3>
                  <ul className="trinity-list">
                    <li>직관적인 사용자 인터페이스</li>
                    <li>최소한의 입력으로 최대한의 자동화</li>
                    <li>모바일 반응형 디자인</li>
                    <li>실시간 데이터 동기화</li>
                    <li>전문적인 고객 지원</li>
                  </ul>
                </div>
              </Section>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}


"use client";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import { COMPONENT_CSS } from "../../constants/css-variables";

export default function AboutPage() {
  return (
    <div>
      <Header />
      
      <main className="trinity-page">
        <div className="container">
          <section className="trinity-section">
            <h1 className="trinity-section__title">회사 소개</h1>
            
            <div className="trinity-section__content">
              <div className="trinity-section__text">
                <h2>Trinity 소개</h2>
                <p>
                  Trinity는 소상공인을 위한 혁신적인 솔루션을 제공하는 기업입니다.
                  우리는 소상공인이 대기업 수준의 시스템을 저렴한 비용으로 활용할 수 있도록 지원합니다.
                </p>
              </div>

              <div className="trinity-section__text">
                <h2>CoreSolution 플랫폼</h2>
                <p>
                  CoreSolution은 대기업 수준의 ERP 시스템을 저렴한 비용으로 제공하여,
                  소상공인도 전문적인 시스템을 활용할 수 있도록 지원합니다.
                </p>
                <p>
                  복잡한 권한 관리 없이 간단하게 운영할 수 있으며, 업종별 맞춤 기능을 제공합니다.
                </p>
              </div>

              <div className="trinity-section__text">
                <h2>우리의 비전</h2>
                <p>
                  모든 소상공인이 디지털 전환의 혜택을 누릴 수 있도록,
                  접근하기 쉽고 사용하기 편한 솔루션을 제공하는 것이 우리의 목표입니다.
                </p>
              </div>

              <div className="trinity-section__text">
                <h2>주요 특징</h2>
                <ul className="trinity-list">
                  <li>업종별 맞춤형 기능 제공</li>
                  <li>간편한 권한 관리 시스템</li>
                  <li>자동화된 정산 및 급여 계산</li>
                  <li>합리적인 가격 정책</li>
                  <li>전문적인 고객 지원</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}


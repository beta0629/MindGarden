"use client"

import { Sparkles } from "lucide-react"
import "../mindgarden-styles.css"

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="glass-card">
          <div className="welcome-badge">
            <Sparkles className="icon" />
            <span>MindGarden에 오신 것을 환영합니다</span>
          </div>
          <h1 className="gradient-text">마음을 가꾸고, 웰니스를 키워가세요</h1>
          <p className="hero-description">
            당신의 여정을 진심으로 응원하는 전문 상담사와 함께하는 따뜻한 정신 건강 지원 공간입니다.
          </p>
          <div className="button-container">
            <button className="mg-button mg-button-primary">시작하기</button>
            <button className="mg-button mg-button-outline">자세히 알아보기</button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection

"use client"

import { Sparkles, Zap, Star } from "lucide-react"
import "../mindgarden-styles.css"

const CardShowcase = () => {
  return (
    <section className="showcase-section">
      <div className="section-header">
        <h2 className="section-title">카드 컴포넌트</h2>
        <p className="section-description">다양한 스타일의 카드 디자인을 제공합니다</p>
      </div>

      <div className="card-grid">
        <div className="mg-card">
          <div className="stat-icon mb-4">
            <Sparkles size={24} />
          </div>
          <h3 className="card-title">기본 카드</h3>
          <p className="card-description">
            깔끔하고 심플한 디자인의 기본 카드입니다. 다양한 콘텐츠를 담을 수 있습니다.
          </p>
        </div>

        <div className="mg-card mg-card-glass">
          <div className="stat-icon mb-4">
            <Zap size={24} />
          </div>
          <h3 className="card-title">글라스 카드</h3>
          <p className="card-description">글라스모피즘 효과가 적용된 세련된 카드입니다. 배경이 투명하게 비칩니다.</p>
        </div>

        <div className="mg-card mg-card-gradient">
          <div className="stat-icon mb-4" style={{ background: "rgba(255,255,255,0.3)" }}>
            <Star size={24} />
          </div>
          <h3 className="card-title">그라디언트 카드</h3>
          <p className="card-description">
            아름다운 그라디언트 배경이 적용된 카드입니다. 시선을 사로잡는 디자인입니다.
          </p>
        </div>
      </div>
    </section>
  )
}

export default CardShowcase

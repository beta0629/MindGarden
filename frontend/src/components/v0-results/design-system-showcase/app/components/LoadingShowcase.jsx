"use client"

import "../mindgarden-styles.css"

const LoadingShowcase = () => {
  return (
    <section className="showcase-section">
      <div className="section-header">
        <h2 className="section-title">로딩 상태</h2>
        <p className="section-description">다양한 로딩 인디케이터</p>
      </div>

      <div className="flex gap-4 items-center justify-center" style={{ flexWrap: "wrap", padding: "40px" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="loading-spinner"></div>
          <span style={{ fontSize: "14px", color: "var(--medium-gray)" }}>스피너</span>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="loading-dots">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
          <span style={{ fontSize: "14px", color: "var(--medium-gray)" }}>도트</span>
        </div>
      </div>
    </section>
  )
}

export default LoadingShowcase

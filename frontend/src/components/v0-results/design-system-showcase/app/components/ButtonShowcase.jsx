"use client"

import { Heart, Download, Send, Trash2 } from "lucide-react"
import "../mindgarden-styles.css"

const ButtonShowcase = () => {
  return (
    <section className="showcase-section">
      <div className="section-header">
        <h2 className="section-title">버튼 컴포넌트</h2>
        <p className="section-description">다양한 스타일과 크기의 버튼을 제공합니다</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-4 items-center" style={{ flexWrap: "wrap" }}>
          <button className="mg-button mg-button-primary">
            <Heart size={18} />
            Primary Button
          </button>
          <button className="mg-button mg-button-secondary">
            <Download size={18} />
            Secondary Button
          </button>
          <button className="mg-button mg-button-outline">
            <Send size={18} />
            Outline Button
          </button>
          <button className="mg-button mg-button-ghost">Ghost Button</button>
        </div>

        <div className="flex gap-4 items-center" style={{ flexWrap: "wrap" }}>
          <button className="mg-button mg-button-primary" disabled>
            Disabled Button
          </button>
          <button className="mg-button mg-button-outline">
            <Trash2 size={18} />
            With Icon
          </button>
        </div>
      </div>
    </section>
  )
}

export default ButtonShowcase

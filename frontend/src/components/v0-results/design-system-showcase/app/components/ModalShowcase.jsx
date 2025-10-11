"use client"

import { useState } from "react"
import { X } from "lucide-react"
import "../mindgarden-styles.css"

const ModalShowcase = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section className="showcase-section">
      <div className="section-header">
        <h2 className="section-title">모달 컴포넌트</h2>
        <p className="section-description">사용자 상호작용을 위한 모달 다이얼로그</p>
      </div>

      <div className="text-center">
        <button className="mg-button mg-button-primary" onClick={() => setIsOpen(true)}>
          모달 열기
        </button>
      </div>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">환영합니다!</h3>
              <button className="modal-close" onClick={() => setIsOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <p>MindGarden 디자인 시스템에 오신 것을 환영합니다. 이 모달은 순수 CSS와 JavaScript로 만들어졌습니다.</p>
              <p style={{ marginTop: "16px" }}>글라스모피즘 효과와 부드러운 애니메이션이 적용되어 있습니다.</p>
            </div>
            <div className="modal-footer">
              <button className="mg-button mg-button-outline" onClick={() => setIsOpen(false)}>
                취소
              </button>
              <button className="mg-button mg-button-primary" onClick={() => setIsOpen(false)}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default ModalShowcase

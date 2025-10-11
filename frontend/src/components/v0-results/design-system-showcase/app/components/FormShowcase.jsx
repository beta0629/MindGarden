"use client"

import { useState } from "react"
import "../mindgarden-styles.css"

const FormShowcase = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    category: "",
    newsletter: false,
    plan: "basic",
    notifications: true,
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  return (
    <section className="showcase-section">
      <div className="section-header">
        <h2 className="section-title">폼 컴포넌트</h2>
        <p className="section-description">사용자 입력을 위한 다양한 폼 요소들</p>
      </div>

      <div className="mg-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <form>
          <div className="form-group">
            <label className="form-label">이름</label>
            <input
              type="text"
              name="name"
              className="mg-input"
              placeholder="이름을 입력하세요"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">이메일</label>
            <input
              type="email"
              name="email"
              className="mg-input"
              placeholder="email@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">카테고리</label>
            <select name="category" className="mg-select" value={formData.category} onChange={handleChange}>
              <option value="">선택하세요</option>
              <option value="general">일반 상담</option>
              <option value="stress">스트레스 관리</option>
              <option value="anxiety">불안 관리</option>
              <option value="depression">우울증</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">메시지</label>
            <textarea
              name="message"
              className="mg-textarea"
              placeholder="메시지를 입력하세요"
              value={formData.message}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="mg-checkbox">
              <input type="checkbox" name="newsletter" checked={formData.newsletter} onChange={handleChange} />
              <span>뉴스레터 구독</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">플랜 선택</label>
            <label className="mg-radio">
              <input
                type="radio"
                name="plan"
                value="basic"
                checked={formData.plan === "basic"}
                onChange={handleChange}
              />
              <span>기본 플랜</span>
            </label>
            <label className="mg-radio">
              <input
                type="radio"
                name="plan"
                value="premium"
                checked={formData.plan === "premium"}
                onChange={handleChange}
              />
              <span>프리미엄 플랜</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">알림 설정</label>
            <label className="mg-switch">
              <input type="checkbox" name="notifications" checked={formData.notifications} onChange={handleChange} />
              <span className="switch-slider"></span>
            </label>
          </div>

          <button type="submit" className="mg-button mg-button-primary" style={{ width: "100%" }}>
            제출하기
          </button>
        </form>
      </div>
    </section>
  )
}

export default FormShowcase

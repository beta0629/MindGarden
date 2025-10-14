# 글래스모피즘 카드 디자인 가이드 ✨

## 📋 개요

MindGarden 프로젝트의 카드 디자인을 글래스모피즘(Glassmorphism) 스타일로 현대적이고 깔끔하게 개선하는 가이드입니다.

## 🚨 현재 문제점

### 1. 카드 디자인 문제
- **테두리 색상**: 촌스러운 테두리 색상으로 인한 구식 느낌
- **과도한 그림자**: 너무 진한 그림자로 무거운 느낌
- **색상 대비**: 배경과의 대비가 부족하거나 과도함
- **일관성 부족**: 각 카드마다 다른 스타일
- **구식 느낌**: 평면적이고 단조로운 디자인

## 🎯 개선 목표

1. **글래스모피즘 디자인** - 투명도와 블러 효과로 현대적 느낌
2. **깔끔한 흰색 배경** - 아주 깔끔하고 미니멀한 스타일
3. **일관된 디자인 시스템** - 통일된 글래스 스타일
4. **접근성 향상** - 가독성과 사용성 개선
5. **반응형 최적화** - 모든 디바이스에서 완벽한 표시

## 🎨 글래스모피즘 카드 디자인

### 1. 기본 글래스 카드 스타일

```css
/* src/styles/components/glass-card.css */

/* 기본 글래스 카드 - 투명도와 블러 효과 */
.card {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
}

/* 카드 호버 효과 - 더 강한 글래스 효과 */
.card:hover {
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  transform: translateY(-8px) scale(1.02);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.3);
}

/* 카드 활성화 효과 */
.card:active {
  transform: translateY(-4px) scale(0.98);
  background: rgba(255, 255, 255, 0.4);
}

/* 카드 헤더 - 글래스 스타일 */
.card-header {
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 24px 28px 20px;
  border-radius: 20px 20px 0 0;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.3;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.card-subtitle {
  font-size: 14px;
  color: rgba(26, 26, 26, 0.7);
  margin: 6px 0 0 0;
  font-weight: 500;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
}

/* 카드 본문 - 글래스 스타일 */
.card-body {
  padding: 28px;
  background: transparent;
  position: relative;
}

.card-body::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  pointer-events: none;
  z-index: -1;
}

.card-text {
  color: rgba(26, 26, 26, 0.8);
  line-height: 1.7;
  margin: 0 0 20px 0;
  font-size: 15px;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
}

/* 카드 푸터 - 글래스 스타일 */
.card-footer {
  background: rgba(255, 255, 255, 0.15);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px 28px;
  border-radius: 0 0 20px 20px;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
}

/* 카드 액션 버튼 - 글래스 스타일 */
.card-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 20px;
}

.card-actions .btn {
  font-size: 14px;
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.card-actions .btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.card-actions .btn:hover::before {
  left: 100%;
}

.card-actions .btn-primary {
  background: rgba(0, 123, 255, 0.8);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
}

.card-actions .btn-primary:hover {
  background: rgba(0, 123, 255, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 123, 255, 0.4);
}

.card-actions .btn-secondary {
  background: rgba(248, 249, 250, 0.6);
  color: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.card-actions .btn-secondary:hover {
  background: rgba(248, 249, 250, 0.8);
  color: #1a1a1a;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}
```

### 2. 글래스 카드 변형 스타일

```css
/* 글래스 카드 변형들 */

/* 강조 카드 - 그라데이션 글래스 */
.card.card-highlight {
  background: linear-gradient(135deg, 
    rgba(102, 126, 234, 0.3) 0%, 
    rgba(118, 75, 162, 0.3) 100%);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 8px 32px rgba(102, 126, 234, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.card.card-highlight .card-title,
.card.card-highlight .card-subtitle,
.card.card-highlight .card-text {
  color: #1a1a1a;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

.card.card-highlight .card-header {
  background: rgba(255, 255, 255, 0.2);
  border-bottom-color: rgba(255, 255, 255, 0.3);
}

.card.card-highlight .card-footer {
  background: rgba(255, 255, 255, 0.25);
  border-top-color: rgba(255, 255, 255, 0.3);
}

/* 경고 카드 - 따뜻한 글래스 */
.card.card-warning {
  background: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.3);
  box-shadow: 
    0 8px 32px rgba(255, 193, 7, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.card.card-warning .card-title {
  color: #f57c00;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.card.card-warning .card-header {
  background: rgba(255, 193, 7, 0.1);
  border-bottom-color: rgba(255, 193, 7, 0.2);
}

/* 성공 카드 - 신선한 글래스 */
.card.card-success {
  background: rgba(40, 167, 69, 0.15);
  border: 1px solid rgba(40, 167, 69, 0.3);
  box-shadow: 
    0 8px 32px rgba(40, 167, 69, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.card.card-success .card-title {
  color: #2e7d32;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.card.card-success .card-header {
  background: rgba(40, 167, 69, 0.1);
  border-bottom-color: rgba(40, 167, 69, 0.2);
}

/* 정보 카드 - 차가운 글래스 */
.card.card-info {
  background: rgba(23, 162, 184, 0.15);
  border: 1px solid rgba(23, 162, 184, 0.3);
  box-shadow: 
    0 8px 32px rgba(23, 162, 184, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.card.card-info .card-title {
  color: #0277bd;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.card.card-info .card-header {
  background: rgba(23, 162, 184, 0.1);
  border-bottom-color: rgba(23, 162, 184, 0.2);
}

/* 위험 카드 - 강렬한 글래스 */
.card.card-danger {
  background: rgba(220, 53, 69, 0.15);
  border: 1px solid rgba(220, 53, 69, 0.3);
  box-shadow: 
    0 8px 32px rgba(220, 53, 69, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.card.card-danger .card-title {
  color: #c62828;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.card.card-danger .card-header {
  background: rgba(220, 53, 69, 0.1);
  border-bottom-color: rgba(220, 53, 69, 0.2);
}
```

### 3. 글래스 통계 카드 스타일

```css
/* 글래스 통계 카드 */
.stat-card {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  padding: 32px 24px;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, 
    rgba(102, 126, 234, 0.8), 
    rgba(118, 75, 162, 0.8));
  border-radius: 24px 24px 0 0;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  transform: translateY(-8px) scale(1.02);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 28px;
  color: white;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.stat-icon.primary { 
  background: rgba(0, 123, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.stat-icon.success { 
  background: rgba(40, 167, 69, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.stat-icon.warning { 
  background: rgba(255, 193, 7, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.stat-icon.danger { 
  background: rgba(220, 53, 69, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.stat-icon.info { 
  background: rgba(23, 162, 184, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0 0 12px 0;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 14px;
  color: rgba(26, 26, 26, 0.7);
  margin: 0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.stat-change {
  font-size: 12px;
  font-weight: 700;
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.stat-change.positive {
  background: rgba(40, 167, 69, 0.2);
  color: #2e7d32;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);
}

.stat-change.negative {
  background: rgba(220, 53, 69, 0.2);
  color: #c62828;
  box-shadow: 0 4px 15px rgba(220, 53, 69, 0.2);
}

.stat-change.neutral {
  background: rgba(108, 117, 125, 0.2);
  color: #495057;
  box-shadow: 0 4px 15px rgba(108, 117, 125, 0.2);
}
```

### 4. 글래스 관리 카드 스타일

```css
/* 글래스 관리 카드 (AdminDashboard용) */
.management-card {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  padding: 40px 32px;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.management-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, 
    rgba(102, 126, 234, 0.8), 
    rgba(118, 75, 162, 0.8));
  transform: scaleX(0);
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 24px 24px 0 0;
}

.management-card:hover::before {
  transform: scaleX(1);
}

.management-card:hover {
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  transform: translateY(-12px) scale(1.03);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.4);
}

.management-icon {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 32px;
  color: white;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.management-card:hover .management-icon {
  transform: scale(1.15) rotate(5deg);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
}

.management-content h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 12px 0;
  line-height: 1.3;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.management-content p {
  font-size: 15px;
  color: rgba(26, 26, 26, 0.7);
  margin: 0;
  line-height: 1.6;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* 아이폰 스타일 아이콘 색상 - 단순하고 깔끔 */
.management-icon.schedule { 
  background: #007aff;
  color: white;
}
.management-icon.sessions { 
  background: #34c759;
  color: white;
}
.management-icon.consultants { 
  background: #ff9500;
  color: white;
}
.management-icon.clients { 
  background: #ff3b30;
  color: white;
}
.management-icon.user-management { 
  background: #5856d6;
  color: white;
}
.management-icon.mappings { 
  background: #af52de;
  color: white;
}
.management-icon.finance { 
  background: #ff2d92;
  color: white;
}
.management-icon.revenue { 
  background: #30d158;
  color: white;
}
.management-icon.expense { 
  background: #ff9f0a;
  color: white;
}
.management-icon.payment { 
  background: #64d2ff;
  color: white;
}
.management-icon.reports { 
  background: #bf5af2;
  color: white;
}
.management-icon.settings { 
  background: #8e8e93;
  color: white;
}
.management-icon.recurring-expense { 
  background: #32d74b;
  color: white;
}

/* 모바일에서 아이콘 색상 단순화 */
@include mobile-xs {
  .management-icon {
    background: #007aff !important;
    color: white !important;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  }
  
  .stat-icon {
    background: #007aff !important;
    color: white !important;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  }
}
```

### 5. 아이폰 스타일 모바일 카드

```css
/* 아이폰 스타일 모바일 카드 - 깔끔하고 미니멀 */
@include mobile-xs {
  .card {
    margin-bottom: 12px;
    border-radius: 12px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  
  .card-header {
    padding: 16px 20px 12px;
    border-radius: 12px 12px 0 0;
    background: rgba(248, 248, 248, 0.8);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }
  
  .card-body {
    padding: 20px;
  }
  
  .card-footer {
    padding: 12px 20px;
    border-radius: 0 0 12px 12px;
    background: rgba(248, 248, 248, 0.6);
  }
  
  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #1d1d1f;
  }
  
  .card-subtitle {
    font-size: 12px;
    color: #86868b;
    font-weight: 400;
  }
  
  .card-text {
    font-size: 13px;
    color: #1d1d1f;
    line-height: 1.4;
  }
  
  .stat-card {
    padding: 20px 16px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(0, 0, 0, 0.04);
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #1d1d1f;
  }
  
  .stat-label {
    font-size: 11px;
    color: #86868b;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .stat-icon {
    width: 44px;
    height: 44px;
    font-size: 20px;
    border-radius: 12px;
    background: #007aff;
    color: white;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  }
  
  .stat-change {
    font-size: 10px;
    padding: 4px 8px;
    border-radius: 8px;
    font-weight: 600;
  }
  
  .management-card {
    padding: 24px 20px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(0, 0, 0, 0.04);
  }
  
  .management-icon {
    width: 48px;
    height: 48px;
    font-size: 22px;
    border-radius: 14px;
    background: #007aff;
    color: white;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  }
  
  .management-content h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1d1d1f;
  }
  
  .management-content p {
    font-size: 12px;
    color: #86868b;
    font-weight: 400;
  }
  
  /* 아이폰 스타일 버튼 */
  .card-actions .btn {
    font-size: 13px;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 500;
  }
  
  .card-actions .btn-primary {
    background: #007aff;
    color: white;
    border: none;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  }
  
  .card-actions .btn-secondary {
    background: rgba(142, 142, 147, 0.12);
    color: #007aff;
    border: none;
  }
  
  /* 아이폰 스타일 추가 최적화 */
  .card:hover {
    transform: none; /* 모바일에서는 호버 효과 제거 */
  }
  
  .management-card:hover {
    transform: none; /* 모바일에서는 호버 효과 제거 */
  }
  
  .stat-card:hover {
    transform: none; /* 모바일에서는 호버 효과 제거 */
  }
  
  /* 아이폰 스타일 터치 피드백 */
  .card:active {
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }
  
  .management-card:active {
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }
  
  .stat-card:active {
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }
  
  /* 아이폰 스타일 폰트 최적화 */
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* 아이폰 스타일 스크롤바 */
  ::-webkit-scrollbar {
    width: 0px;
    background: transparent;
  }
  
  /* 아이폰 스타일 포커스 링 */
  .card:focus,
  .management-card:focus,
  .stat-card:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3);
  }
}

@include tablet-md {
  .card {
    margin-bottom: 24px;
    border-radius: 20px;
  }
  
  .card-header {
    padding: 24px 28px 20px;
  }
  
  .card-body {
    padding: 28px;
  }
  
  .card-footer {
    padding: 20px 28px;
  }
  
  .stat-card {
    padding: 28px 24px;
  }
  
  .stat-icon {
    width: 72px;
    height: 72px;
    font-size: 28px;
  }
  
  .management-card {
    padding: 36px 28px;
  }
  
  .management-icon {
    width: 72px;
    height: 72px;
    font-size: 28px;
  }
}

@include desktop-lg {
  .card {
    margin-bottom: 32px;
  }
  
  .card-header {
    padding: 28px 32px 24px;
  }
  
  .card-body {
    padding: 32px;
  }
  
  .card-footer {
    padding: 24px 32px;
  }
  
  .stat-card {
    padding: 36px 32px;
  }
  
  .management-card {
    padding: 44px 36px;
  }
}
```

## 🎨 아이폰 스타일 색상 팔레트

### 아이폰 색상 변수
```css
:root {
  /* 아이폰 시스템 색상 */
  --ios-blue: #007aff;
  --ios-green: #34c759;
  --ios-orange: #ff9500;
  --ios-red: #ff3b30;
  --ios-purple: #5856d6;
  --ios-pink: #ff2d92;
  --ios-yellow: #ffcc00;
  --ios-gray: #8e8e93;
  
  /* 아이폰 텍스트 색상 */
  --ios-text-primary: #1d1d1f;
  --ios-text-secondary: #86868b;
  --ios-text-tertiary: #c7c7cc;
  
  /* 아이폰 배경 색상 */
  --ios-bg-primary: #ffffff;
  --ios-bg-secondary: #f2f2f7;
  --ios-bg-tertiary: #ffffff;
  
  /* 아이폰 카드 색상 */
  --ios-card-bg: rgba(255, 255, 255, 0.9);
  --ios-card-border: rgba(0, 0, 0, 0.05);
  --ios-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  
  /* 아이폰 버튼 색상 */
  --ios-btn-primary: #007aff;
  --ios-btn-secondary: rgba(142, 142, 147, 0.12);
  --ios-btn-destructive: #ff3b30;
  
  /* 아이폰 아이콘 색상 */
  --ios-icon-schedule: #007aff;
  --ios-icon-sessions: #34c759;
  --ios-icon-consultants: #ff9500;
  --ios-icon-clients: #ff3b30;
  --ios-icon-user: #5856d6;
  --ios-icon-mappings: #af52de;
  --ios-icon-finance: #ff2d92;
  --ios-icon-revenue: #30d158;
  --ios-icon-expense: #ff9f0a;
  --ios-icon-payment: #64d2ff;
  --ios-icon-reports: #bf5af2;
  --ios-icon-settings: #8e8e93;
  --ios-icon-recurring: #32d74b;
  
  /* 모바일 전용 색상 */
  --mobile-bg: rgba(255, 255, 255, 0.95);
  --mobile-border: rgba(0, 0, 0, 0.04);
  --mobile-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --mobile-icon-bg: #007aff;
  --mobile-icon-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}
```

## 📱 글래스모피즘 적용 예시

### HTML 구조
```html
<!-- 기본 글래스 카드 -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">글래스 카드 제목</h3>
    <p class="card-subtitle">투명도와 블러 효과</p>
  </div>
  <div class="card-body">
    <p class="card-text">현대적이고 깔끔한 글래스모피즘 디자인입니다.</p>
  </div>
  <div class="card-footer">
    <div class="card-actions">
      <button class="btn btn-secondary">취소</button>
      <button class="btn btn-primary">확인</button>
    </div>
  </div>
</div>

<!-- 글래스 통계 카드 -->
<div class="stat-card">
  <div class="stat-icon primary">
    <i class="bi bi-people"></i>
  </div>
  <div class="stat-value">1,234</div>
  <div class="stat-label">총 사용자</div>
  <div class="stat-change positive">
    <i class="bi bi-arrow-up"></i>
    +12.5%
  </div>
</div>

<!-- 글래스 관리 카드 -->
<div class="management-card">
  <div class="management-icon schedule">
    <i class="bi bi-calendar"></i>
  </div>
  <div class="management-content">
    <h3>스케줄 관리</h3>
    <p>상담 일정을 관리합니다</p>
  </div>
</div>

<!-- 글래스 변형 카드들 -->
<div class="card card-highlight">
  <div class="card-header">
    <h3 class="card-title">강조 카드</h3>
  </div>
  <div class="card-body">
    <p class="card-text">그라데이션 글래스 효과</p>
  </div>
</div>

<div class="card card-success">
  <div class="card-header">
    <h3 class="card-title">성공 카드</h3>
  </div>
  <div class="card-body">
    <p class="card-text">신선한 글래스 효과</p>
  </div>
</div>
```

## 🎯 아이폰 스타일 개선 효과

### Before (기존)
- ❌ 촌스러운 테두리 색상
- ❌ 과도한 그림자
- ❌ 일관성 없는 디자인
- ❌ 구식 느낌
- ❌ 평면적이고 단조로운 디자인
- ❌ 모바일 최적화 부족

### After (아이폰 스타일 개선)
- ✅ **아이폰 네이티브 디자인** - iOS 시스템과 일치하는 디자인
- ✅ **작고 깔끔한 폰트** - 모바일 최적화된 폰트 크기
- ✅ **단순한 아이콘 색상** - 그라데이션 제거, 단색 아이콘
- ✅ **아이폰 시스템 폰트** - SF Pro Display/Text 사용
- ✅ **터치 피드백** - `:active` 상태에서 스케일 효과
- ✅ **모바일 최적화** - 호버 효과 제거, 터치 중심
- ✅ **일관된 색상 시스템** - iOS 시스템 색상 팔레트
- ✅ **깔끔한 그림자** - 미니멀하고 자연스러운 그림자

### 아이폰 스타일 특징
- **시스템 폰트**: `-apple-system, BlinkMacSystemFont` - 네이티브 느낌
- **작은 폰트**: 모바일에서 12-16px - 깔끔하고 읽기 쉬움
- **단색 아이콘**: 그라데이션 제거, iOS 시스템 색상 사용
- **터치 피드백**: `transform: scale(0.98)` - 터치 시 반응
- **미니멀 디자인**: 불필요한 효과 제거, 깔끔한 UI
- **iOS 색상**: `#007aff`, `#34c759` 등 iOS 시스템 색상
- **스크롤바 제거**: `::-webkit-scrollbar { width: 0px }` - 깔끔한 스크롤

---

**작성일**: 2025-01-30  
**작성자**: AI Assistant  
**버전**: 3.0 (아이폰 스타일 모바일 최적화)  
**상태**: 완료

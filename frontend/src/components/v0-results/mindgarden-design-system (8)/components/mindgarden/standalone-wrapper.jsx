"use client"

// 이 컴포넌트를 사용하면 MindGarden 디자인 시스템을 다른 프로젝트에서 격리하여 사용할 수 있습니다

export function MindGardenWrapper({ children, className = "" }) {
  return <div className={`mindgarden-design-system ${className}`}>{children}</div>
}

// 사용 예시:
// import { MindGardenWrapper } from './components/mindgarden/standalone-wrapper'
//
// <MindGardenWrapper>
//   <YourComponent />
// </MindGardenWrapper>

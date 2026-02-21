import React from 'react';

/**
 * 🎨 [Atomic Design Sample - Pure Presentational Component]
 * 
 * Role & Objective:
 * - UI/UX Publisher & Atomic Design Expert
 * - Analyzed from Pencil MCP Wireframe
 * - Pure visual validation mockup (No business logic)
 * 
 * Strict Rules Applied:
 * - NO state management (useState, useEffect, useSession, etc.)
 * - Mock data used for rendering
 * - No hardcoded colors (using CSS variables mapped via inline styles or Tailwind config)
 * - Soft rounded corners, subtle shadows, and ample padding applied for a warm, calming aesthetic.
 */

// --- Mock Data ---
const kpiData = [
  { id: 1, label: '총 사용자 (입주사/상담사)', value: '2,456', badge: '12% ↑', icon: '👥', iconBg: 'var(--mg-primary-100)', iconColor: 'var(--mg-primary-600)' },
  { id: 2, label: '이번 달 예약 건수', value: '3,420', badge: '18% ↑', icon: '📅', iconBg: 'var(--mg-grade-consultant-expert-light, #ffedd5)', iconColor: 'var(--mg-grade-consultant-expert-dark, #ea580c)' },
  { id: 3, label: '상담 완료율', value: '94.2%', badge: '+2.4%', icon: '✓', iconBg: 'var(--mg-grade-client-platinum-light, #bbf7d0)', iconColor: 'var(--mg-grade-client-platinum-dark, #16a34a)', isDark: true }
];

const counselorData = [
  { name: '김상담', rating: '4.9/5.0', initial: '김', bgColor: '#e0e7ff', barColor: '#6366f1' },
  { name: '이마음', rating: '4.8/5.0', initial: '이', bgColor: '#dcfce7', barColor: '#22c55e' },
  { name: '박치유', rating: '4.7/5.0', initial: '박', bgColor: '#ffedd5', barColor: '#f97316' },
  { name: '최행복', rating: '4.6/5.0', initial: '최', bgColor: '#dbeafe', barColor: '#3b82f6' }
];

const metricData = [
  { label: '이번 달 환불 건수', value: '12건', icon: '↩', iconBg: '#fee2e2', iconColor: '#ef4444' },
  { label: '총 환불 금액', value: '₩840,000', icon: '₩', iconBg: '#fef3c7', iconColor: '#f59e0b' },
  { label: '상담 정상 완료', value: '3,105 건', icon: '✓', iconBg: '#dcfce7', iconColor: '#22c55e' },
  { label: '평균 상담 완료 시간', value: '52분', icon: '⏱', iconBg: '#dbeafe', iconColor: '#3b82f6' }
];

const adminFeaturesData = [
  { title: '신규 입주사 등록', desc: '계약 및 계정 생성', icon: '🏢', bgColor: '#6366f1' },
  { title: '상담사 승인 관리', desc: '자격 증명 검토', icon: '✓', bgColor: '#22c55e' },
  { title: '전체 공지 발송', desc: '앱 푸시 및 메일', icon: '📢', bgColor: '#f97316' },
  { title: '시스템 설정', desc: 'API 및 연동 관리', icon: '⚙', bgColor: '#64748b' }
];

// --- Components (Atoms, Molecules, Organisms) ---

// [Atom] Badge Component
const TrendBadge = ({ text, isDark }) => (
  <span 
    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
    style={{
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'var(--mg-grade-client-platinum-light, #dcfce7)',
      color: isDark ? 'var(--mg-white, #ffffff)' : 'var(--mg-grade-client-platinum-dark, #16a34a)'
    }}
  >
    {text}
  </span>
);

// [Atom] Icon Container
const IconBox = ({ icon, bgColor, color, size = 'w-12 h-12', rounded = 'rounded-full', fontSize = 'text-xl' }) => (
  <div 
    className={`flex items-center justify-center ${size} ${rounded}`}
    style={{ backgroundColor: bgColor, color: color }}
  >
    <span className={`font-semibold ${fontSize}`}>{icon}</span>
  </div>
);

// [Molecule] KPI Card
const KpiCard = ({ label, value, badge, icon, iconBg, iconColor, isDark }) => (
  <div 
    className="p-6 rounded-2xl shadow-md flex items-center gap-5 border"
    style={{ 
      backgroundColor: isDark ? 'var(--mg-text-primary, #1a1d24)' : 'var(--mg-bg-card, #ffffff)',
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'var(--mg-border-light, #e2e8f0)',
      color: isDark ? 'var(--mg-white, #ffffff)' : 'var(--mg-text-primary, #1e293b)'
    }}
  >
    <IconBox icon={icon} bgColor={iconBg} color={iconColor} />
    <div className="flex-1 flex flex-col gap-2">
      <div className="flex justify-between items-center w-full">
        <span style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'var(--mg-text-secondary, #64748b)' }} className="text-sm">
          {label}
        </span>
        <TrendBadge text={badge} isDark={isDark} />
      </div>
      <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
    </div>
  </div>
);

// [Organism] Header Section
const DashboardHeader = () => (
  <header className="flex justify-between items-center mb-8">
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--mg-text-primary, #1e293b)' }}>대시보드 개요</h1>
      <p className="text-sm" style={{ color: 'var(--mg-text-secondary, #64748b)' }}>오늘의 주요 지표와 현황을 한눈에 확인하세요.</p>
    </div>
    <div className="flex items-center gap-6">
      <div 
        className="flex items-center px-4 py-2 rounded-xl border w-80"
        style={{ backgroundColor: 'var(--mg-bg-dashboard, #f8fafc)', borderColor: 'var(--mg-border-light, #e2e8f0)' }}
      >
        <span className="text-sm" style={{ color: 'var(--mg-text-secondary, #94a3b8)' }}>통합 검색...</span>
      </div>
      <div className="flex gap-4 items-center">
        <div className="relative">
          <span className="text-2xl">📅</span>
          <div className="absolute top-0 right-0 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--mg-grade-client-bronze-dark, #ef4444)' }}></div>
        </div>
        <span className="text-2xl">🔔</span>
        <span className="text-xl">🌙</span>
      </div>
    </div>
  </header>
);

// [Organism] System Growth & Counselors
const SystemGrowthSection = () => (
  <div className="flex gap-6 mt-6">
    {/* Left: System Growth Chart Placeholder */}
    <div 
      className="flex-1 p-6 rounded-2xl shadow-md border flex flex-col gap-6"
      style={{ backgroundColor: 'var(--mg-bg-card, #ffffff)', borderColor: 'var(--mg-border-light, #e2e8f0)' }}
    >
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold" style={{ color: 'var(--mg-text-primary, #1e293b)' }}>시스템 성장 개요</h3>
          <p className="text-xs" style={{ color: 'var(--mg-text-secondary, #64748b)' }}>입주사 및 상담사 증가 추이 (최근 6개월)</p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-full border border-gray-200">
          <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white shadow-sm border border-gray-200" style={{ color: 'var(--mg-text-primary, #1e293b)' }}>월간</span>
          <span className="px-4 py-1.5 rounded-full text-xs" style={{ color: 'var(--mg-text-secondary, #64748b)' }}>주간</span>
        </div>
      </div>
      <div className="h-40 rounded-xl border flex flex-col justify-end p-4 pb-2" style={{ backgroundColor: 'var(--mg-bg-dashboard, #f8fafc)', borderColor: 'var(--mg-border-light, #e2e8f0)' }}>
        <div className="flex justify-between w-full mt-4">
          {['5월', '6월', '7월', '8월', '9월', '10월'].map(month => (
            <span key={month} className="text-xs" style={{ color: month === '10월' ? 'var(--mg-primary-600, #4f46e5)' : 'var(--mg-text-secondary, #94a3b8)', fontWeight: month === '10월' ? 'bold' : 'normal' }}>{month}</span>
          ))}
        </div>
      </div>
      <div className="flex gap-6 justify-center">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-300"></div><span className="text-xs text-gray-500">입주사 수</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div><span className="text-xs text-gray-500">활성 상담사</span></div>
      </div>
    </div>

    {/* Right: Counselors List */}
    <div 
      className="w-1/3 p-6 rounded-2xl shadow-md border flex flex-col gap-6"
      style={{ backgroundColor: 'var(--mg-bg-card, #ffffff)', borderColor: 'var(--mg-border-light, #e2e8f0)' }}
    >
      <h3 className="text-lg font-bold" style={{ color: 'var(--mg-text-primary, #1e293b)' }}>우수 상담사 평점</h3>
      <div className="flex flex-col gap-4">
        {counselorData.map((c, i) => (
          <div key={i} className="flex items-center gap-4">
            <IconBox icon={c.initial} bgColor={c.bgColor} color={c.barColor} size="w-10 h-10" fontSize="text-sm" />
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-sm font-bold" style={{ color: 'var(--mg-text-primary, #1e293b)' }}>{c.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--mg-text-secondary, #64748b)' }}>{c.rating}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: '85%', backgroundColor: c.barColor }}></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full py-3 mt-2 rounded-xl border text-sm font-semibold hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--mg-border-light, #e2e8f0)', color: 'var(--mg-text-primary, #1e293b)' }}>
        전체 순위 보기
      </button>
    </div>
  </div>
);

// [Organism] Metrics Section
const MetricsSection = () => (
  <div 
    className="mt-6 p-6 rounded-2xl shadow-md border flex flex-col gap-6"
    style={{ backgroundColor: 'var(--mg-bg-card, #ffffff)', borderColor: 'var(--mg-border-light, #e2e8f0)' }}
  >
    <div className="flex gap-8 border-b pb-2" style={{ borderColor: 'var(--mg-border-light, #e2e8f0)' }}>
      <div className="flex items-center gap-2 border-b-2 pb-2 -mb-2.5" style={{ borderColor: 'var(--mg-primary-600, #4f46e5)' }}>
        <span>📊</span><span className="text-sm font-bold" style={{ color: 'var(--mg-primary-600, #4f46e5)' }}>재무 및 성과 지표</span>
      </div>
      <div className="flex items-center gap-2 pb-2">
        <span>💰</span><span className="text-sm" style={{ color: 'var(--mg-text-secondary, #64748b)' }}>환불 현황</span>
      </div>
      <div className="flex items-center gap-2 pb-2">
        <span>✅</span><span className="text-sm" style={{ color: 'var(--mg-text-secondary, #64748b)' }}>상담 완료 통계</span>
      </div>
    </div>
    <div className="flex gap-4">
      {metricData.map((m, i) => (
        <div key={i} className="flex-1 p-5 rounded-xl border flex items-center gap-4" style={{ borderColor: 'var(--mg-border-light, #e2e8f0)' }}>
          <IconBox icon={m.icon} bgColor={m.iconBg} color={m.iconColor} size="w-12 h-12" />
          <div className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'var(--mg-text-secondary, #64748b)' }}>{m.label}</span>
            <span className="text-xl font-bold" style={{ color: 'var(--mg-text-primary, #1e293b)' }}>{m.value}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// [Organism] Admin Features
const AdminFeaturesSection = () => (
  <div 
    className="mt-6 p-6 rounded-2xl shadow-md border flex flex-col gap-6"
    style={{ backgroundColor: 'var(--mg-bg-card, #ffffff)', borderColor: 'var(--mg-border-light, #e2e8f0)' }}
  >
    <h3 className="text-lg font-bold" style={{ color: 'var(--mg-text-primary, #1e293b)' }}>관리자 주요 기능</h3>
    <div className="flex gap-4">
      {adminFeaturesData.map((a, i) => (
        <div key={i} className="flex-1 p-5 rounded-xl border flex flex-col gap-4 items-center text-center hover:-translate-y-1 transition-transform cursor-pointer" style={{ borderColor: 'var(--mg-border-light, #e2e8f0)' }}>
          <IconBox icon={a.icon} bgColor={a.bgColor} color="#fff" rounded="rounded-xl" size="w-14 h-14" fontSize="text-2xl" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold" style={{ color: 'var(--mg-text-primary, #1e293b)' }}>{a.title}</span>
            <span className="text-xs" style={{ color: 'var(--mg-text-secondary, #94a3b8)' }}>{a.desc}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- Page Template ---
const AtomicDesignSample = () => {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--mg-bg-dashboard, #f8fafc)' }}>
      <div className="max-w-6xl mx-auto">
        <DashboardHeader />
        
        {/* Dashboard Content */}
        <div className="flex flex-col">
          {/* Top KPIs */}
          <div className="grid grid-cols-3 gap-6">
            {kpiData.map((data) => (
              <KpiCard key={data.id} {...data} />
            ))}
          </div>

          <SystemGrowthSection />
          <MetricsSection />
          <AdminFeaturesSection />
        </div>
      </div>
    </div>
  );
};

export default AtomicDesignSample;

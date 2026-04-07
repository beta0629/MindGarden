import Link from 'next/link';
import { checklistLegalNotice } from '@/lib/checklist-legal-notice';
import { screeningData, SCREENING_TOPIC_ORDER } from '@/lib/screening-data';

export const metadata = {
  title: '주제별 간이 체크리스트 | 마인드가든',
  description:
    '간이 체크리스트는 아동·청소년과 성인이 일상에서 겪을 수 있는 패턴을 기준으로 스스로 살펴볼 수 있도록 구성했습니다. ADHD·우울·공황 등 주제별 점검(의학적 진단 대체 아님).',
};

export default function ScreeningHubPage() {
  const topics = SCREENING_TOPIC_ORDER.map((key) => screeningData[key]);

  return (
    <main className="content-shell">
      <div className="screening-hub">
        <h1 className="screening-hub-title">주제별 간이 체크리스트</h1>
        <p className="screening-hub-desc" style={{ marginBottom: '1rem' }}>
          현재 겪고 있는 어려움을 간단히 점검해 보세요.
        </p>
        <div
          className="screening-disclaimer"
          role="note"
          style={{
            marginTop: 0,
            marginBottom: '3rem',
            maxWidth: '720px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {checklistLegalNotice.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="screening-grid">
          {topics.map((topic) => (
            <Link 
              key={topic.topic} 
              href={`/screening/${topic.topic}`}
              className="screening-card"
            >
              <div className="screening-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h2 className="screening-card-title">{topic.title}</h2>
              <p className="screening-card-desc">{topic.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

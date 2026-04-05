import { Link } from 'react-router-dom';
import {
  BarChart2,
  Users,
  ClipboardList,
  Siren,
  GraduationCap,
  FileText,
  Trash2,
  Search,
  ChevronRight,
  BookOpen,
  Target,
  Phone
} from 'lucide-react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import SafeText from '../common/SafeText';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ComplianceMenu.css';

const ICON_COMMON = {
  className: 'mg-v2-compliance-menu__tile-icon-svg',
  size: 28,
  strokeWidth: 2,
  'aria-hidden': true
};

function ComplianceMenuNav({ items }) {
  return (
    <nav
      className="mg-v2-compliance-menu__nav"
      aria-label="컴플라이언스 하위 메뉴"
    >
      <ul className="mg-v2-compliance-menu__grid">
        {items.map((item) => {
          const TileIcon = item.Icon;
          return (
            <li key={item.id} className="mg-v2-compliance-menu__grid-item">
              <Link
                to={item.path}
                className={`mg-v2-compliance-menu__tile mg-v2-compliance-menu__tile--${item.color}`}
              >
                <span className="mg-v2-compliance-menu__tile-icon-wrap">
                  <TileIcon {...ICON_COMMON} />
                </span>
                <span className="mg-v2-compliance-menu__tile-body">
                  <span className="mg-v2-compliance-menu__tile-title">
                    <SafeText>{item.title}</SafeText>
                  </span>
                  <span className="mg-v2-compliance-menu__tile-desc">
                    <SafeText>{item.description}</SafeText>
                  </span>
                </span>
                <span className="mg-v2-compliance-menu__tile-chevron" aria-hidden>
                  <ChevronRight
                    className="mg-v2-compliance-menu__chevron-svg"
                    size={22}
                    strokeWidth={2}
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ComplianceMenuInfoSection() {
  return (
    <section
      className="mg-v2-compliance-menu__info"
      aria-labelledby="compliance-menu-info-heading"
    >
      <h2 id="compliance-menu-info-heading" className="mg-v2-compliance-menu__info-sr-title">
        부가 정보
      </h2>
      <div className="mg-v2-compliance-menu__info-grid">
        <article className="mg-v2-compliance-menu__info-card mg-v2-ad-b0kla__card">
          <h3 className="mg-v2-compliance-menu__info-card-title">
            <BookOpen
              className="mg-v2-compliance-menu__info-card-icon"
              size={20}
              strokeWidth={2}
              aria-hidden
            />
            <span>법적 근거</span>
          </h3>
          <ul className="mg-v2-compliance-menu__info-list">
            <li>개인정보보호법</li>
            <li>정보통신망법</li>
            <li>의료법</li>
            <li>상법</li>
            <li>근로기준법</li>
          </ul>
        </article>

        <article className="mg-v2-compliance-menu__info-card mg-v2-ad-b0kla__card">
          <h3 className="mg-v2-compliance-menu__info-card-title">
            <Target
              className="mg-v2-compliance-menu__info-card-icon"
              size={20}
              strokeWidth={2}
              aria-hidden
            />
            <span>주요 기능</span>
          </h3>
          <ul className="mg-v2-compliance-menu__info-list">
            <li>실시간 모니터링</li>
            <li>자동화된 파기 시스템</li>
            <li>접근 로그 관리</li>
            <li>영향평가 자동화</li>
            <li>교육 프로그램 관리</li>
          </ul>
        </article>

        <article
          className="mg-v2-compliance-menu__info-card mg-v2-compliance-menu__info-card--full mg-v2-ad-b0kla__card"
        >
          <h3 className="mg-v2-compliance-menu__info-card-title">
            <Phone
              className="mg-v2-compliance-menu__info-card-icon"
              size={20}
              strokeWidth={2}
              aria-hidden
            />
            <span>문의 및 지원</span>
          </h3>
          <div className="mg-v2-compliance-menu__contact">
            <p>
              <strong>개인정보보호책임자:</strong>{' '}
              privacy@mindgarden.co.kr
            </p>
            <p>
              <strong>전화:</strong> 02-1234-5678
            </p>
            <p>
              <strong>주소:</strong> 서울시 강남구 테헤란로 123
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

/**
 * 컴플라이언스 메뉴 컴포넌트
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2024-12-19
 */
const ComplianceMenu = () => {
  const complianceMenuItems = [
    {
      id: 'dashboard',
      title: '컴플라이언스 대시보드',
      description: '종합 모니터링 현황',
      Icon: BarChart2,
      path: '/admin/compliance/dashboard',
      color: 'primary'
    },
    {
      id: 'personal-data-processing',
      title: '개인정보 처리 현황',
      description: '처리 현황 및 통계',
      Icon: Users,
      path: '/admin/compliance/personal-data-processing',
      color: 'secondary'
    },
    {
      id: 'impact-assessment',
      title: '개인정보 영향평가',
      description: '위험도 분석 및 평가',
      Icon: ClipboardList,
      path: '/admin/compliance/impact-assessment',
      color: 'tertiary'
    },
    {
      id: 'breach-response',
      title: '침해사고 대응',
      description: '대응 절차 및 팀 구성',
      Icon: Siren,
      path: '/admin/compliance/breach-response',
      color: 'danger'
    },
    {
      id: 'education',
      title: '개인정보보호 교육',
      description: '교육 프로그램 및 이수 현황',
      Icon: GraduationCap,
      path: '/admin/compliance/education',
      color: 'info'
    },
    {
      id: 'policy',
      title: '개인정보 처리방침',
      description: '처리방침 관리 및 업데이트',
      Icon: FileText,
      path: '/admin/compliance/policy',
      color: 'success'
    },
    {
      id: 'destruction',
      title: '개인정보 파기 관리',
      description: '파기 현황 및 자동화',
      Icon: Trash2,
      path: '/admin/compliance/destruction',
      color: 'warning'
    },
    {
      id: 'audit',
      title: '컴플라이언스 감사',
      description: '감사 로그 및 보고서',
      Icon: Search,
      path: '/admin/compliance/audit',
      color: 'dark'
    }
  ];

  return (
    <AdminCommonLayout title="컴플라이언스 관리">
      <div className="mg-v2-ad-b0kla">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel="컴플라이언스 관리 콘텐츠">
            <ContentHeader
              title="컴플라이언스 관리"
              subtitle="개인정보보호법 및 관련 법령 준수를 위한 통합 관리 허브입니다."
              titleId="compliance-menu-page-title"
            />
            <main
              id="compliance-menu-main"
              className="mg-v2-compliance-menu"
              aria-labelledby="compliance-menu-page-title"
            >
              <ComplianceMenuNav items={complianceMenuItems} />
              <ComplianceMenuInfoSection />
            </main>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default ComplianceMenu;

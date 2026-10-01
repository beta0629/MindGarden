/**
 * 공개 /services — 상담 서비스 안내. 로그인 없이 호스트의 테넌트를 보여 준다.
 *
 * @author CoreSolution
 * @since 2026-10-01
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import {
  COUNSELING_SERVICE_GUIDE,
  LEGAL_PUBLIC_LABELS,
  LEGAL_PUBLIC_PATHS,
  LEGAL_TERMS_REFUND_HREF
} from '../../constants/legalPublic';
import { fetchTenantPublicHomeMeta } from '../../utils/tenantPublicHomeMeta';
import {
  PUBLIC_GUIDE_COPY,
  PUBLIC_GUIDE_PROCESS,
  PUBLIC_GUIDE_TYPES
} from '../../constants/publicCounselingGuideCopy';
import {
  GUIDE_COPY,
  buildGuideView,
  formatGuideComposition,
  formatGuidePrice,
  formatGuideSessions,
  formatGuideValidity,
  sharedGuideMinutes
} from '../../utils/counselingServiceGuide';
import './CounselingServiceGuidePage.css';

const EMPTY_VIEW = buildGuideView(null);

/**
 * @param {string} name
 * @param {string} content
 */
function upsertMeta(name, content) {
  if (typeof document === 'undefined') {
    return;
  }
  let node = document.querySelector(`meta[name="${name}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute('name', name);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
}

const CounselingServiceGuidePage = () => {
  const [view, setView] = useState(EMPTY_VIEW);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meta = await fetchTenantPublicHomeMeta();
        if (!cancelled) {
          setView(buildGuideView(meta));
        }
      } catch (err) {
        console.warn('상담 서비스 안내 로드 실패:', err);
        if (!cancelled) {
          setView(EMPTY_VIEW);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.title = view.pageTitle;
    upsertMeta('description', view.pageDescription);
    upsertMeta('robots', 'index');
    const origin = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '';
    if (origin) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', `${origin}${COUNSELING_SERVICE_GUIDE.PATH}`);
    }
  }, [view.pageTitle, view.pageDescription]);

  const minutes = sharedGuideMinutes(view.types);
  const productsEmpty = view.businessLandline
    ? GUIDE_COPY.PRODUCTS_EMPTY_WITH_PHONE.replace('%s', view.businessLandline)
    : GUIDE_COPY.PRODUCTS_EMPTY;
  const face = view.types.some((type) => String(type.modality || '').replace('비대면', '').includes('대면'));
  const remote = view.types.some((type) => String(type.modality || '').includes('비대면'));

  return (
    <CommonPageTemplate
      title={view.pageTitle}
      description={view.pageDescription}
      bodyClass="mg-svc-body"
    >
      <div className="mg-svc" data-testid="counseling-service-guide-page">
        <header className="mg-svc__header">
          <p className="mg-svc__brand">{view.centerName || COUNSELING_SERVICE_GUIDE.LABEL}</p>
          <Link to="/login" className="mg-svc__login">로그인</Link>
        </header>
        <main className="mg-svc__stage">
          {loading ? (
            <p>불러오는 중…</p>
          ) : (
            <>
              <p className="mg-svc__eyebrow">{COUNSELING_SERVICE_GUIDE.LABEL}</p>
              <h1>
                {view.centerName
                  ? `${view.centerName} 심리상담 서비스 안내`
                  : '심리상담 서비스 안내'}
              </h1>
              <p className="mg-svc__def">{view.oneLiner}</p>
              <ul className="mg-svc__chips">
                {face ? <li>대면 상담</li> : null}
                {remote ? <li>비대면 상담</li> : null}
                {minutes !== null ? <li>{`1회 ${minutes}분`}</li> : null}
                <li>카드 결제</li>
              </ul>
              {view.businessLandline ? (
                <p>
                  <a href={`tel:${view.businessLandline.replace(/\s/g, '')}`}>
                    {`전화 문의 ${view.businessLandline}`}
                  </a>
                </p>
              ) : null}
              <nav className="mg-svc__nav" aria-label="페이지 안 이동">
                <a href="#center">센터 소개</a>
                <a href="#types">상담 종류</a>
                <a href="#process">진행 절차</a>
                <a href="#counselors">상담사</a>
                <a href="#products">상품·가격</a>
                <a href="#policy">환불·개인정보</a>
              </nav>

              <section id="center">
                <h2>센터 소개</h2>
                {view.centerIntro ? <p>{view.centerIntro}</p> : null}
                <dl>
                  <dt>센터명</dt>
                  <dd>{PUBLIC_GUIDE_COPY.CENTER_NAME}</dd>
                  <dt>주소</dt>
                  <dd>{PUBLIC_GUIDE_COPY.CENTER_ADDRESS}</dd>
                  <dt>전화</dt>
                  <dd>{PUBLIC_GUIDE_COPY.CENTER_PHONE}</dd>
                  <dt>운영시간</dt>
                  <dd>{PUBLIC_GUIDE_COPY.CENTER_HOURS}</dd>
                  {view.representativeName ? (
                    <><dt>대표</dt><dd>{view.representativeName}</dd></>
                  ) : null}
                  {view.businessRegistrationNumber ? (
                    <><dt>사업자등록번호</dt><dd>{view.businessRegistrationNumber}</dd></>
                  ) : null}
                  {view.mailOrderReportNumber ? (
                    <><dt>통신판매신고번호</dt><dd>{view.mailOrderReportNumber}</dd></>
                  ) : null}
                </dl>
              </section>

              <section id="types">
                <h2>상담 종류</h2>
                <ul>
                  {PUBLIC_GUIDE_TYPES.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p>{PUBLIC_GUIDE_COPY.COMMON_NOTICE}</p>
              </section>

              <section id="process">
                <h2>진행 절차</h2>
                <p>{PUBLIC_GUIDE_COPY.PROCESS_LINE}</p>
                <ol>
                  {PUBLIC_GUIDE_PROCESS.map((step, index) => (
                    <li key={step}><h3>{`${index + 1}. ${step}`}</h3></li>
                  ))}
                </ol>
              </section>

              <section id="counselors">
                <h2>{PUBLIC_GUIDE_COPY.SECTION_COUNSELOR}</h2>
                <p>{PUBLIC_GUIDE_COPY.COUNSELOR_INTRO}</p>
              </section>

              <section id="products">
                <h2>상품·가격</h2>
                <p>{GUIDE_COPY.PRODUCTS_LEAD}</p>
                {view.products.length === 0 ? (
                  <p>{productsEmpty}</p>
                ) : (
                  <>
                    <table className="svc-product-table">
                      <caption className="sr-only">
                        {`${view.centerName || '상담 서비스'} 상담 상품과 가격`}
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">상품</th>
                          <th scope="col">구성</th>
                          <th scope="col">이용기간</th>
                          <th scope="col">가격</th>
                        </tr>
                      </thead>
                      <tbody>
                        {view.products.map((row) => (
                          <tr key={row.name}>
                            <td>
                              <strong>{row.name}</strong>
                              {row.description ? <><br />{row.description}</> : null}
                            </td>
                            <td>{formatGuideComposition(row)}</td>
                            <td>{formatGuideValidity(row)}</td>
                            <td>{formatGuidePrice(row.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="svc-product-cards">
                      {view.products.map((row) => (
                        <article className="svc-product-card" key={`card-${row.name}`}>
                          <h3>{row.name}</h3>
                          <dl>
                            <dt>{PUBLIC_GUIDE_COPY.LABEL_PRODUCT_NAME}</dt>
                            <dd>{row.name}</dd>
                            <dt>{PUBLIC_GUIDE_COPY.LABEL_SESSIONS}</dt>
                            <dd>{formatGuideSessions(row)}</dd>
                            <dt>{PUBLIC_GUIDE_COPY.LABEL_PRICE}</dt>
                            <dd>{formatGuidePrice(row.price)}</dd>
                            <dt>{PUBLIC_GUIDE_COPY.LABEL_PERIOD}</dt>
                            <dd>{formatGuideValidity(row)}</dd>
                          </dl>
                        </article>
                      ))}
                    </div>
                  </>
                )}
                <p>{view.paymentNote}</p>
                <p>
                  <Link to={COUNSELING_SERVICE_GUIDE.BUY_HREF}>
                    {COUNSELING_SERVICE_GUIDE.BUY_LINK}
                  </Link>
                </p>
              </section>

              <section id="policy">
                <h2>환불·개인정보</h2>
                <h3>환불 규정 요약</h3>
                <p>{view.refundBody}</p>
                <ul>
                  <li><a href={LEGAL_TERMS_REFUND_HREF}>환불 규정 전문</a></li>
                  <li><Link to={LEGAL_PUBLIC_PATHS.TERMS}>{LEGAL_PUBLIC_LABELS.TERMS}</Link></li>
                  <li><Link to={LEGAL_PUBLIC_PATHS.PRIVACY}>{LEGAL_PUBLIC_LABELS.PRIVACY}</Link></li>
                  <li><Link to={LEGAL_PUBLIC_PATHS.PRODUCTS}>{LEGAL_PUBLIC_LABELS.PRODUCTS}</Link></li>
                </ul>
              </section>
            </>
          )}
        </main>
      </div>
    </CommonPageTemplate>
  );
};

export default CounselingServiceGuidePage;

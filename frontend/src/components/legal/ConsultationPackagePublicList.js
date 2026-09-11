/**
 * 공개 상담 상품·가격 리스트 (홈 · /legal/products 공유 molecule)
 *
 * @author CoreSolution
 * @since 2026-09-10
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  CONSULTATION_PACKAGE_EMPTY_MESSAGE,
  CONSULTATION_PACKAGE_USAGE_PERIOD_NOTE,
  LEGAL_PUBLIC_LABELS
} from '../../constants/legalPublic';
import { normalizeConsultationPackageList } from '../../utils/consultationPackagePublic';
import './ConsultationPackagePublicList.css';

/**
 * @param {object} props
 * @param {unknown} props.packages
 * @param {string} [props.eyebrow]
 * @param {string} [props.title]
 * @param {string} [props.className]
 * @param {string} [props.id]
 */
const ConsultationPackagePublicList = ({
  packages = [],
  eyebrow = LEGAL_PUBLIC_LABELS.PRODUCTS,
  title = '상담 상품·가격',
  className = '',
  id
}) => {
  const items = normalizeConsultationPackageList(packages);

  return (
    <section
      id={id}
      className={`mg-consultation-package-public ${className}`.trim()}
      aria-labelledby={id ? `${id}-title` : undefined}
      data-testid="consultation-package-public-list"
    >
      <header className="mg-consultation-package-public__header">
        {eyebrow ? (
          <p className="mg-consultation-package-public__eyebrow">{eyebrow}</p>
        ) : null}
        <h2
          id={id ? `${id}-title` : undefined}
          className="mg-consultation-package-public__title"
        >
          {title}
        </h2>
        <p
          className="mg-consultation-package-public__note"
          data-testid="consultation-package-usage-period-note"
        >
          {CONSULTATION_PACKAGE_USAGE_PERIOD_NOTE}
        </p>
      </header>

      {items.length === 0 ? (
        <p
          className="mg-consultation-package-public__empty"
          data-testid="consultation-package-public-empty"
        >
          {CONSULTATION_PACKAGE_EMPTY_MESSAGE}
        </p>
      ) : (
        <ul className="mg-consultation-package-public__list">
          {items.map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              className="mg-consultation-package-public__row"
              data-testid="consultation-package-public-row"
            >
              <div className="mg-consultation-package-public__row-main">
                <span className="mg-consultation-package-public__name">{item.name}</span>
                {item.description ? (
                  <span className="mg-consultation-package-public__detail">
                    {item.description}
                  </span>
                ) : null}
              </div>
              <span className="mg-consultation-package-public__price">{item.priceLabel}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

ConsultationPackagePublicList.propTypes = {
  packages: PropTypes.arrayOf(PropTypes.object),
  eyebrow: PropTypes.string,
  title: PropTypes.string,
  className: PropTypes.string,
  id: PropTypes.string
};

export default ConsultationPackagePublicList;

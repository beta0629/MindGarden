import { Fragment } from 'react';
import { SITE } from '@/lib/site';

type BusinessHoursProps = {
  /** stack: one line per entry. inline: nowrap groups, separator stays at line end. */
  layout?: 'inline' | 'stack';
};

/**
 * Opening hours without a line ever starting with the 「·」 separator.
 */
export function BusinessHours({ layout = 'inline' }: BusinessHoursProps) {
  const lines = SITE.hoursLines;

  if (layout === 'stack') {
    return (
      <span className="business-hours business-hours--stack">
        {lines.map((line) => (
          <span key={line} className="business-hours__line">
            {line}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span className="business-hours">
      {lines.map((line, index) => (
        <Fragment key={line}>
          <span className="business-hours__line">
            {line}
            {index < lines.length - 1 ? ' ·' : ''}
          </span>
          {index < lines.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </span>
  );
}

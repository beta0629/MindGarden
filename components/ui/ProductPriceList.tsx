import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { BookingCta } from '@/components/ui/BookingCta';
import {
  resolveProductDisplayPrice,
  type ProductPriceView,
} from '@/lib/clinic-os/client';
import type { ConsultationProduct } from '@/lib/clinic-os/types';
import { formatWon } from '@/lib/format';
import { SITE } from '@/lib/site';

type ProductPriceListProps = {
  products: ConsultationProduct[];
  lead?: string;
};

function PriceCell({ view }: { view: ProductPriceView }) {
  if (view.struckThroughPrice != null) {
    return (
      <span className="price-cell">
        <s className="price-cell__struck">{formatWon(view.struckThroughPrice)}</s>
        <strong>{formatWon(view.amount)}</strong>
      </span>
    );
  }
  return <strong>{formatWon(view.amount)}</strong>;
}

function productLabel(product: ConsultationProduct): string {
  if (product.sessionMinutes == null) {
    return product.name;
  }
  return `${product.name} (${product.sessionMinutes}분)`;
}

export function ProductPriceList({ products, lead }: ProductPriceListProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        kind="generic"
        title="지금은 가격 안내를 불러올 수 없습니다"
        body="대표전화 또는 네이버 플레이스 예약에서 확인해 주세요."
      >
        <p>
          <a href={`tel:${SITE.phoneTel}`}>{SITE.phoneDisplay}</a>
          {' · '}
          <a
            className="text-link"
            href={SITE.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            네이버 플레이스 예약 ↗
          </a>
        </p>
        <BookingCta />
      </EmptyState>
    );
  }

  return (
    <div className="stack-md">
      {lead ? <p>{lead}</p> : null}
      <table className="price-table">
        <thead>
          <tr>
            <th>항목</th>
            <th>금액</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const view = resolveProductDisplayPrice(product);
            return (
              <tr key={product.skuCode}>
                <td>{productLabel(product)}</td>
                <td>
                  <PriceCell view={view} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="muted">
        금액은 바뀔 수 있습니다. 예약 전에 네이버 플레이스를 확인해 주세요.
      </p>
      <p>
        <Link className="text-link" href="/contact">
          문의하기 →
        </Link>
      </p>
    </div>
  );
}

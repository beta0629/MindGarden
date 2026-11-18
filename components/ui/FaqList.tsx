import { ConfirmNeeded } from './ConfirmNeeded';

type FaqItem = {
  q: string;
  a: string;
  confirmNeeded?: boolean;
};

type FaqListProps = {
  items: readonly FaqItem[];
};

export function FaqList({ items }: FaqListProps) {
  return (
    <div className="faq">
      {items.map((item) => (
        <details key={item.q}>
          <summary className="faq__button">
            <span>
              {item.q}
              {item.confirmNeeded ? <ConfirmNeeded /> : null}
            </span>
            <span aria-hidden="true">+</span>
          </summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}

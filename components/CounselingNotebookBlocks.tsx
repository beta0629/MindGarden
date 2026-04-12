import type { CounselingNotebookBlock } from '@/lib/counseling-notebook-types';

export default function CounselingNotebookBlocks({
  blocks,
}: {
  blocks: CounselingNotebookBlock[];
}) {
  return (
    <div className="counseling-notebook">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'intro':
            return (
              <p key={i} className="counseling-notebook-intro">
                {b.text}
              </p>
            );
          case 'subheading':
            return (
              <h3 key={i} className="counseling-notebook-h3">
                {b.text}
              </h3>
            );
          case 'category':
            return (
              <div key={i} className="counseling-notebook-category">
                <div className="counseling-notebook-category-head">
                  <span className="counseling-notebook-badge" aria-hidden>
                    {b.index}
                  </span>
                  <span className="counseling-notebook-category-title">{b.title}</span>
                </div>
                <ul className="counseling-notebook-item-list">
                  {b.items.map((item, j) => (
                    <li key={j}>
                      <span className="counseling-notebook-term">{item.term}</span>
                      <span className="counseling-notebook-desc">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          case 'paragraph':
            return (
              <p key={i} className="counseling-notebook-p">
                {b.text}
              </p>
            );
          case 'pairSection':
            return (
              <div key={i} className="counseling-notebook-pair-wrap">
                <h3 className="counseling-notebook-h3 counseling-notebook-h3--pair">
                  {b.title}
                </h3>
                <div className="counseling-notebook-pair-grid">
                  {b.cards.map((card, ci) => (
                    <div key={ci} className="counseling-notebook-pair-card">
                      <h4 className="counseling-notebook-pair-card-title">{card.title}</h4>
                      {card.rows.map((row, ri) => (
                        <div key={ri} className="counseling-notebook-pair-row">
                          <span className="counseling-notebook-pair-label">{row.label}</span>
                          <p className="counseling-notebook-pair-text">{row.text}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          case 'note':
            return (
              <p key={i} className="counseling-notebook-note" role="note">
                {b.text}
              </p>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

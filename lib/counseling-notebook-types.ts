/** NotebookLM 스타일 구역(도입·소제목·유형 카드·짝질환 카드·각주) */
export type CounselingNotebookBlock =
  | { type: 'intro'; text: string }
  | { type: 'subheading'; text: string }
  | {
      type: 'category';
      index: number;
      title: string;
      items: { term: string; text: string }[];
    }
  | { type: 'paragraph'; text: string }
  | {
      type: 'pairSection';
      title: string;
      cards: { title: string; rows: { label: string; text: string }[] }[];
    }
  | { type: 'note'; text: string };

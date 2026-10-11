/**
 * 상담일지 타임라인 정렬·구간 라벨.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */

import {
  CONSULTATION_LOG_GROUP_MODE
} from '../consultationLogGrouping';
import {
  CONSULTATION_LOG_TIMELINE_SORT,
  buildConsultationLogTimelineView
} from '../consultationLogTimeline';
import { CONSULTATION_LOG_TIMELINE_PAGE_SIZE } from '../consultationLogQuery';

const MISSING = '이름 없음';
const SESSION_COUNT = 30;
const PAGE_SIZE = CONSULTATION_LOG_TIMELINE_PAGE_SIZE;

const row = (fields) => ({
  id: fields.id,
  clientId: fields.clientId,
  consultantId: fields.consultantId,
  clientName: fields.clientName,
  consultantName: fields.consultantName,
  sessionDate: fields.sessionDate,
  sessionNumber: fields.sessionNumber
});

const dateForSession = (sessionNumber) => `2026-03-${String(sessionNumber).padStart(2, '0')}`;

const thirtyRows = () => Array.from({ length: SESSION_COUNT }, (_, index) => {
  const sessionNumber = index + 1;
  const consultantId = sessionNumber >= 25 ? 8 : 7;
  return row({
    id: sessionNumber,
    clientId: 30,
    consultantId,
    clientName: '서지후',
    consultantName: consultantId === 8 ? '최하린' : '박지안',
    sessionDate: dateForSession(sessionNumber),
    sessionNumber
  });
});

const labelsOf = (view) => view.groups[0].items
  .filter((item) => item.label)
  .map((item) => ({
    session: item.row.sessionNumber,
    kind: item.label.kind,
    name: item.label.name,
    fromName: item.label.fromName
  }));

describe('상담일지 타임라인', () => {
  it('내담자 선택 기본은 최근 순이고 구간마다 상담사 이름을 붙인다', () => {
    const view = buildConsultationLogTimelineView({
      mode: CONSULTATION_LOG_GROUP_MODE.CLIENT,
      sort: CONSULTATION_LOG_TIMELINE_SORT.RECENT,
      missingNameLabel: MISSING,
      preserveOrder: false,
      periodSummary: {
        mode: 'CLIENT',
        sessionCount: 9,
        firstSessionDate: '2026-08-13',
        lastSessionDate: '2026-10-08'
      },
      rows: [
        row({
          id: 1, clientId: 1, consultantId: 7, clientName: '한서윤', consultantName: '박지안',
          sessionDate: '2026-08-13', sessionNumber: 1
        }),
        row({
          id: 6, clientId: 1, consultantId: 8, clientName: '한서윤', consultantName: '최하린',
          sessionDate: '2026-09-17', sessionNumber: 6
        }),
        row({
          id: 2, clientId: 1, consultantId: 7, clientName: '한서윤', consultantName: '박지안',
          sessionDate: '2026-08-20', sessionNumber: 2
        })
      ]
    });

    expect(view.sort).toBe(CONSULTATION_LOG_TIMELINE_SORT.RECENT);
    expect(view.showSort).toBe(true);
    expect(view.summary.sessionCount).toBe(9);
    expect(view.groups[0].items.map((item) => item.row.sessionNumber)).toEqual([6, 2, 1]);
    expect(labelsOf(view)).toEqual([
      { session: 6, kind: 'start', name: '최하린', fromName: '' },
      { session: 2, kind: 'start', name: '박지안', fromName: '' }
    ]);
  });

  it('회기 순에서는 첫 구간은 상담사 이름, 이후는 변경 화살표다', () => {
    const view = buildConsultationLogTimelineView({
      mode: CONSULTATION_LOG_GROUP_MODE.CLIENT,
      sort: CONSULTATION_LOG_TIMELINE_SORT.SESSION,
      missingNameLabel: MISSING,
      preserveOrder: false,
      rows: [
        row({
          id: 6, clientId: 1, consultantId: 8, clientName: '한서윤', consultantName: '최하린',
          sessionDate: '2026-09-17', sessionNumber: 6
        }),
        row({
          id: 1, clientId: 1, consultantId: 7, clientName: '한서윤', consultantName: '박지안',
          sessionDate: '2026-08-13', sessionNumber: 1
        })
      ]
    });

    expect(view.groups[0].items.map((item) => item.row.id)).toEqual([1, 6]);
    expect(labelsOf(view)).toEqual([
      { session: 1, kind: 'start', name: '박지안', fromName: '' },
      { session: 6, kind: 'change', name: '최하린', fromName: '박지안' }
    ]);
  });

  it('둘 다 선택하면 정렬은 두고 상담사 라벨은 생략한다', () => {
    const view = buildConsultationLogTimelineView({
      mode: CONSULTATION_LOG_GROUP_MODE.BOTH,
      sort: CONSULTATION_LOG_TIMELINE_SORT.RECENT,
      missingNameLabel: MISSING,
      preserveOrder: false,
      periodSummary: {
        mode: 'BOTH',
        sessionCount: 2,
        firstSessionDate: '2026-08-13',
        lastSessionDate: '2026-09-17'
      },
      rows: [
        row({
          id: 1, clientId: 1, consultantId: 8, clientName: '한서윤', consultantName: '최하린',
          sessionDate: '2026-08-13', sessionNumber: 1
        }),
        row({
          id: 2, clientId: 1, consultantId: 8, clientName: '한서윤', consultantName: '최하린',
          sessionDate: '2026-09-17', sessionNumber: 2
        })
      ]
    });

    expect(view.showSort).toBe(true);
    expect(view.showCounselorLabels).toBe(false);
    expect(view.groups[0].items.every((item) => item.label == null)).toBe(true);
    expect(view.groups[0].items.map((item) => item.row.sessionNumber)).toEqual([2, 1]);
  });

  it('상담사 선택은 최근 상담일 순 묶음이고 묶음 안 회차도 최근 순이다', () => {
    const view = buildConsultationLogTimelineView({
      mode: CONSULTATION_LOG_GROUP_MODE.COUNSELOR,
      missingNameLabel: MISSING,
      preserveOrder: false,
      clientPeriods: [
        { clientId: 1, sessionCount: 9, lastSessionDate: '2026-10-08', firstSessionDate: '2026-08-13' },
        { clientId: 2, sessionCount: 3, lastSessionDate: '2026-10-06', firstSessionDate: '2026-09-22' }
      ],
      rows: [
        row({
          id: 12, clientId: 1, consultantId: 7, clientName: '한서윤', consultantName: '박지안',
          sessionDate: '2026-09-24', sessionNumber: 1
        }),
        row({
          id: 20, clientId: 2, consultantId: 7, clientName: '오세아', consultantName: '박지안',
          sessionDate: '2026-10-06', sessionNumber: 3
        }),
        row({
          id: 11, clientId: 1, consultantId: 7, clientName: '한서윤', consultantName: '박지안',
          sessionDate: '2026-10-08', sessionNumber: 3
        })
      ]
    });

    expect(view.showSort).toBe(false);
    expect(view.sort).toBe(CONSULTATION_LOG_TIMELINE_SORT.RECENT);
    expect(view.groups.map((group) => group.head.name)).toEqual(['한서윤', '오세아']);
    expect(view.groups[0].head.sessionCount).toBe(9);
    expect(view.groups[0].items.map((item) => item.row.sessionNumber)).toEqual([3, 1]);
    expect(view.groups[0].items.every((item) => item.label == null)).toBe(true);
  });

  it('상담사 선택 2쪽은 최근 순 묶음을 이어서 그리고 회기 순 요청은 무시한다', () => {
    const periods = [
      { clientId: 10, sessionCount: 9, lastSessionDate: '2026-10-08', firstSessionDate: '2026-08-13' },
      { clientId: 20, sessionCount: 3, lastSessionDate: '2026-10-06', firstSessionDate: '2026-09-22' }
    ];
    const rows = [
      row({
        id: 199, clientId: 10, consultantId: 7, clientName: '한서윤', consultantName: '박지안',
        sessionDate: '2026-09-10', sessionNumber: 1
      }),
      row({
        id: 101, clientId: 20, consultantId: 7, clientName: '오세아', consultantName: '박지안',
        sessionDate: '2026-10-06', sessionNumber: 2
      }),
      row({
        id: 201, clientId: 10, consultantId: 7, clientName: '한서윤', consultantName: '박지안',
        sessionDate: '2026-10-08', sessionNumber: 3
      }),
      row({
        id: 200, clientId: 10, consultantId: 7, clientName: '한서윤', consultantName: '박지안',
        sessionDate: '2026-10-01', sessionNumber: 2
      }),
      row({
        id: 100, clientId: 20, consultantId: 7, clientName: '오세아', consultantName: '박지안',
        sessionDate: '2026-09-22', sessionNumber: 1
      })
    ];
    const full = buildConsultationLogTimelineView({
      mode: CONSULTATION_LOG_GROUP_MODE.COUNSELOR,
      sort: CONSULTATION_LOG_TIMELINE_SORT.SESSION,
      missingNameLabel: MISSING,
      preserveOrder: false,
      clientPeriods: periods,
      rows
    });
    const ordered = full.groups.flatMap((group) => group.items.map((item) => item.row));
    expect(full.sort).toBe(CONSULTATION_LOG_TIMELINE_SORT.RECENT);
    expect(ordered.map((item) => item.id)).toEqual([201, 200, 199, 101, 100]);

    const pageSize = 2;
    const pageIndex = 1;
    const preceding = ordered[(pageIndex * pageSize) - 1];
    const page = buildConsultationLogTimelineView({
      mode: CONSULTATION_LOG_GROUP_MODE.COUNSELOR,
      sort: CONSULTATION_LOG_TIMELINE_SORT.SESSION,
      missingNameLabel: MISSING,
      preserveOrder: true,
      clientPeriods: periods,
      preceding: {
        consultantId: preceding.consultantId,
        consultantName: preceding.consultantName,
        clientId: preceding.clientId
      },
      rows: ordered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
    });

    expect(page.sort).toBe(CONSULTATION_LOG_TIMELINE_SORT.RECENT);
    expect(page.groups.map((group) => ({
      name: group.head.name,
      continued: group.continued,
      ids: group.items.map((item) => item.row.id)
    }))).toEqual([
      { name: '한서윤', continued: true, ids: [199] },
      { name: '오세아', continued: false, ids: [101] }
    ]);
  });

  it('30회기 최근 순 2쪽은 이어지는 상담사 라벨을 다시 그린다', () => {
    const all = thirtyRows();
    const recent = buildConsultationLogTimelineView({
      mode: CONSULTATION_LOG_GROUP_MODE.CLIENT,
      sort: CONSULTATION_LOG_TIMELINE_SORT.RECENT,
      missingNameLabel: MISSING,
      preserveOrder: false,
      rows: all
    });
    const ordered = recent.groups[0].items.map((item) => item.row);
    expect(ordered).toHaveLength(SESSION_COUNT);
    expect(ordered.map((item) => item.sessionNumber)).toEqual(
      Array.from({ length: SESSION_COUNT }, (_, index) => SESSION_COUNT - index)
    );
    expect(labelsOf(recent)).toEqual([
      { session: 30, kind: 'start', name: '최하린', fromName: '' },
      { session: 24, kind: 'start', name: '박지안', fromName: '' }
    ]);

    expect(Math.ceil(SESSION_COUNT / PAGE_SIZE)).toBe(3);

    const page = ordered.slice(PAGE_SIZE, PAGE_SIZE * 2);
    const continued = buildConsultationLogTimelineView({
      mode: CONSULTATION_LOG_GROUP_MODE.CLIENT,
      sort: CONSULTATION_LOG_TIMELINE_SORT.RECENT,
      missingNameLabel: MISSING,
      preserveOrder: true,
      preceding: {
        consultantId: ordered[PAGE_SIZE - 1].consultantId,
        consultantName: ordered[PAGE_SIZE - 1].consultantName,
        clientId: ordered[PAGE_SIZE - 1].clientId
      },
      rows: page
    });

    const pageStartSession = SESSION_COUNT - PAGE_SIZE;
    expect(continued.groups[0].items.map((item) => item.row.sessionNumber)).toEqual(
      Array.from({ length: PAGE_SIZE }, (_, index) => pageStartSession - index)
    );
    expect(labelsOf(continued)).toEqual([
      { session: pageStartSession, kind: 'continue', name: '박지안', fromName: '' }
    ]);
  });

  it('회기 순 쪽 경계에서 상담사가 바뀌면 변경 라벨을 쓰고 같으면 이름을 다시 그린다', () => {
    const all = thirtyRows().slice().sort((left, right) => left.sessionNumber - right.sessionNumber);
    const changeIndex = all.findIndex((item, index) => (
      index > 0 && item.consultantId !== all[index - 1].consultantId
    ));
    const pageIndex = Math.floor(changeIndex / PAGE_SIZE);
    const pageStart = pageIndex * PAGE_SIZE;
    const boundaryPage = all.slice(pageStart, pageStart + PAGE_SIZE);
    const preceding = all[pageStart - 1];
    const changeRow = all[changeIndex];
    const view = buildConsultationLogTimelineView({
      mode: CONSULTATION_LOG_GROUP_MODE.CLIENT,
      sort: CONSULTATION_LOG_TIMELINE_SORT.SESSION,
      missingNameLabel: MISSING,
      preserveOrder: true,
      preceding: {
        consultantId: preceding.consultantId,
        consultantName: preceding.consultantName,
        clientId: preceding.clientId
      },
      rows: boundaryPage
    });

    expect(labelsOf(view)).toEqual([
      {
        session: boundaryPage[0].sessionNumber,
        kind: 'continue',
        name: preceding.consultantName,
        fromName: ''
      },
      {
        session: changeRow.sessionNumber,
        kind: 'change',
        name: changeRow.consultantName,
        fromName: preceding.consultantName
      }
    ]);
  });
});

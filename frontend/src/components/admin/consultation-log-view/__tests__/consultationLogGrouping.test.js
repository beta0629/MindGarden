/**
 * 상담일지 묶음 규칙.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */

import {
  CONSULTATION_LOG_COLUMN,
  CONSULTATION_LOG_GROUP_MODE,
  buildConsultationLogGroupView
} from '../consultationLogGrouping';

const MISSING = '이름 없음';

const row = (fields) => ({
  id: fields.id,
  clientId: fields.clientId,
  consultantId: fields.consultantId,
  clientName: fields.clientName,
  consultantName: fields.consultantName,
  sessionDate: fields.sessionDate,
  sessionNumber: fields.sessionNumber
});

describe('상담일지 묶음', () => {
  it('내담자 선택은 회기 순이고 상담사가 바뀌면 구분하며 내담자 열을 뺀다', () => {
    const view = buildConsultationLogGroupView({
      mode: CONSULTATION_LOG_GROUP_MODE.CLIENT,
      missingNameLabel: MISSING,
      periodFrom: '2026-08-01',
      periodTo: '2026-10-31',
      periodSummary: {
        mode: 'CLIENT',
        sessionCount: 9,
        firstSessionDate: '2026-08-13',
        lastSessionDate: '2026-10-08'
      },
      rows: [
        row({
          id: 2, clientId: 1, consultantId: 8, clientName: '한서윤', consultantName: '최하린',
          sessionDate: '2026-09-17', sessionNumber: 6
        }),
        row({
          id: 1, clientId: 1, consultantId: 7, clientName: '한서윤', consultantName: '박지안',
          sessionDate: '2026-08-20', sessionNumber: 2
        }),
        row({
          id: 3, clientId: 1, consultantId: 7, clientName: '한서윤', consultantName: '박지안',
          sessionDate: '2026-08-13', sessionNumber: 1
        })
      ]
    });

    expect(view.hiddenColumnKeys).toEqual([CONSULTATION_LOG_COLUMN.CLIENT]);
    expect(view.summary.countsReady).toBe(true);
    expect(view.summary.sessionCount).toBe(9);
    expect(view.summary.sessionCount).not.toBe(view.sections.reduce((sum, section) => sum + section.rows.length, 0));
    expect(view.summary.firstSessionDate).toBe('2026-08-13');
    expect(view.summary.lastSessionDate).toBe('2026-10-08');
    expect(view.sections[0].header).toBeNull();
    expect(view.sections[0].rows.map((entry) => entry.row.sessionNumber)).toEqual([1, 2]);
    expect(view.sections[1].header).toEqual({
      kind: 'counselorChange',
      name: '최하린',
      nameMissing: false
    });
    expect(view.sections[1].rows[0].row.sessionNumber).toBe(6);
  });

  it('상담사 선택은 최근 상담일 순 묶음이고 묶음 안도 최근 순이며 머리 건수는 기간 집계다', () => {
    const view = buildConsultationLogGroupView({
      mode: CONSULTATION_LOG_GROUP_MODE.COUNSELOR,
      missingNameLabel: MISSING,
      clientPeriods: [
        { clientId: 1, sessionCount: 9, lastSessionDate: '2026-10-08', firstSessionDate: '2026-08-13' },
        { clientId: 2, sessionCount: 3, lastSessionDate: '2026-10-08', firstSessionDate: '2026-09-01' },
        { clientId: 3, sessionCount: 1, lastSessionDate: '2026-09-30', firstSessionDate: '2026-09-30' }
      ],
      rows: [
        row({
          id: 10, clientId: 2, consultantId: 7, clientName: '오세아', consultantName: '박지안',
          sessionDate: '2026-10-06', sessionNumber: 3
        }),
        row({
          id: 11, clientId: 1, consultantId: 7, clientName: '한서윤', consultantName: '박지안',
          sessionDate: '2026-10-08', sessionNumber: 3
        }),
        row({
          id: 12, clientId: 1, consultantId: 7, clientName: '한서윤', consultantName: '박지안',
          sessionDate: '2026-09-24', sessionNumber: 1
        }),
        row({
          id: 13, clientId: 3, consultantId: 7, clientName: '문채원', consultantName: '박지안',
          sessionDate: '2026-09-30', sessionNumber: 1
        })
      ]
    });

    expect(view.hiddenColumnKeys).toEqual([
      CONSULTATION_LOG_COLUMN.CLIENT,
      CONSULTATION_LOG_COLUMN.CONSULTANT
    ]);
    expect(view.sections.map((section) => section.header.name)).toEqual(['오세아', '한서윤', '문채원']);
    expect(view.sections[0].header.sessionCount).toBe(3);
    expect(view.sections[0].header.countsReady).toBe(true);
    expect(view.sections[0].rows).toHaveLength(1);
    expect(view.sections[1].rows.map((entry) => entry.row.sessionNumber)).toEqual([3, 1]);
    expect(view.sections[1].header.sessionCount).toBe(9);
    expect(view.summary).toBeNull();
  });

  it('둘 다 선택하면 내담자·상담사 열을 빼고 회기 순 요약만 둔다', () => {
    const view = buildConsultationLogGroupView({
      mode: CONSULTATION_LOG_GROUP_MODE.BOTH,
      missingNameLabel: MISSING,
      periodSummary: {
        mode: 'BOTH',
        sessionCount: 4,
        firstSessionDate: '2026-08-13',
        lastSessionDate: '2026-09-17'
      },
      rows: [
        row({
          id: 2, clientId: 1, consultantId: 8, clientName: '한서윤', consultantName: '최하린',
          sessionDate: '2026-09-17', sessionNumber: 2
        }),
        row({
          id: 1, clientId: 1, consultantId: 8, clientName: '한서윤', consultantName: '최하린',
          sessionDate: '2026-08-13', sessionNumber: 1
        })
      ]
    });

    expect(view.hiddenColumnKeys).toEqual([
      CONSULTATION_LOG_COLUMN.CLIENT,
      CONSULTATION_LOG_COLUMN.CONSULTANT
    ]);
    expect(view.summary.sessionCount).toBe(4);
    expect(view.sections).toHaveLength(1);
    expect(view.sections[0].header).toBeNull();
    expect(view.sections[0].rows.map((entry) => entry.row.id)).toEqual([1, 2]);
  });

  it('선택이 없으면 날짜 내림차순을 유지하고 같은 내담자 이름은 첫 행만 보인다', () => {
    const view = buildConsultationLogGroupView({
      mode: CONSULTATION_LOG_GROUP_MODE.NONE,
      missingNameLabel: MISSING,
      rows: [
        row({
          id: 1, clientId: 1, consultantId: 8, clientName: '한서윤', consultantName: '최하린',
          sessionDate: '2026-10-08', sessionNumber: 8
        }),
        row({
          id: 2, clientId: 1, consultantId: 8, clientName: '한서윤', consultantName: '최하린',
          sessionDate: '2026-10-09', sessionNumber: 9
        }),
        row({
          id: 3, clientId: 2, consultantId: 8, clientName: '정민준', consultantName: '최하린',
          sessionDate: '2026-10-07', sessionNumber: 2
        }),
        row({
          id: 4, clientId: 1, consultantId: 8, clientName: '한서윤', consultantName: '최하린',
          sessionDate: '2026-10-02', sessionNumber: 7
        })
      ]
    });

    const entries = view.sections[0].rows;
    expect(entries.map((entry) => entry.row.id)).toEqual([2, 1, 3, 4]);
    expect(entries[0].repeatClient).toBe(false);
    expect(entries[1].repeatClient).toBe(true);
    expect(entries[1].accessibleClientName).toBe('한서윤');
    expect(entries[2].repeatClient).toBe(false);
    expect(entries[3].repeatClient).toBe(false);
    expect(view.hiddenColumnKeys).toEqual([]);
  });

  it('이름이 없으면 같은 id여도 이름을 생략하지 않는다', () => {
    const view = buildConsultationLogGroupView({
      mode: CONSULTATION_LOG_GROUP_MODE.NONE,
      missingNameLabel: MISSING,
      preserveOrder: true,
      rows: [
        row({
          id: 1, clientId: 9, consultantId: 7, clientName: '', consultantName: '박지안',
          sessionDate: '2026-10-07', sessionNumber: 2
        }),
        row({
          id: 2, clientId: 9, consultantId: 7, clientName: '', consultantName: '',
          sessionDate: '2026-10-06', sessionNumber: 1
        })
      ]
    });

    expect(view.sections[0].rows.every((entry) => entry.repeatClient === false)).toBe(true);
    expect(view.sections[0].rows.every((entry) => entry.clientNameMissing)).toBe(true);
    expect(view.sections[0].rows[0].accessibleClientName).toBe(MISSING);
    expect(view.sections[0].rows[1].consultantNameMissing).toBe(true);
  });

  it('쪽 경계의 첫 구간에도 묶음 머리를 다시 그리고 페이지 행 수를 기간 건수로 쓰지 않는다', () => {
    const view = buildConsultationLogGroupView({
      mode: CONSULTATION_LOG_GROUP_MODE.COUNSELOR,
      missingNameLabel: MISSING,
      preserveOrder: true,
      clientPeriods: [
        { clientId: 1, sessionCount: 9, lastSessionDate: '2026-10-08', firstSessionDate: '2026-08-13' }
      ],
      rows: [
        row({
          id: 8, clientId: 1, consultantId: 7, clientName: '한서윤', consultantName: '박지안',
          sessionDate: '2026-10-01', sessionNumber: 8
        }),
        row({
          id: 9, clientId: 1, consultantId: 7, clientName: '한서윤', consultantName: '박지안',
          sessionDate: '2026-10-08', sessionNumber: 9
        })
      ]
    });

    expect(view.sections).toHaveLength(1);
    expect(view.sections[0].header.kind).toBe('client');
    expect(view.sections[0].header.sessionCount).toBe(9);
    expect(view.sections[0].header.countsReady).toBe(true);
    expect(view.sections[0].rows.map((entry) => entry.row.id)).toEqual([8, 9]);
  });

  it('기간 집계가 없으면 현재 행 수로 기간 내 건수를 만들지 않는다', () => {
    const view = buildConsultationLogGroupView({
      mode: CONSULTATION_LOG_GROUP_MODE.CLIENT,
      missingNameLabel: MISSING,
      rows: [
        row({
          id: 1, clientId: 1, consultantId: 7, clientName: '한서윤', consultantName: '박지안',
          sessionDate: '2026-08-13', sessionNumber: 1
        }),
        row({
          id: 2, clientId: 1, consultantId: 7, clientName: '한서윤', consultantName: '박지안',
          sessionDate: '2026-08-20', sessionNumber: 2
        })
      ]
    });

    expect(view.summary.countsReady).toBe(false);
    expect(view.summary.sessionCount).toBeNull();
  });

  it('서버가 정렬한 페이지는 순서를 유지한다', () => {
    const view = buildConsultationLogGroupView({
      mode: CONSULTATION_LOG_GROUP_MODE.CLIENT,
      missingNameLabel: MISSING,
      preserveOrder: true,
      periodSummary: {
        mode: 'CLIENT',
        sessionCount: 9,
        firstSessionDate: '2026-08-13',
        lastSessionDate: '2026-10-08'
      },
      rows: [
        row({
          id: 6, clientId: 1, consultantId: 8, clientName: '한서윤', consultantName: '최하린',
          sessionDate: '2026-09-17', sessionNumber: 6
        }),
        row({
          id: 7, clientId: 1, consultantId: 8, clientName: '한서윤', consultantName: '최하린',
          sessionDate: '2026-09-24', sessionNumber: 7
        })
      ]
    });

    expect(view.sections[0].header).toBeNull();
    expect(view.sections[0].rows.map((entry) => entry.row.id)).toEqual([6, 7]);
  });
});

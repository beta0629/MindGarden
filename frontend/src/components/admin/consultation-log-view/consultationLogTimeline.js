/**
 * 상담일지 타임라인 모델.
 * 서버가 정렬한 페이지는 순서를 유지하고, 쪽 경계 라벨만 직전 행과 비교한다.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */

import {
  CONSULTATION_LOG_GROUP_MODE,
  buildConsultationLogGroupView,
  consultationLogIsoDate
} from './consultationLogGrouping';

export const CONSULTATION_LOG_TIMELINE_SORT = {
  RECENT: 'recent',
  SESSION: 'session'
};

const MISSING_SESSION_RANK = Number.POSITIVE_INFINITY;

/**
 * @param {string|null|undefined} value
 * @returns {'recent'|'session'}
 */
export const mapTimelineSort = (value) => (
  String(value || '').toLowerCase() === CONSULTATION_LOG_TIMELINE_SORT.SESSION
    ? CONSULTATION_LOG_TIMELINE_SORT.SESSION
    : CONSULTATION_LOG_TIMELINE_SORT.RECENT
);

/**
 * @param {number|string|null|undefined} sessionNumber
 * @returns {number}
 */
const sessionRank = (sessionNumber) => {
  const value = Number(sessionNumber);
  if (!Number.isFinite(value) || value <= 0) {
    return MISSING_SESSION_RANK;
  }
  return value;
};

/**
 * @param {object} left
 * @param {object} right
 * @returns {number}
 */
const compareRecent = (left, right) => {
  const leftDate = consultationLogIsoDate(left.sessionDate);
  const rightDate = consultationLogIsoDate(right.sessionDate);
  if (leftDate !== rightDate) {
    if (!leftDate) {
      return 1;
    }
    if (!rightDate) {
      return -1;
    }
    return leftDate < rightDate ? 1 : -1;
  }
  const leftMissing = sessionRank(left.sessionNumber) === MISSING_SESSION_RANK;
  const rightMissing = sessionRank(right.sessionNumber) === MISSING_SESSION_RANK;
  if (leftMissing !== rightMissing) {
    return leftMissing ? 1 : -1;
  }
  if (!leftMissing && sessionRank(left.sessionNumber) !== sessionRank(right.sessionNumber)) {
    return sessionRank(right.sessionNumber) - sessionRank(left.sessionNumber);
  }
  return (Number(right.id) || 0) - (Number(left.id) || 0);
};

/**
 * @param {object} left
 * @param {object} right
 * @returns {number}
 */
const compareSession = (left, right) => {
  const byRank = sessionRank(left.sessionNumber) - sessionRank(right.sessionNumber);
  if (byRank !== 0) {
    return byRank;
  }
  const byDate = consultationLogIsoDate(left.sessionDate).localeCompare(consultationLogIsoDate(right.sessionDate));
  if (byDate !== 0) {
    return byDate;
  }
  return (Number(left.id) || 0) - (Number(right.id) || 0);
};

/**
 * @param {object|null|undefined} row
 * @returns {string}
 */
const consultantKey = (row) => (
  row && row.consultantId != null && row.consultantId !== '' ? String(row.consultantId) : ''
);

/**
 * @param {object|null|undefined} row
 * @returns {string}
 */
const clientKey = (row) => {
  if (row && row.clientId != null && row.clientId !== '') {
    return String(row.clientId);
  }
  return `row-${row ? row.id : 'none'}`;
};

/**
 * @param {*} value
 * @returns {number|null}
 */
const finiteCount = (value) => {
  if (value == null || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

/**
 * @param {Array<object>} periods
 * @returns {Map<string, object>}
 */
const indexPeriods = (periods) => {
  const byClient = new Map();
  (periods || []).forEach((period) => {
    if (period && period.clientId != null) {
      byClient.set(String(period.clientId), period);
    }
  });
  return byClient;
};

/**
 * @param {Array<object>} rows
 * @param {Array<object>} clientPeriods
 * @param {string} missingNameLabel
 * @returns {Array<object>}
 */
const sortCounselorRows = (rows, clientPeriods, missingNameLabel) => {
  const periodByClient = indexPeriods(clientPeriods);
  const buckets = new Map();
  rows.forEach((row) => {
    const key = clientKey(row);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      buckets.set(key, [row]);
    }
  });
  const metas = Array.from(buckets.entries()).map(([key, members]) => {
    const clientId = members[0].clientId;
    const period = clientId == null ? null : periodByClient.get(String(clientId));
    let lastDate = period ? consultationLogIsoDate(period.lastSessionDate) : '';
    if (!lastDate) {
      members.forEach((member) => {
        const date = consultationLogIsoDate(member.sessionDate);
        if (date > lastDate) {
          lastDate = date;
        }
      });
    }
    const named = members.find((member) => !member.clientNameMissing);
    return {
      key,
      members,
      clientId,
      lastDate,
      name: named ? named.clientName : '',
      missing: !named || named.clientName === missingNameLabel
    };
  });
  metas.sort((left, right) => {
    if (left.lastDate !== right.lastDate) {
      if (!left.lastDate) {
        return 1;
      }
      if (!right.lastDate) {
        return -1;
      }
      return left.lastDate < right.lastDate ? 1 : -1;
    }
    if (left.missing !== right.missing) {
      return left.missing ? 1 : -1;
    }
    if (!left.missing) {
      const byName = left.name.localeCompare(right.name, 'ko');
      if (byName !== 0) {
        return byName;
      }
    }
    const leftId = Number(left.clientId);
    const rightId = Number(right.clientId);
    if (Number.isFinite(leftId) && Number.isFinite(rightId) && leftId !== rightId) {
      return leftId - rightId;
    }
    return 0;
  });
  metas.forEach((meta) => {
    meta.members.sort(compareRecent);
  });
  return metas.flatMap((meta) => meta.members);
};

/**
 * @param {object} row
 * @param {number} index
 * @param {object|null} previous
 * @param {'recent'|'session'} sort
 * @param {object|null} preceding
 * @param {string} missingNameLabel
 * @returns {object}
 */
const labelFor = (row, index, previous, sort, preceding, missingNameLabel) => {
  const name = row.consultantName || missingNameLabel;
  const nameMissing = row.consultantNameMissing === true;
  const precedingKey = consultantKey(preceding);
  const sameAsPreceding = index === 0 && precedingKey !== '' && precedingKey === consultantKey(row);
  if (sameAsPreceding) {
    return {
      kind: 'continue',
      name,
      nameMissing,
      fromName: '',
      fromNameMissing: false
    };
  }
  const changedInsidePage = index > 0 && consultantKey(previous) !== consultantKey(row);
  const changedAtBoundary = index === 0 && precedingKey !== '' && precedingKey !== consultantKey(row);
  if (sort === CONSULTATION_LOG_TIMELINE_SORT.SESSION && (changedInsidePage || changedAtBoundary)) {
    const fromSource = index === 0 ? preceding : previous;
    const fromName = String(fromSource && fromSource.consultantName ? fromSource.consultantName : '').trim();
    return {
      kind: 'change',
      name,
      nameMissing,
      fromName: fromName || missingNameLabel,
      fromNameMissing: !fromName || fromSource.consultantNameMissing === true
    };
  }
  return {
    kind: 'start',
    name,
    nameMissing,
    fromName: '',
    fromNameMissing: false
  };
};

/**
 * @param {Array<object>} rows
 * @param {'recent'|'session'} sort
 * @param {boolean} showCounselorLabels
 * @param {object|null} preceding
 * @param {string} missingNameLabel
 * @returns {object}
 */
const clientGroup = (rows, sort, showCounselorLabels, preceding, missingNameLabel) => ({
  key: 'client',
  head: null,
  continued: false,
  items: rows.map((row, index) => {
    const previous = index === 0 ? null : rows[index - 1];
    const changed = index === 0 || consultantKey(row) !== consultantKey(previous);
    return {
      key: `log-${row.id}`,
      row,
      label: showCounselorLabels && changed
        ? labelFor(row, index, previous, sort, preceding, missingNameLabel)
        : null
    };
  })
});

/**
 * @param {Array<object>} rows
 * @param {Array<object>} clientPeriods
 * @param {object|null} preceding
 * @param {string} missingNameLabel
 * @returns {Array<object>}
 */
const counselorGroups = (rows, clientPeriods, preceding, missingNameLabel) => {
  const periodByClient = indexPeriods(clientPeriods);
  const groups = [];
  rows.forEach((row) => {
    const current = groups[groups.length - 1];
    const open = !current || clientKey(current.items[0].row) !== clientKey(row);
    if (open) {
      const period = row.clientId == null ? null : periodByClient.get(String(row.clientId));
      const sessionCount = period ? finiteCount(period.sessionCount) : null;
      groups.push({
        key: `${clientKey(row)}-${groups.length}`,
        continued: groups.length === 0
          && preceding
          && preceding.clientId != null
          && String(preceding.clientId) === String(row.clientId),
        head: {
          name: row.clientName || missingNameLabel,
          nameMissing: row.clientNameMissing === true,
          sessionCount,
          lastSessionDate: period ? consultationLogIsoDate(period.lastSessionDate) : '',
          countsReady: sessionCount != null
        },
        items: []
      });
    }
    groups[groups.length - 1].items.push({
      key: `log-${row.id}`,
      row,
      label: null
    });
  });
  return groups;
};

/**
 * @param {object} options
 * @param {'none'|'client'|'counselor'|'both'} options.mode
 * @param {'recent'|'session'} [options.sort]
 * @param {Array<object>} options.rows
 * @param {string} options.missingNameLabel
 * @param {boolean} [options.preserveOrder]
 * @param {object|null} [options.periodSummary]
 * @param {Array<object>} [options.clientPeriods]
 * @param {string} [options.periodFrom]
 * @param {string} [options.periodTo]
 * @param {object|null} [options.preceding]
 * @returns {object}
 */
export const buildConsultationLogTimelineView = ({
  mode,
  sort,
  rows,
  missingNameLabel,
  preserveOrder = true,
  periodSummary = null,
  clientPeriods = [],
  periodFrom = '',
  periodTo = '',
  preceding = null
}) => {
  const safeMode = mode || CONSULTATION_LOG_GROUP_MODE.NONE;
  const requestedSort = mapTimelineSort(sort);
  const appliedSort = safeMode === CONSULTATION_LOG_GROUP_MODE.COUNSELOR
    ? CONSULTATION_LOG_TIMELINE_SORT.RECENT
    : requestedSort;
  const base = buildConsultationLogGroupView({
    mode: safeMode,
    rows,
    missingNameLabel,
    preserveOrder: true,
    periodSummary,
    clientPeriods,
    periodFrom,
    periodTo
  });
  let ordered = base.sections.flatMap((section) => section.rows.map((entry) => entry.row));
  if (!preserveOrder) {
    if (safeMode === CONSULTATION_LOG_GROUP_MODE.COUNSELOR) {
      ordered = sortCounselorRows(ordered, clientPeriods, missingNameLabel || '');
    } else if (safeMode !== CONSULTATION_LOG_GROUP_MODE.NONE) {
      ordered = ordered.slice().sort(
        appliedSort === CONSULTATION_LOG_TIMELINE_SORT.SESSION ? compareSession : compareRecent
      );
    }
  }
  const showCounselorLabels = safeMode === CONSULTATION_LOG_GROUP_MODE.CLIENT;
  const groups = safeMode === CONSULTATION_LOG_GROUP_MODE.COUNSELOR
    ? counselorGroups(ordered, clientPeriods, preceding, missingNameLabel || '')
    : [clientGroup(ordered, appliedSort, showCounselorLabels, preceding, missingNameLabel || '')];
  return {
    mode: safeMode,
    sort: appliedSort,
    showSort: safeMode === CONSULTATION_LOG_GROUP_MODE.CLIENT
      || safeMode === CONSULTATION_LOG_GROUP_MODE.BOTH,
    showCounselorLabels,
    summary: base.summary,
    groups
  };
};

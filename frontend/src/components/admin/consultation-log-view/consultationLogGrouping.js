/**
 * 상담일지 조회 묶음.
 * 표·카드가 같이 쓰는 순수 함수. 기간 건수는 서버 집계만 쓰고 현재 행 수로 채우지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */

export const CONSULTATION_LOG_GROUP_MODE = {
  NONE: 'none',
  CLIENT: 'client',
  COUNSELOR: 'counselor',
  BOTH: 'both'
};

export const CONSULTATION_LOG_COLUMN = {
  DATE: 'date',
  CLIENT: 'clientName',
  CONSULTANT: 'consultantName',
  STATUS: 'status',
  SUMMARY: 'summary'
};

const MISSING_SESSION_RANK = Number.POSITIVE_INFINITY;

/**
 * @param {number|string|null|undefined} clientId
 * @param {number|string|null|undefined} consultantId
 * @returns {'none'|'client'|'counselor'|'both'}
 */
export const consultationLogGroupModeFromFilters = (clientId, consultantId) => {
  const hasClient = clientId != null && clientId !== '';
  const hasConsultant = consultantId != null && consultantId !== '';
  if (hasClient && hasConsultant) {
    return CONSULTATION_LOG_GROUP_MODE.BOTH;
  }
  if (hasClient) {
    return CONSULTATION_LOG_GROUP_MODE.CLIENT;
  }
  if (hasConsultant) {
    return CONSULTATION_LOG_GROUP_MODE.COUNSELOR;
  }
  return CONSULTATION_LOG_GROUP_MODE.NONE;
};

/**
 * @param {string|null|undefined} mode
 * @returns {'none'|'client'|'counselor'|'both'}
 */
export const mapServerGroupMode = (mode) => {
  switch (String(mode || '').toUpperCase()) {
    case 'CLIENT':
      return CONSULTATION_LOG_GROUP_MODE.CLIENT;
    case 'COUNSELOR':
      return CONSULTATION_LOG_GROUP_MODE.COUNSELOR;
    case 'BOTH':
      return CONSULTATION_LOG_GROUP_MODE.BOTH;
    default:
      return CONSULTATION_LOG_GROUP_MODE.NONE;
  }
};

/**
 * @param {*} value
 * @returns {string}
 */
export const consultationLogIsoDate = (value) => {
  if (Array.isArray(value) && value.length >= 3) {
    return `${value[0]}-${String(value[1]).padStart(2, '0')}-${String(value[2]).padStart(2, '0')}`;
  }
  if (value == null || value === '') {
    return '';
  }
  return String(value).split('T')[0];
};

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
 * @param {object} left
 * @param {object} right
 * @returns {number}
 */
const compareDateDesc = (left, right) => {
  const byDate = consultationLogIsoDate(right.sessionDate).localeCompare(consultationLogIsoDate(left.sessionDate));
  if (byDate !== 0) {
    return byDate;
  }
  return (Number(right.id) || 0) - (Number(left.id) || 0);
};

/**
 * @param {string} name
 * @param {string} missingNameLabel
 * @returns {boolean}
 */
const isMissingName = (name, missingNameLabel) => {
  const trimmed = String(name || '').trim();
  return trimmed === '' || trimmed === missingNameLabel;
};

/**
 * @param {object} row
 * @param {string} missingNameLabel
 * @returns {object}
 */
const normalizeRow = (row, missingNameLabel) => {
  const clientNameMissing = row.clientNameMissing === true
    || isMissingName(row.clientName, missingNameLabel);
  const consultantNameMissing = row.consultantNameMissing === true
    || isMissingName(row.consultantName, missingNameLabel);
  return {
    ...row,
    clientName: clientNameMissing ? missingNameLabel : String(row.clientName || '').trim(),
    consultantName: consultantNameMissing ? missingNameLabel : String(row.consultantName || '').trim(),
    clientNameMissing,
    consultantNameMissing,
    sessionDate: consultationLogIsoDate(row.sessionDate)
  };
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
 * @param {object} left
 * @param {object} right
 * @returns {number}
 */
const compareCounselorGroups = (left, right) => {
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
};

/**
 * @param {Array<object>} rows
 * @param {Map<string, object>} periodByClient
 * @returns {Array<object>}
 */
const sortCounselorGroups = (rows, periodByClient) => {
  const buckets = new Map();
  rows.forEach((row) => {
    const key = row.clientId == null ? `row-${row.id}` : `id-${row.clientId}`;
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
        if (member.sessionDate > lastDate) {
          lastDate = member.sessionDate;
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
      missing: !named
    };
  });
  metas.sort(compareCounselorGroups);
  metas.forEach((meta) => {
    meta.members.sort(compareSession);
  });
  return metas.flatMap((meta) => meta.members);
};

/**
 * @param {'none'|'client'|'counselor'|'both'} mode
 * @returns {string[]}
 */
const hiddenColumnKeysFor = (mode) => {
  if (mode === CONSULTATION_LOG_GROUP_MODE.CLIENT) {
    return [CONSULTATION_LOG_COLUMN.CLIENT];
  }
  if (mode === CONSULTATION_LOG_GROUP_MODE.COUNSELOR || mode === CONSULTATION_LOG_GROUP_MODE.BOTH) {
    return [CONSULTATION_LOG_COLUMN.CLIENT, CONSULTATION_LOG_COLUMN.CONSULTANT];
  }
  return [];
};

/**
 * @param {object} row
 * @param {object|null} previous
 * @returns {boolean}
 */
const sameClient = (row, previous) => Boolean(
  previous
  && previous.clientId != null
  && row.clientId != null
  && String(previous.clientId) === String(row.clientId)
);

/**
 * @param {object} row
 * @param {object|null} previous
 * @returns {boolean}
 */
const sameConsultant = (row, previous) => {
  if (!previous) {
    return true;
  }
  if (previous.consultantId == null && row.consultantId == null) {
    return true;
  }
  return previous.consultantId != null
    && row.consultantId != null
    && String(previous.consultantId) === String(row.consultantId);
};

/**
 * @param {object} options
 * @param {'none'|'client'|'counselor'|'both'} options.mode
 * @param {Array<object>} options.rows
 * @param {string} options.missingNameLabel
 * @param {boolean} [options.preserveOrder] 서버가 이미 정렬한 페이지. 다시 정렬하지 않는다
 * @param {object|null} [options.periodSummary] 내담자 선택 기간 집계
 * @param {Array<object>} [options.clientPeriods] 상담사 선택 내담자별 기간 집계
 * @param {string} [options.periodFrom]
 * @param {string} [options.periodTo]
 * @returns {object}
 */
export const buildConsultationLogGroupView = ({
  mode,
  rows,
  missingNameLabel,
  preserveOrder = false,
  periodSummary = null,
  clientPeriods = [],
  periodFrom = '',
  periodTo = ''
}) => {
  const safeMode = mode || CONSULTATION_LOG_GROUP_MODE.NONE;
  const label = missingNameLabel || '';
  const normalized = (rows || []).map((row) => normalizeRow(row || {}, label));
  const periodByClient = indexPeriods(clientPeriods);
  let ordered = normalized;
  if (!preserveOrder) {
    if (safeMode === CONSULTATION_LOG_GROUP_MODE.NONE) {
      ordered = normalized.slice().sort(compareDateDesc);
    } else if (safeMode === CONSULTATION_LOG_GROUP_MODE.COUNSELOR) {
      ordered = sortCounselorGroups(normalized, periodByClient);
    } else {
      ordered = normalized.slice().sort(compareSession);
    }
  }

  const sections = [];
  ordered.forEach((row) => {
    const previousSection = sections[sections.length - 1];
    const previous = previousSection
      ? previousSection.rows[previousSection.rows.length - 1].row
      : null;
    let openNewSection = !previousSection;
    if (previousSection && safeMode === CONSULTATION_LOG_GROUP_MODE.COUNSELOR) {
      openNewSection = !sameClient(row, previous);
    }
    if (previousSection && (safeMode === CONSULTATION_LOG_GROUP_MODE.CLIENT
      || safeMode === CONSULTATION_LOG_GROUP_MODE.BOTH)) {
      openNewSection = !sameConsultant(row, previous);
    }
    if (openNewSection) {
      sections.push({
        key: sectionKey(safeMode, row, sections.length),
        header: sectionHeader(safeMode, row, sections.length, periodByClient, label),
        rows: []
      });
    }
    const section = sections[sections.length - 1];
    const repeatClient = safeMode === CONSULTATION_LOG_GROUP_MODE.NONE
      && sameClient(row, previous)
      && !row.clientNameMissing;
    section.rows.push({
      row,
      repeatClient,
      accessibleClientName: row.clientName,
      clientNameMissing: row.clientNameMissing,
      consultantNameMissing: row.consultantNameMissing
    });
  });

  const summary = clientSummary(safeMode, ordered, periodSummary, periodFrom, periodTo, label);

  return {
    mode: safeMode,
    hiddenColumnKeys: hiddenColumnKeysFor(safeMode),
    captionKind: captionKind(safeMode),
    summary,
    sections
  };
};

/**
 * @param {string} mode
 * @param {object} row
 * @param {number} index
 * @returns {string}
 */
const sectionKey = (mode, row, index) => {
  if (mode === CONSULTATION_LOG_GROUP_MODE.COUNSELOR) {
    return row.clientId == null ? `row-${row.id}` : `client-${row.clientId}-${index}`;
  }
  if (mode === CONSULTATION_LOG_GROUP_MODE.CLIENT || mode === CONSULTATION_LOG_GROUP_MODE.BOTH) {
    return `counselor-${row.consultantId ?? 'none'}-${index}`;
  }
  return 'all';
};

/**
 * @param {string} mode
 * @param {object} row
 * @param {number} index
 * @param {Map<string, object>} periodByClient
 * @param {string} missingNameLabel
 * @returns {object|null}
 */
const sectionHeader = (mode, row, index, periodByClient, missingNameLabel) => {
  if (mode === CONSULTATION_LOG_GROUP_MODE.CLIENT || mode === CONSULTATION_LOG_GROUP_MODE.BOTH) {
    if (index === 0) {
      return null;
    }
    return {
      kind: 'counselorChange',
      name: row.consultantName || missingNameLabel,
      nameMissing: row.consultantNameMissing
    };
  }
  if (mode !== CONSULTATION_LOG_GROUP_MODE.COUNSELOR) {
    return null;
  }
  const period = row.clientId == null ? null : periodByClient.get(String(row.clientId));
  const sessionCount = period ? finiteCount(period.sessionCount) : null;
  return {
    kind: 'client',
    name: row.clientName || missingNameLabel,
    nameMissing: row.clientNameMissing,
    sessionCount,
    lastSessionDate: period ? consultationLogIsoDate(period.lastSessionDate) : '',
    countsReady: sessionCount != null
  };
};

/**
 * @param {string} mode
 * @returns {string}
 */
const captionKind = (mode) => {
  if (mode === CONSULTATION_LOG_GROUP_MODE.CLIENT || mode === CONSULTATION_LOG_GROUP_MODE.BOTH) {
    return 'client';
  }
  if (mode === CONSULTATION_LOG_GROUP_MODE.COUNSELOR) {
    return 'counselor';
  }
  return 'repeat';
};

/**
 * @param {string} mode
 * @param {Array<object>} ordered
 * @param {object|null} periodSummary
 * @param {string} periodFrom
 * @param {string} periodTo
 * @param {string} missingNameLabel
 * @returns {object|null}
 */
const clientSummary = (mode, ordered, periodSummary, periodFrom, periodTo, missingNameLabel) => {
  if (mode !== CONSULTATION_LOG_GROUP_MODE.CLIENT && mode !== CONSULTATION_LOG_GROUP_MODE.BOTH) {
    return null;
  }
  const serverMode = mapServerGroupMode(periodSummary && periodSummary.mode);
  const sessionCount = finiteCount(periodSummary && periodSummary.sessionCount);
  const countsReady = Boolean(periodSummary)
    && (serverMode === CONSULTATION_LOG_GROUP_MODE.CLIENT || serverMode === CONSULTATION_LOG_GROUP_MODE.BOTH)
    && sessionCount != null;
  const named = ordered.find((row) => !row.clientNameMissing);
  return {
    countsReady,
    clientName: named ? named.clientName : missingNameLabel,
    clientNameMissing: !named,
    periodFrom: consultationLogIsoDate(periodFrom),
    periodTo: consultationLogIsoDate(periodTo),
    sessionCount: countsReady ? sessionCount : null,
    firstSessionDate: countsReady ? consultationLogIsoDate(periodSummary.firstSessionDate) : '',
    lastSessionDate: countsReady ? consultationLogIsoDate(periodSummary.lastSessionDate) : ''
  };
};

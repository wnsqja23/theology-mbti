import { getAnswerState } from './assessment.mjs';

export const STORAGE_KEY = 'theology-mbti-2.responses.v2';
export const SCHEMA_VERSION = 2;
export const DATA_VERSION = '2.0.0-seed.1';
export const ALGORITHM_VERSION = '2.0.0-exploratory.1';
export const LEGACY_KEY_PREFIX = 'theology-mbti-blind-inline-';
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const clone = value => JSON.parse(JSON.stringify(value));
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));

/** Create a detached document. Existing legacy payload and metadata remain intact. */
export function createSnapshot(state = {}, now = new Date().toISOString()) {
  return {
    ...clone(state), schemaVersion: SCHEMA_VERSION, dataVersion: DATA_VERSION,
    algorithmVersion: ALGORITHM_VERSION,
    answers: clone(state.answers || {}), conditionalAnswers: clone(state.conditionalAnswers || {}),
    confidences: clone(state.confidences || {}), currentItemId: state.currentItemId ?? null,
    createdAt: state.createdAt || now, updatedAt: now,
  };
}

export function exportSnapshot(snapshot) {
  return JSON.stringify(snapshot, null, 2);
}

function hasUnsafeKeys(value) {
  if (value === null || typeof value !== 'object') return false;
  return Object.keys(value).some(key => ['__proto__', 'constructor', 'prototype'].includes(key) || hasUnsafeKeys(value[key]));
}

function validateCurrent(value, catalog) {
  if (!record(value.answers) || !record(value.conditionalAnswers) || !record(value.confidences)) {
    return '응답·추가 응답·자기확신 데이터는 객체여야 합니다.';
  }
  const itemIds = new Set(catalog.items.map(item => item.id));
  const conditional = new Map(catalog.conditionalItems.map(item => [item.id, item]));
  for (const [id, answer] of Object.entries(value.answers)) {
    if (!itemIds.has(id)) return `현재 문항에 없는 ID입니다: ${id}`;
    if (getAnswerState(answer) === 'invalid') return `잘못된 응답 값입니다: ${id}`;
  }
  for (const [id, confidence] of Object.entries(value.confidences)) {
    if (!itemIds.has(id) || !['low', 'medium', 'high'].includes(confidence)) return `자기확신 값이 올바르지 않습니다: ${id}`;
  }
  for (const [id, answer] of Object.entries(value.conditionalAnswers)) {
    const question = conditional.get(id);
    if (!question) return `현재 추가 문항에 없는 ID입니다: ${id}`;
    if (answer === 'unknown' || answer === 'n/a') continue;
    if (!Array.isArray(answer) || answer.some(choice => typeof choice !== 'string') || new Set(answer).size !== answer.length) {
      return `추가 문항의 선택 값이 올바르지 않습니다: ${id}`;
    }
    if (question.selection_mode === 'single' && answer.length > 1) return `한 개만 선택할 수 있는 문항입니다: ${id}`;
    const choices = new Set(question.choices.map(choice => choice.id));
    if (answer.some(choice => !choices.has(choice))) return `존재하지 않는 선택지입니다: ${id}`;
  }
  if (value.currentItemId !== null && !itemIds.has(value.currentItemId) && !conditional.has(value.currentItemId)) {
    return '현재 문항 위치가 유효하지 않습니다.';
  }
  if (!validDate(value.createdAt) || !validDate(value.updatedAt)) return '저장 시각이 유효하지 않습니다.';
  if (value.migration !== undefined && !record(value.migration)) return '마이그레이션 기록이 올바르지 않습니다.';
  return null;
}

function legacyEntries(value) {
  const candidates = Array.isArray(value) ? value : value.answers ?? value.responses ?? value.response ?? value;
  if (Array.isArray(candidates)) {
    if (!candidates.every(entry => record(entry) && typeof entry.id === 'string')) return null;
    return candidates.map(entry => [entry.id, entry]);
  }
  if (!record(candidates)) return null;
  const entries = Object.entries(candidates);
  // An arbitrary JSON object is not accepted as an old response file.
  const recognizedIds = entries.length > 0 && entries.every(([id]) => /^(?:[a-z][a-z0-9]*_\d+|[A-Z]\d{2}(?:-\d{2})?)$/.test(id));
  if (!recognizedIds) return null;
  return entries;
}

/** Validate completely before the caller replaces local state; this function performs no I/O. */
export function parseImport(text, catalog, now = new Date().toISOString()) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_IMPORT_BYTES) {
    return { ok: false, error: '파일이 비어 있거나 허용 크기(2 MB)를 초과했습니다.' };
  }
  let value;
  try { value = JSON.parse(text); }
  catch { return { ok: false, error: 'JSON 파일을 읽을 수 없습니다. 기존 응답은 유지됩니다.' }; }
  if ((!record(value) && !Array.isArray(value)) || hasUnsafeKeys(value)) {
    return { ok: false, error: '안전한 응답 파일 형식이 아닙니다.' };
  }
  if (!catalog || !Array.isArray(catalog.items) || !Array.isArray(catalog.conditionalItems)) {
    return { ok: false, error: '문항 목록이 준비되지 않았습니다.' };
  }
  const exactVersion = value.schemaVersion === SCHEMA_VERSION && value.dataVersion === DATA_VERSION && value.algorithmVersion === ALGORITHM_VERSION;
  if (exactVersion) {
    const error = validateCurrent(value, catalog);
    if (error) return { ok: false, error };
    return { ok: true, snapshot: clone(value), migration: null };
  }
  // A damaged current document must not masquerade as an older schema.
  if (value.schemaVersion === SCHEMA_VERSION &&
      (typeof value.dataVersion !== 'string' || typeof value.algorithmVersion !== 'string')) {
    return { ok: false, error: '데이터 또는 알고리즘 버전 정보가 누락되었습니다.' };
  }
  if (value.schemaVersion !== undefined && (!Number.isInteger(value.schemaVersion) || value.schemaVersion < 1)) {
    return { ok: false, error: '저장 형식 버전이 올바르지 않습니다.' };
  }
  const entries = legacyEntries(value);
  if (entries === null) return { ok: false, error: '지원되는 응답 파일을 확인할 수 없습니다.' };
  const migration = {
    fromSchemaVersion: value.schemaVersion ?? 'legacy',
    fromDataVersion: value.dataVersion ?? 'unknown',
    toDataVersion: DATA_VERSION,
    importedAt: now,
    policy: 'preserve_original_require_reanswer',
    rows: entries.map(([id, previousAnswer]) => ({ oldId: id, previousAnswer, newItemId: null, action: 'requires_reanswer' })),
  };
  const snapshot = createSnapshot({ legacy_response: value, migration }, now);
  return { ok: true, snapshot, migration, legacyPreview: migration.rows };
}

/** Explicitly masked summary suitable for sharing: no item responses or legacy payload. */
export function createMaskedSummary(snapshot) {
  const states = { answered: 0, unknown: 0, skipped: 0, not_applicable: 0 };
  for (const answer of Object.values(snapshot.answers || {})) {
    const state = getAnswerState(answer);
    if (state in states) states[state]++;
  }
  return {
    product: '신학 mbti', dataVersion: snapshot.dataVersion,
    algorithmVersion: snapshot.algorithmVersion, masked: true,
    summary: states,
    note: '개별 신앙 응답과 신조·전통 비교 결과는 포함하지 않았습니다.',
  };
}

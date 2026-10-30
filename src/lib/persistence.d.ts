import type { LikertResponse } from './assessment.mjs';
export declare const STORAGE_KEY: string;
export declare const SCHEMA_VERSION: 2;
export declare const DATA_VERSION: string;
export declare const ALGORITHM_VERSION: string;
export declare const LEGACY_KEY_PREFIX: string;
export declare const MAX_IMPORT_BYTES: number;
export type ConditionalAnswer = string[] | 'unknown' | 'n/a';
export interface MigrationRow { oldId: string; previousAnswer: unknown; newItemId: null; action: 'requires_reanswer'; }
export interface Migration { fromSchemaVersion: number | string; fromDataVersion: string; toDataVersion: string; importedAt: string; policy: string; rows: MigrationRow[]; }
export interface ResponseSnapshot {
  schemaVersion: number; dataVersion: string; algorithmVersion: string;
  answers: Record<string, LikertResponse>; conditionalAnswers: Record<string, ConditionalAnswer>;
  confidences: Record<string, 'low' | 'medium' | 'high'>; currentItemId: string | null;
  createdAt: string; updatedAt: string; legacy_response?: unknown; migration?: Migration;
}
export interface ImportCatalog { items: { id: string }[]; conditionalItems: { id: string; selection_mode: string; choices: { id: string }[] }[]; }
export declare function createSnapshot(state?: Partial<ResponseSnapshot>, now?: string): ResponseSnapshot;
export declare function exportSnapshot(snapshot: ResponseSnapshot): string;
export declare function parseImport(text: string, catalog: ImportCatalog, now?: string):
  {ok: true; snapshot: ResponseSnapshot; migration: Migration | null; legacyPreview?: MigrationRow[]} | {ok: false; error: string};
export declare function createMaskedSummary(snapshot: ResponseSnapshot): Record<string, unknown>;

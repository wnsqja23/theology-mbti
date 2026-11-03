export type LikertResponse = 1 | 2 | 3 | 4 | 5 | 'unknown' | 'skipped' | 'n/a' | null | undefined;
export type ResponseState = 'skipped' | 'unknown' | 'not_applicable' | 'answered' | 'invalid';
export interface ProfileItem {
  id: string; claim_id: string; section: string; source_ids: string[];
  domain?: string; topic_id?: string; reverse?: boolean; statement?: string;
  evidence_group?: string; review_status?: string;
}
export interface Observation { claimId: string; status: ResponseState; support: number | null; }
export interface ClaimSummary {
  claimId: string; status: 'single_item' | 'insufficient_data' | 'observed_support' | 'observed_opposition' | 'neutral' | 'mixed_evidence' | 'unanswered';
  support: number | null; evidenceCount: number; answeredCoverage: number; totalItems: number;
  counts: Record<ResponseState | 'neutral', number>;
  observations: (Observation & { itemId: string; confidence: 'low' | 'medium' | 'high' | null })[];
  domain?: string; topicId?: string; sourceIds: string[]; requiresExpertReview: boolean;
}
export interface ClaimStance { claim_id: string; stance: number; source_id: string; paragraph: string; weight?: number; url?: string; }
export interface Tradition { id: string; status: string; can_auto_rank: boolean; claim_stances?: ClaimStance[]; }
export interface VerifiedClause { claim_id: string; source_id: string; paragraph: string; status: 'approved_clause_level'; }
export interface ComparisonOptions {
  items?: ProfileItem[]; answers?: Record<string, LikertResponse>;
  approvedSourceIds?: string[] | Set<string>; verifiedClauses?: VerifiedClause[];
  traditions?: Tradition[]; claimSummaries?: ClaimSummary[];
}
export interface TraditionResult {
  traditionId: string; status: string; similarity: number | null; coverage: number; used: number;
  matchingClaimIds?: string[]; contrastingClaimIds?: string[]; neutralClaimIds?: string[]; unresolvedClaimIds?: string[];
}
export interface TraditionComparison {
  status: 'withheld' | 'mixed_profile' | 'exploratory'; reasons: string[];
  commonClaimIds: string[]; observedClaimIds: string[]; coverage: number; domainCount: number;
  creedalCoverage: number; results: TraditionResult[]; topMatches: TraditionResult[];
}
export interface ClaimLink {
  creedal_item_id: string; review_status?: string;
  related_items: { item_id: string; direction: number; relation: string }[];
}
export interface CreedObservation {
  status: string; support: number | null;
  evidence: { itemId: string; alignment: number; relation: string }[];
  requiresHumanReview?: boolean; requiresSemanticReview?: boolean; sourceIds?: string[];
}
export declare function getAnswerState(answer: unknown): ResponseState;
export declare function claimObservation(item: ProfileItem, answer: LikertResponse): Observation;
export declare function aggregateClaims(items: ProfileItem[], answers: Record<string, LikertResponse>, confidences?: Record<string, string>): ClaimSummary[];
export declare function compareTradition(tradition: Tradition, claimScores: Record<string, number | null>, options?: ComparisonOptions): TraditionResult;
export declare function compareTraditions(traditions: Tradition[], claimSummaries: ClaimSummary[], options?: ComparisonOptions): TraditionComparison;
export declare function creedalReview(item: ProfileItem, answer: LikertResponse): { status: string; observedSupport?: number; sourceIds?: string[] };
export declare function corroboratedCreedalObservation(creedItem: ProfileItem, answers: Record<string, LikertResponse>, relations: ClaimLink[], itemIndex: Record<string, ProfileItem>): CreedObservation;
export declare function compareTheologians(theologians: Tradition[], claimSummaries: ClaimSummary[], options?: ComparisonOptions): { theologianId: string; status: string; scope: string; evidence: (ClaimStance & { observedSupport: number | null })[]; similarity: null }[];

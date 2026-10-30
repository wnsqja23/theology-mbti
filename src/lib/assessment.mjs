/** Exploratory observations of statements, never a person's religious or spiritual status. */
export function getAnswerState(answer) {
  if (answer === undefined || answer === null || answer === 'skipped') return 'skipped';
  if (answer === 'unknown') return 'unknown';
  if (answer === 'n/a') return 'not_applicable';
  if (Number.isInteger(answer) && answer >= 1 && answer <= 5) return 'answered';
  return 'invalid';
}

export function claimObservation(item, answer) {
  const status = getAnswerState(answer);
  return {
    claimId: item.claim_id,
    status,
    support: status === 'answered' ? (item.reverse === true ? -1 : 1) * (answer - 3) / 2 : null,
  };
}

const normalize = text => typeof text === 'string' ? text.replace(/\s+/g, '').trim() : '';
const evidenceKey = item => item.evidence_group || normalize(item.statement) || item.id;

/** Claims remain separate: compatible doctrinal models are never forced to compete. */
export function aggregateClaims(items, answers, confidences = {}) {
  const grouped = new Map();
  for (const item of items) {
    if (!item.claim_id) continue;
    if (!grouped.has(item.claim_id)) grouped.set(item.claim_id, []);
    grouped.get(item.claim_id).push(item);
  }
  return Array.from(grouped, ([claimId, claimItems]) => {
    const observations = claimItems.map(item => ({
      itemId: item.id,
      ...claimObservation(item, answers[item.id]),
      confidence: ['low', 'medium', 'high'].includes(confidences[item.id]) ? confidences[item.id] : null,
    }));
    const counts = { answered: 0, neutral: 0, unknown: 0, skipped: 0, not_applicable: 0, invalid: 0 };
    for (const observation of observations) {
      counts[observation.status]++;
      if (observation.status === 'answered' && observation.support === 0) counts.neutral++;
    }
    const independent = new Map();
    claimItems.forEach((item, index) => {
      if (observations[index].status === 'answered' && !independent.has(evidenceKey(item))) {
        independent.set(evidenceKey(item), observations[index]);
      }
    });
    const evidence = [...independent.values()];
    const support = evidence.length ? evidence.reduce((sum, value) => sum + value.support, 0) / evidence.length : null;
    const answeredCoverage = counts.answered / claimItems.length;
    const conflicting = evidence.some(value => value.support >= .5) && evidence.some(value => value.support <= -.5);
    let status = 'unanswered';
    if (evidence.length === 1) status = 'single_item';
    else if (evidence.length > 1 && answeredCoverage < .6) status = 'insufficient_data';
    else if (conflicting) status = 'mixed_evidence';
    else if (evidence.length >= 2) status = support >= .5 ? 'observed_support' : support <= -.5 ? 'observed_opposition' : 'neutral';
    return {
      claimId, status, support, evidenceCount: evidence.length, answeredCoverage,
      totalItems: claimItems.length, counts, observations,
      domain: claimItems[0].domain, topicId: claimItems[0].topic_id,
      sourceIds: [...new Set(claimItems.flatMap(item => item.source_ids || []))],
      requiresExpertReview: claimItems.some(item => item.review_status !== 'approved'),
    };
  });
}

function checkedStances(tradition, options) {
  const sources = new Set(options.approvedSourceIds || []);
  const clauses = options.verifiedClauses || [];
  return (tradition.claim_stances || []).filter(stance =>
    sources.has(stance.source_id) &&
    typeof stance.paragraph === 'string' && stance.paragraph.trim() &&
    !stance.paragraph.includes('REQUIRES_') &&
    Number.isFinite(stance.stance) && Math.abs(stance.stance) <= 1 &&
    Number.isFinite(stance.weight ?? 1) && (stance.weight ?? 1) >= 1 && (stance.weight ?? 1) <= 3 &&
    clauses.some(clause => clause.claim_id === stance.claim_id && clause.source_id === stance.source_id &&
      clause.paragraph === stance.paragraph && clause.status === 'approved_clause_level'),
  );
}

/** All profiles use exactly the same checked claims and observed claims. */
export function compareTraditions(traditions, claimSummaries, options = {}) {
  const summaries = new Map(claimSummaries.map(summary => [summary.claimId, summary]));
  const results = traditions.map(tradition => ({
    traditionId: tradition.id, status: 'not_verified', similarity: null, coverage: 0, used: 0,
    matchingClaimIds: [], contrastingClaimIds: [], neutralClaimIds: [], unresolvedClaimIds: [],
  }));
  const participants = traditions.flatMap((tradition, index) => {
    if (!tradition.can_auto_rank || tradition.status !== 'approved_clause_level') return [];
    const stances = checkedStances(tradition, options);
    if (!stances.length || new Set(stances.map(stance => stance.claim_id)).size !== stances.length) return [];
    results[index].status = 'insufficient_data';
    return [{ tradition, index, stances: new Map(stances.map(stance => [stance.claim_id, stance])) }];
  });
  const commonClaimIds = participants.length ? [...participants[0].stances.keys()].filter(
    claimId => participants.every(participant => participant.stances.has(claimId)),
  ).sort() : [];
  const observedClaimIds = commonClaimIds.filter(claimId => {
    const summary = summaries.get(claimId);
    return summary && summary.evidenceCount >= 2 && summary.answeredCoverage >= .6 &&
      ['observed_support', 'observed_opposition', 'neutral'].includes(summary.status) &&
      Number.isFinite(summary.support) && Math.abs(summary.support) <= 1;
  });
  const coverage = commonClaimIds.length ? observedClaimIds.length / commonClaimIds.length : 0;
  const items = options.items || [];
  const observedDomains = new Set(items.filter(item => item.section === 'profile' &&
    observedClaimIds.includes(item.claim_id)).map(item => item.domain).filter(Boolean));
  const creedItems = items.filter(item => item.section === 'creedal');
  const creedalCoverage = creedItems.length ? creedItems.filter(
    item => getAnswerState((options.answers || {})[item.id]) === 'answered',
  ).length / creedItems.length : 0;
  const reasons = [];
  if (!participants.length) reasons.push('unverified_primary_sources_or_clauses');
  if (participants.length < 2) reasons.push('fewer_than_two_verified_profiles');
  if (observedClaimIds.length < 8) reasons.push('fewer_than_eight_observed_common_claims');
  if (observedDomains.size < 4) reasons.push('fewer_than_four_domains');
  if (coverage < .6) reasons.push('coverage_below_60_percent');
  if (creedalCoverage < .75) reasons.push('creedal_coverage_below_75_percent');
  for (const participant of participants) {
    const result = results[participant.index];
    result.coverage = coverage;
    result.used = observedClaimIds.length;
    result.unresolvedClaimIds = commonClaimIds.filter(claimId => !observedClaimIds.includes(claimId));
    let weighted = 0, weightSum = 0;
    for (const claimId of observedClaimIds) {
      const support = summaries.get(claimId).support;
      const stance = participant.stances.get(claimId);
      const match = 1 - Math.abs(support - stance.stance) / 2;
      const weight = stance.weight ?? 1;
      weighted += weight * match;
      weightSum += weight;
      if (support === 0 || stance.stance === 0) result.neutralClaimIds.push(claimId);
      else if (Math.sign(support) === Math.sign(stance.stance)) result.matchingClaimIds.push(claimId);
      else result.contrastingClaimIds.push(claimId);
    }
    if (!reasons.length) {
      result.status = 'exploratory';
      result.similarity = weighted / weightSum;
    }
  }
  const ranked = results.filter(result => result.status === 'exploratory').sort(
    (a, b) => b.similarity - a.similarity || a.traditionId.localeCompare(b.traditionId),
  );
  const topMatches = ranked.slice(0, 3);
  const mixed = ranked.length > 1 && ranked[0].similarity - ranked[1].similarity < .08 - Number.EPSILON;
  return {
    status: reasons.length ? 'withheld' : mixed ? 'mixed_profile' : 'exploratory',
    reasons, commonClaimIds, observedClaimIds, coverage, domainCount: observedDomains.size,
    creedalCoverage, results, topMatches,
  };
}

/** Legacy entry point fails closed without the multi-profile comparison context. */
export function compareTradition(tradition, claimScores, options = {}) {
  if (!tradition.can_auto_rank || tradition.status !== 'approved_clause_level') {
    return { traditionId: tradition.id, status: 'not_verified', similarity: null, coverage: 0, used: 0 };
  }
  const all = (tradition.claim_stances || []).filter(stance => stance.paragraph && !stance.paragraph.includes('REQUIRES_'));
  const used = all.filter(stance => Number.isFinite(claimScores[stance.claim_id])).length;
  const coverage = all.length ? used / all.length : 0;
  if (used < 8 || coverage < .6) {
    return { traditionId: tradition.id, status: 'insufficient_data', similarity: null, coverage, used };
  }
  if (Array.isArray(options.traditions) && Array.isArray(options.claimSummaries)) {
    return compareTraditions(options.traditions, options.claimSummaries, options).results.find(
      result => result.traditionId === tradition.id,
    ) || { traditionId: tradition.id, status: 'not_verified', similarity: null, coverage: 0, used: 0 };
  }
  return { traditionId: tradition.id, status: 'insufficient_data', similarity: null, coverage, used };
}

export function creedalReview(item, answer) {
  if (item.section !== 'creedal') return { status: 'not_applicable' };
  const observation = claimObservation(item, answer);
  if (observation.status !== 'answered') return { status: 'undetermined', sourceIds: item.source_ids };
  return { status: 'requires_crosscheck', observedSupport: observation.support, sourceIds: item.source_ids };
}

/** Check source and semantic verification before displaying any interpretation. */
export function corroboratedCreedalObservation(creedItem, answers, relations, itemIndex) {
  const own = claimObservation(creedItem, answers[creedItem.id]);
  if (own.status !== 'answered') return { status: 'undetermined', support: null, evidence: [] };
  const support = own.support;
  const link = relations.find(relation => relation.creedal_item_id === creedItem.id);
  if (!link) return { status: 'requires_crosscheck', support, evidence: [] };
  const evidence = [];
  const seenIds = new Set([creedItem.id]);
  const seenMeaning = new Set([evidenceKey(creedItem)]);
  for (const relation of link.related_items) {
    if (!['equivalent', 'opposes'].includes(relation.relation)) continue;
    if (relation.direction !== (relation.relation === 'equivalent' ? 1 : -1)) continue;
    const item = itemIndex[relation.item_id];
    if (!item || seenIds.has(item.id) || seenMeaning.has(evidenceKey(item))) continue;
    seenIds.add(item.id);
    seenMeaning.add(evidenceKey(item));
    const other = claimObservation(item, answers[item.id]);
    if (other.status !== 'answered') continue;
    evidence.push({ itemId: item.id, alignment: other.support * relation.direction, relation: relation.relation });
  }
  const confirms = evidence.some(value => Math.abs(value.alignment) >= .5 && Math.sign(value.alignment) === Math.sign(support));
  const conflicts = evidence.some(value => Math.abs(value.alignment) >= .5 && Math.sign(value.alignment) !== Math.sign(support));
  if (Math.abs(support) < .5 || conflicts) return { status: 'ambiguous_or_neutral', support, evidence };
  if (!confirms) return { status: 'requires_crosscheck', support, evidence };
  return {
    status: support > 0 ? 'supported_creedal_proposition' : 'candidate_tension_with_named_creed',
    support, evidence, requiresHumanReview: true,
    requiresSemanticReview: link.review_status !== 'approved',
    sourceIds: creedItem.source_ids || [],
  };
}

/** A scholar is never represented by a whole-person match to one excerpt. */
export function compareTheologians(theologians, claimSummaries, options = {}) {
  return theologians.map(theologian => {
    const verified = checkedStances(theologian, options);
    const passages = new Set(verified.map(stance => `${stance.source_id}:${stance.paragraph}`));
    const summaries = new Map(claimSummaries.map(summary => [summary.claimId, summary]));
    const observations = verified.filter(stance => {
      const summary = summaries.get(stance.claim_id);
      return summary && summary.evidenceCount >= 2 && summary.answeredCoverage >= .6 &&
        ['observed_support', 'observed_opposition', 'neutral'].includes(summary.status);
    });
    const canCompare = theologian.can_auto_rank && theologian.status === 'approved_clause_level' && passages.size >= 3;
    return {
      theologianId: theologian.id,
      status: !canCompare ? 'not_verified' : observations.length < 3 ? 'insufficient_data' : 'partial_affinity',
      scope: 'verified_passages_only',
      evidence: canCompare ? observations.map(stance => ({ ...stance, observedSupport: summaries.get(stance.claim_id).support })) : [],
      similarity: null,
    };
  });
}

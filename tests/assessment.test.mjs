import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAnswerState,claimObservation,compareTradition,compareTraditions,creedalReview } from '../src/lib/assessment.mjs';

test('unknown, neutral and unanswered never collapse',()=>{
 assert.equal(getAnswerState('unknown'),'unknown');
 assert.equal(getAnswerState(3),'answered');
 assert.equal(getAnswerState(undefined),'skipped');
 assert.equal(getAnswerState(null),'skipped');
 assert.equal(getAnswerState(99),'invalid');
});

test('likert supports independent and compatible doctrines',()=>{
 const penal=claimObservation({claim_id:'C05.claim1',section:'profile',source_ids:[]},5);
 const victory=claimObservation({claim_id:'C05.claim2',section:'profile',source_ids:[]},5);
 assert.equal(penal.support,1);assert.equal(victory.support,1);
});

test('creedal single answer never brands a person with a heresy label',()=>{
 const r=creedalReview({id:'K01',claim_id:'creedal.k01',section:'creedal',source_ids:['NICENE381']},1);
 assert.equal(r.status,'requires_crosscheck');assert.ok(!JSON.stringify(r).includes('heretic'));
});

test('traditions stay unrankable until clause-level review',()=>{
 const r=compareTradition({id:'reformed_wcf',status:'provisional_clause_review',can_auto_rank:false,claim_stances:[]},{});
 assert.equal(r.status,'not_verified');assert.equal(r.similarity,null);
});

test('traditions with too little data never receive numerical matching',()=>{
 const r=compareTradition({id:'sample',status:'approved_clause_level',can_auto_rank:true,claim_stances:[{claim_id:'G01.claim1',stance:1,paragraph:'§1'}]},{'G01.claim1':1});
 assert.equal(r.status,'insufficient_data');assert.equal(r.similarity,null);
});

test('verified traditions may be compared exploratorily on a common single-item claim set',()=>{
 const ids=['G01.claim1','C01.claim1','H02.claim2','H03.claim2','H04.claim3','H05.claim1','H06.claim1','E03.claim1'];
 const traditions=['a','b'].map((id,index)=>({id,status:'approved_clause_level',can_auto_rank:true,claim_stances:ids.map(claim_id=>({claim_id,stance:index&&['H04.claim3','H06.claim1'].includes(claim_id)?-1:1,source_id:id,paragraph:`${id}-${claim_id}`}))}));
 const summaries=ids.map(claimId=>({claimId,status:'single_item',support:1,evidenceCount:1,answeredCoverage:1}));
 const items=ids.map((claim_id,index)=>({id:`I${index}`,claim_id,section:'profile',domain:['신론','기독론','인간론','교회론'][index%4]})).concat(Array.from({length:12},(_,index)=>({id:`K${index}`,section:'creedal'})));
 const answers=Object.fromEntries(items.map(item=>[item.id,5]));
 const verifiedClauses=traditions.flatMap(t=>t.claim_stances.map(s=>({...s,status:'approved_clause_level'})));
 const result=compareTraditions(traditions,summaries,{items,answers,approvedSourceIds:['a','b'],verifiedClauses});
 assert.notEqual(result.status,'withheld');
 assert.equal(result.commonClaimIds.length,8);
 assert.equal(result.singleItemBasis,true);
 assert.equal(result.topMatches[0].traditionId,'a');
});

test('two independent equivalent negative claims can trigger only a review candidate',async()=>{
 const {corroboratedCreedalObservation}=await import('../src/lib/assessment.mjs');
 const item={id:'K03',section:'creedal',claim_id:'creedal.k03',source_ids:['NICENE381']};
 const second={id:'G02-01',section:'profile',claim_id:'G02.claim1',source_ids:['NICENE381'],reverse:false};
 const relations=[{creedal_item_id:'K03',related_items:[{item_id:'G02-01',direction:1,relation:'equivalent'}]}];
 const r=corroboratedCreedalObservation(item,{K03:1,'G02-01':1},relations,{'G02-01':second});
 assert.equal(r.status,'candidate_tension_with_named_creed');
 assert.equal(r.requiresHumanReview,true);
});

test('one creedal response without corroboration stays unresolved',async()=>{
 const {corroboratedCreedalObservation}=await import('../src/lib/assessment.mjs');
 const r=corroboratedCreedalObservation({id:'K08',section:'creedal',source_ids:['NICENE381']},{K08:1},[],{});
 assert.equal(r.status,'requires_crosscheck');
});

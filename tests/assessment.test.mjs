import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAnswerState,claimObservation,compareTradition,creedalReview } from '../src/lib/assessment.mjs';

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

import {buildPositionMap} from './positions.mjs';
import {aggregateClaims,corroboratedCreedalObservation,compareTraditions,compareTheologians} from '../src/lib/assessment.mjs';
export function buildReport({items,topics,sources,traditions,theologians,relations,verification},snapshot){
 const {answers,confidences}=snapshot,index=Object.fromEntries(items.map(item=>[item.id,item]));
 const claims=aggregateClaims(items,answers,confidences);
 const creedal=items.filter(item=>item.section==='creedal').map(item=>{
  const evidence=(verification.creedal_evidence||[]).filter(e=>e.item_id===item.id);
  const result=corroboratedCreedalObservation(item,answers,relations,index);
  const hasSource=evidence.some(e=>e.status==='verified_clause'&&e.supports_full_statement===true&&e.paragraph&&e.url?.startsWith('https://'));
  return {item,result,evidence,semanticReview:relations.find(r=>r.creedal_item_id===item.id)?.review_status||'missing',displayStatus:hasSource?result.status:'source_unverified'};
 });
 // Documentary inspection must not be promoted into expert approval automatically.
 const options={items,answers,approvedSourceIds:[],verifiedClauses:[]};
 return {positionMap:buildPositionMap(items,topics,answers),claims,creedal,items,topics,sources,traditions,theologians,relations,comparison:compareTraditions(traditions,claims,options),scholarComparison:compareTheologians(theologians,claims,options),audit:verification};
}

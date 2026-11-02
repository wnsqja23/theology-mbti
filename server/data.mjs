import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const read=name=>JSON.parse(fs.readFileSync(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
export const items=read('items'),topics=read('topics'),extras=read('conditional_items'),sources=read('sources'),traditions=read('traditions'),theologians=read('theologians'),relations=read('claim_links');
export const audit=()=>{try{return {...read('source_verification'),tradition_verification:read('verified_tradition_clauses')}}catch{return {sources:[],creedal_evidence:[],tradition_verification:{approved_source_ids:[],clauses:[]}}}};
// Only these fields may leave the question boundary. No analysis modules are imported by the client.
export function questions(){
 const ordered=[];
 for(const domain of [...new Set(topics.map(t=>t.domain))]){
  const base=items.filter(i=>i.domain===domain&&i.section==='profile');
  const core=items.filter(i=>i.domain===domain&&i.section==='creedal');
  base.forEach((item,index)=>{ordered.push(item);if(index%3===2&&core.length)ordered.push(core.shift())});
  ordered.push(...core);
 }
 return {items:ordered.map(({id,domain,topic_id,statement})=>({id,domain,topic_id,statement})),topics:topics.map(({id,domain,name})=>({id,domain,name})),extras:extras.map(({id,domain,prompt,selection_mode,choices})=>({id,domain,prompt,selection_mode,choices:choices.map(({id,text})=>({id,text}))}))};
}
export const root=fileURLToPath(new URL('../',import.meta.url));

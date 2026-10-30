import fs from 'node:fs';
import path from 'node:path';
const project = path.resolve(import.meta.dirname,'..');
const j=(name)=>JSON.parse(fs.readFileSync(path.join(project,'data',name),'utf8'));
const [items,topics,sources,extras,traditions,theologians,creedal]=['items.json','topics.json','sources.json','conditional_items.json','traditions.json','theologians.json','creedal_checks.json'].map(j);
const errors=[];
const assert=(b,m)=>{if(!b)errors.push(m)};
const unique=(xs,m)=>assert(new Set(xs).size===xs.length,`${m} id duplicated`);
const domains=['신론','인간론','기독론','성령론','교회론','종말론'];
unique(items.map(x=>x.id),'item');unique(topics.map(x=>x.id),'topic');unique(sources.map(x=>x.id),'source');unique(extras.map(x=>x.id),'conditional');
assert(items.length===120,`expected 120 basic items but ${items.length}`);
assert(topics.length===36,`expected 36 topics but ${topics.length}`);
assert(extras.length===12,`expected 12 conditional items but ${extras.length}`);
assert(items.filter(x=>x.section==='profile').length===108,'expected 108 profile statements');
assert(items.filter(x=>x.section==='creedal').length===12,'expected 12 creedal items');
const topicIds=new Set(topics.map(x=>x.id)),sourceIds=new Set(sources.map(x=>x.id)),itemIds=new Set(items.map(x=>x.id));
for(const d of domains) assert(items.filter(x=>x.domain===d&&x.section==='profile').length===18,`${d} should have 18 profile items`);
for(const t of topics){assert(domains.includes(t.domain),`unknown topic domain ${t.id}`);assert(items.filter(x=>x.topic_id===t.id).length===3,`${t.id}: must have 3 unique items`); for(const s of t.source_ids)assert(sourceIds.has(s),`${t.id}: missing source ${s}`)}
for(const x of items){assert(x.statement&&x.statement.length>=20,`${x.id} missing/short text`);assert(x.kind==='likert',`${x.id} wrong input type`);assert(x.section==='creedal'||topicIds.has(x.topic_id),`${x.id} unknown topic`);assert(Array.isArray(x.source_ids)&&x.source_ids.every(s=>sourceIds.has(s)),`${x.id} unknown source`);assert(x.review_status!=='approved',`${x.id} cannot be approved without expert verification`)}
unique(items.map(x=>x.statement),'item statement');
for(const x of extras){assert(['single','multi'].includes(x.selection_mode),`${x.id} invalid multi/single choice`);assert(x.choices.length>=4,`${x.id} too few choices`);assert(x.choices.every(c=>c.text.length>12),`${x.id} short choice`);assert(x.source_ids.every(s=>sourceIds.has(s)),`${x.id} missing source`)}
for(const t of traditions){assert(t.can_auto_rank===false,`${t.id} must be unrankable until approved`);for(const a of t.claim_stances){assert(sourceIds.has(a.source_id),`${t.id} unknown evidence source`);assert(items.some(x=>x.claim_id===a.claim_id),`${t.id} unknown claim ${a.claim_id}`)}}
for(const t of theologians){assert(t.can_auto_rank===false,`${t.id} must be unrankable pending primary-source review`)}
for(const c of creedal){assert(itemIds.has(c.id),`${c.id} no core item`);assert(sourceIds.has(c.source_id),`${c.id} unknown source`)}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log(`Data validation OK: ${items.length} items / ${topics.length} topics / ${extras.length} conditional / ${sources.length} sources / ${traditions.length} traditions / ${theologians.length} theologians`);
// Validate the semantic-link graph and audit sidecar without editing seed claims.
const links=j('claim_links.json'),audit=j('source_verification.json');
const linkErrors=[];
for(const link of links){
 if(!items.some(i=>i.id===link.creedal_item_id&&i.section==='creedal'))linkErrors.push(`unknown core ${link.creedal_item_id}`);
 for(const relation of link.related_items){
  if(!itemIds.has(relation.item_id))linkErrors.push(`unknown related item ${relation.item_id}`);
  if(!['equivalent','opposes','supports_component'].includes(relation.relation))linkErrors.push(`unknown relation ${relation.relation}`);
  if(![-1,1].includes(relation.direction))linkErrors.push(`invalid direction ${relation.item_id}`);
 }
}
for(const record of audit.sources)if(!sourceIds.has(record.source_id))linkErrors.push(`unknown audited source ${record.source_id}`);
for(const record of audit.creedal_evidence)if(!itemIds.has(record.item_id)||!sourceIds.has(record.source_id)||!record.paragraph||!record.url.startsWith('https://'))linkErrors.push(`invalid source clause ${record.item_id}`);
if(linkErrors.length){console.error(linkErrors.join('\n'));process.exitCode=1}else console.log(`Reference audit OK: ${links.length} core relations / ${audit.sources.length} source inspections / ${audit.creedal_evidence.length} core source records`);

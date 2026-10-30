import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildPositionMap} from '../server/positions.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL(`../data/${n}.json`,import.meta.url)));
const items=read('items'),topics=read('topics');
const map=answers=>buildPositionMap(items,topics,answers);
const entry=(result,id)=>result.topics.flatMap(t=>t.entries).find(e=>e.itemId===id);
test('all 108 statements appear unchanged in their own topic and domain, no averaged score',()=>{
 const r=map(Object.fromEntries(items.map(i=>[i.id,5])));
 assert.equal(r.topics.length,36);const es=r.topics.flatMap(t=>t.entries);assert.equal(es.length,108);
 for(const t of r.topics){assert.equal(t.entries.length,3);for(const e of t.entries){const i=items.find(i=>i.id===e.itemId);assert.equal(e.statement,i.statement);assert.equal(i.topic_id,t.id);assert.equal(i.domain,t.domain);assert.equal(e.evidence,'single_item')}}
 assert.equal('score' in r,false);assert.ok(es.every(e=>!('similarity' in e)));
});
test('neutral, unknown, not applicable, missing and invalid never become a centrist position',()=>{
 const r=map({'H04-01':3,'H04-02':'unknown','H04-03':null,'P03-01':'n/a','P03-02':6});
 assert.equal(entry(r,'H04-01').state,'conditional');assert.equal(entry(r,'H04-02').state,'unknown');assert.equal(entry(r,'H04-03').state,'unanswered');assert.equal(entry(r,'P03-01').state,'not_applicable');assert.equal(entry(r,'P03-02').answer,null);assert.equal(r.highlights.length,0);
});
test('simultaneous atonement models and sanctification views remain visible',()=>{
 const r=map({'C05-01':5,'C05-02':4,'C05-03':5,'H06-01':5,'H06-02':5});
 assert.ok(r.topics.find(t=>t.id==='C05').entries.every(e=>e.state==='agree'));
 assert.ok(r.highlights.some(e=>e.itemId==='H06-01'));assert.ok(r.highlights.some(e=>e.itemId==='H06-02'));
});
test('tongues requirement and current gifts are independent directions, never a church label',()=>{
 const r=map({'P03-01':1,'P04-01':5});assert.equal(entry(r,'P03-01').state,'disagree');assert.equal(entry(r,'P04-01').state,'agree');assert.equal(r.highlights.length,2);assert.equal('traditionId' in r,false);
});
test('opposing responses are not hidden in overview or averaged away',()=>{
 const r=map({'H04-01':5,'H04-03':5,'E03-01':5,'E03-02':5});assert.equal(r.highlights.length,4);assert.equal(entry(r,'H04-01').answer,5);assert.equal(entry(r,'H04-03').answer,5);
});
test('source parallels reference real statements, sources and clauses without asserting approval',()=>{
 for(const r of read('position_references')){assert.ok(items.some(i=>i.id===r.itemId&&i.source_ids.includes(r.sourceId)));assert.ok(read('sources').some(s=>s.id===r.sourceId));assert.ok(r.url.startsWith('https://'));assert.ok(r.paragraph&&!r.paragraph.includes('REQUIRES'));assert.equal(r.status,'document_checked_semantic_review_pending')}
});
test('empty map does not fabricate a profile or highlight',()=>{const r=map({});assert.equal(r.highlights.length,0);assert.ok(r.topics.every(t=>t.entries.every(e=>e.state==='unanswered'&&e.answer===null)))});
test('editorial headings remain attached to item IDs when source order changes',()=>{const r=buildPositionMap([...items].reverse(),topics,{'E03-01':5});assert.equal(entry(r,'E03-01').label,'유아세례의 허용');assert.equal(entry(r,'E03-02').label,'신앙고백자에게만 베푸는 세례')});
